const express = require('express');
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Joi = require('joi');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// Import auth middleware
const { authenticateToken } = require('./auth');

// Validation schemas
const addressSchema = Joi.object({
  street: Joi.string().min(1).max(200).required(),
  number: Joi.string().min(1).max(20).required(),
  apartment: Joi.string().max(50).optional().allow(''),
  postalCode: Joi.string().pattern(/^\d{4}$/).required(),
  city: Joi.string().min(1).max(100).required(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

const contactSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().optional().allow('')
});

const paymentSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
  substitutionAllowed: Joi.boolean().default(false)
});

// Helper function to validate delivery zone
async function validateDeliveryZone(postalCode) {
  const deliveryZone = await prisma.deliveryZone.findFirst({
    where: {
      postalCodes: {
        has: postalCode
      },
      isActive: true
    }
  });

  return deliveryZone;
}

// Helper function to get ETA band
function getETABand() {
  const now = new Date();
  const hour = now.getHours();
  
  // Simple ETA logic - in production, this would be more sophisticated
  if (hour < 12) {
    return "12:00-13:00";
  } else if (hour < 16) {
    return "16:00-17:00";
  } else if (hour < 20) {
    return "20:00-21:00";
  } else {
    return "12:00-13:00"; // Next day
  }
}

// Helper function to validate Google Places address
async function validateAddressWithGooglePlaces(address) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { valid: true, formattedAddress: null };
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${address.street} ${address.number}, ${address.postalCode} ${address.city}, Belgium`,
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        valid: true,
        formattedAddress: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      };
    } else {
      return { valid: false, error: 'Address not found' };
    }
  } catch (error) {
    console.error('Google Places validation error:', error);
    return { valid: true, formattedAddress: null }; // Fallback to allow checkout
  }
}

// GET /api/checkout/delivery-info
router.get('/delivery-info', async (req, res) => {
  try {
    const { postalCode } = req.query;

    if (!postalCode) {
      return res.status(400).json({ error: 'Postal code required' });
    }

    const deliveryZone = await validateDeliveryZone(postalCode);

    if (!deliveryZone) {
      return res.status(400).json({ 
        error: 'Delivery not available in this area',
        available: false
      });
    }

    const etaBand = getETABand();

    res.json({
      available: true,
      deliveryFee: deliveryZone.deliveryFee,
      freeDeliveryThreshold: deliveryZone.freeDeliveryThreshold,
      etaBand,
      zone: {
        name: deliveryZone.name,
        postalCodes: deliveryZone.postalCodes
      }
    });

  } catch (error) {
    console.error('Delivery info error:', error);
    res.status(500).json({ error: 'Failed to get delivery info' });
  }
});

// POST /api/checkout/validate-address
router.post('/validate-address', async (req, res) => {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = value;

    // Validate with Google Places
    const validation = await validateAddressWithGooglePlaces(address);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error || 'Invalid address',
        valid: false
      });
    }

    // Check delivery zone
    const deliveryZone = await validateDeliveryZone(address.postalCode);
    if (!deliveryZone) {
      return res.status(400).json({ 
        error: 'Delivery not available in this area',
        valid: false
      });
    }

    res.json({
      valid: true,
      formattedAddress: validation.formattedAddress,
      deliveryZone: {
        name: deliveryZone.name,
        deliveryFee: deliveryZone.deliveryFee,
        freeDeliveryThreshold: deliveryZone.freeDeliveryThreshold
      }
    });

  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({ error: 'Failed to validate address' });
  }
});

// POST /api/checkout/create-payment-intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { error, value } = Joi.object({
      address: addressSchema.required(),
      contact: contactSchema.required(),
      payment: paymentSchema.required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { address, contact, payment } = value;
    const customerId = req.user.id;

    // Get customer's basket
    const basket = await prisma.basket.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                availability: true,
                stock: true
              }
            }
          }
        }
      }
    });

    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ error: 'Basket is empty' });
    }

    // Validate all items are still available
    const unavailableItems = [];
    let subtotal = 0;

    for (const item of basket.items) {
      if (!item.product.availability || item.product.stock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          name: item.product.name,
          reason: !item.product.availability ? 'out_of_stock' : 'insufficient_stock'
        });
      } else {
        subtotal += item.price * item.quantity;
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        error: 'Some items are no longer available',
        unavailableItems
      });
    }

    // Check delivery zone
    const deliveryZone = await validateDeliveryZone(address.postalCode);
    if (!deliveryZone) {
      return res.status(400).json({ error: 'Delivery not available in this area' });
    }

    // Calculate totals
    const deliveryFee = subtotal >= deliveryZone.freeDeliveryThreshold ? 0 : deliveryZone.deliveryFee;
    const total = subtotal + deliveryFee;

    // Create or update customer address
    const customerAddress = await prisma.address.upsert({
      where: {
        customerId_street_number: {
          customerId,
          street: address.street,
          number: address.number
        }
      },
      update: {
        apartment: address.apartment,
        postalCode: address.postalCode,
        city: address.city,
        lat: address.lat,
        lng: address.lng
      },
      create: {
        customerId,
        street: address.street,
        number: address.number,
        apartment: address.apartment,
        postalCode: address.postalCode,
        city: address.city,
        lat: address.lat,
        lng: address.lng
      }
    });

    // Update customer info
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: contact.name,
        email: contact.email || null
      }
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'eur',
      payment_method: payment.paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        customerId,
        basketId: basket.id,
        addressId: customerAddress.id,
        substitutionAllowed: payment.substitutionAllowed.toString()
      }
    });

    res.json({
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      },
      order: {
        subtotal,
        deliveryFee,
        total,
        etaBand: getETABand()
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    
    if (error.type === 'StripeCardError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }
});

// POST /api/checkout/confirm-payment
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful',
        status: paymentIntent.status
      });
    }

    // Get customer and basket info
    const customerId = req.user.id;
    const basket = await prisma.basket.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                size: true
              }
            }
          }
        }
      }
    });

    if (!basket) {
      return res.status(400).json({ error: 'Basket not found' });
    }

    // Create order
    const orderNumber = `FEY-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        addressId: paymentIntent.metadata.addressId,
        basketId: basket.id,
        status: 'CONFIRMED',
        subtotal: basket.subtotal,
        deliveryFee: paymentIntent.amount / 100 - basket.subtotal,
        total: paymentIntent.amount / 100,
        etaBand: getETABand(),
        substitutionAllowed: paymentIntent.metadata.substitutionAllowed === 'true',
        paymentIntentId,
        paymentStatus: 'PAID'
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      basket.items.map(item =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.product.name,
            size: item.product.size
          }
        })
      )
    );

    // Create order event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'confirmed',
        metadata: {
          paymentIntentId,
          total: order.total
        }
      }
    });

    // Clear basket
    await prisma.basketItem.deleteMany({
      where: { basketId: basket.id }
    });

    await prisma.basket.update({
      where: { id: basket.id },
      data: { subtotal: 0 }
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        etaBand: order.etaBand,
        items: orderItems.map(item => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
