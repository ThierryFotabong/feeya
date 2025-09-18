const express = require('express');
const { PrismaClient } = require('@prisma/client');
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
  lng: Joi.number().optional(),
  isDefault: Joi.boolean().default(false)
});

// Helper function to validate address with Google Places
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
    return { valid: true, formattedAddress: null }; // Fallback to allow address
  }
}

// Helper function to check delivery zone
async function checkDeliveryZone(postalCode) {
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

// GET /api/addresses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { customerId },
      select: {
        id: true,
        street: true,
        number: true,
        apartment: true,
        postalCode: true,
        city: true,
        country: true,
        lat: true,
        lng: true,
        isDefault: true,
        createdAt: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ addresses });

  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/addresses
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = value;
    const customerId = req.user.id;

    // Validate address with Google Places
    const validation = await validateAddressWithGooglePlaces(address);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error || 'Invalid address',
        valid: false
      });
    }

    // Check delivery zone
    const deliveryZone = await checkDeliveryZone(address.postalCode);
    if (!deliveryZone) {
      return res.status(400).json({ 
        error: 'Delivery not available in this area',
        valid: false
      });
    }

    // If this is set as default, unset other defaults
    if (address.isDefault) {
      await prisma.address.updateMany({
        where: { 
          customerId,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    // Create address
    const newAddress = await prisma.address.create({
      data: {
        customerId,
        street: address.street,
        number: address.number,
        apartment: address.apartment,
        postalCode: address.postalCode,
        city: address.city,
        lat: validation.lat || address.lat,
        lng: validation.lng || address.lng,
        isDefault: address.isDefault
      },
      select: {
        id: true,
        street: true,
        number: true,
        apartment: true,
        postalCode: true,
        city: true,
        country: true,
        lat: true,
        lng: true,
        isDefault: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      address: newAddress
    });

  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// PUT /api/addresses/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = addressSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = value;
    const customerId = req.user.id;

    // Check if address exists and belongs to customer
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Validate address with Google Places
    const validation = await validateAddressWithGooglePlaces(address);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error || 'Invalid address',
        valid: false
      });
    }

    // Check delivery zone
    const deliveryZone = await checkDeliveryZone(address.postalCode);
    if (!deliveryZone) {
      return res.status(400).json({ 
        error: 'Delivery not available in this area',
        valid: false
      });
    }

    // If this is set as default, unset other defaults
    if (address.isDefault) {
      await prisma.address.updateMany({
        where: { 
          customerId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        street: address.street,
        number: address.number,
        apartment: address.apartment,
        postalCode: address.postalCode,
        city: address.city,
        lat: validation.lat || address.lat,
        lng: validation.lng || address.lng,
        isDefault: address.isDefault
      },
      select: {
        id: true,
        street: true,
        number: true,
        apartment: true,
        postalCode: true,
        city: true,
        country: true,
        lat: true,
        lng: true,
        isDefault: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    // Check if address exists and belongs to customer
    const address = await prisma.address.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Check if address is used in any orders
    const orderCount = await prisma.order.count({
      where: { addressId: id }
    });

    if (orderCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete address that has been used in orders'
      });
    }

    // Delete address
    await prisma.address.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// POST /api/addresses/:id/set-default
router.post('/:id/set-default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    // Check if address exists and belongs to customer
    const address = await prisma.address.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset all other default addresses
    await prisma.address.updateMany({
      where: { 
        customerId,
        isDefault: true
      },
      data: { isDefault: false }
    });

    // Set this address as default
    await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({
      success: true,
      message: 'Default address updated successfully'
    });

  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// POST /api/addresses/validate
router.post('/validate', async (req, res) => {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const address = value;

    // Validate address with Google Places
    const validation = await validateAddressWithGooglePlaces(address);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error || 'Invalid address',
        valid: false
      });
    }

    // Check delivery zone
    const deliveryZone = await checkDeliveryZone(address.postalCode);
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
    console.error('Validate address error:', error);
    res.status(500).json({ error: 'Failed to validate address' });
  }
});

module.exports = router;
