const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(10).required()
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(10).required()
});

const removeFromCartSchema = Joi.object({
  productId: Joi.string().required()
});

// Helper function to get or create basket
async function getOrCreateBasket(sessionId, customerId = null) {
  let basket = await prisma.basket.findFirst({
    where: {
      OR: [
        { sessionId },
        { customerId }
      ]
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              size: true,
              price: true,
              unitPrice: true,
              availability: true,
              stock: true
            }
          }
        }
      }
    }
  });

  if (!basket) {
    basket = await prisma.basket.create({
      data: {
        sessionId,
        customerId,
        subtotal: 0
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                size: true,
                price: true,
                unitPrice: true,
                availability: true,
                stock: true
              }
            }
          }
        }
      }
    });
  }

  return basket;
}

// Helper function to calculate basket total
async function calculateBasketTotal(basketId) {
  const items = await prisma.basketItem.findMany({
    where: { basketId },
    include: {
      product: {
        select: { price: true, availability: true, stock: true }
      }
    }
  });

  let subtotal = 0;
  const unavailableItems = [];

  for (const item of items) {
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

  await prisma.basket.update({
    where: { id: basketId },
    data: { subtotal }
  });

  return { subtotal, unavailableItems };
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const customerId = req.user?.id;

    if (!sessionId && !customerId) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    const basket = await getOrCreateBasket(sessionId, customerId);
    const { subtotal, unavailableItems } = await calculateBasketTotal(basket.id);

    // Get delivery zone info (simplified for MVP)
    const deliveryFee = 3.99;
    const freeDeliveryThreshold = 40.00;
    const total = subtotal + (subtotal >= freeDeliveryThreshold ? 0 : deliveryFee);

    res.json({
      basket: {
        id: basket.id,
        items: basket.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product
        })),
        subtotal,
        deliveryFee: subtotal >= freeDeliveryThreshold ? 0 : deliveryFee,
        freeDeliveryThreshold,
        total,
        unavailableItems
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart/add
router.post('/add', async (req, res) => {
  try {
    const { error, value } = addToCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, quantity } = value;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const customerId = req.user?.id;

    if (!sessionId && !customerId) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        availability: true,
        stock: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.availability) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        availableStock: product.stock
      });
    }

    const basket = await getOrCreateBasket(sessionId, customerId);

    // Check if item already exists in basket
    const existingItem = await prisma.basketItem.findFirst({
      where: {
        basketId: basket.id,
        productId
      }
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock for requested quantity',
          availableStock: product.stock,
          currentQuantity: existingItem.quantity
        });
      }

      await prisma.basketItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          price: product.price // Update price in case it changed
        }
      });
    } else {
      // Add new item
      await prisma.basketItem.create({
        data: {
          basketId: basket.id,
          productId,
          quantity,
          price: product.price
        }
      });
    }

    // Recalculate basket total
    const { subtotal } = await calculateBasketTotal(basket.id);

    res.json({
      success: true,
      message: 'Item added to cart',
      subtotal
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update
router.put('/update/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { error, value } = updateCartItemSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { quantity } = value;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const customerId = req.user?.id;

    if (!sessionId && !customerId) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    const basket = await getOrCreateBasket(sessionId, customerId);

    if (quantity === 0) {
      // Remove item
      await prisma.basketItem.deleteMany({
        where: {
          basketId: basket.id,
          productId
        }
      });
    } else {
      // Check stock availability
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, price: true, availability: true }
      });

      if (!product || !product.availability) {
        return res.status(400).json({ error: 'Product not available' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          availableStock: product.stock
        });
      }

      // Update quantity
      await prisma.basketItem.updateMany({
        where: {
          basketId: basket.id,
          productId
        },
        data: {
          quantity,
          price: product.price
        }
      });
    }

    // Recalculate basket total
    const { subtotal } = await calculateBasketTotal(basket.id);

    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
      subtotal
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/remove
router.delete('/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const customerId = req.user?.id;

    if (!sessionId && !customerId) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    const basket = await getOrCreateBasket(sessionId, customerId);

    await prisma.basketItem.deleteMany({
      where: {
        basketId: basket.id,
        productId
      }
    });

    // Recalculate basket total
    const { subtotal } = await calculateBasketTotal(basket.id);

    res.json({
      success: true,
      message: 'Item removed from cart',
      subtotal
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const customerId = req.user?.id;

    if (!sessionId && !customerId) {
      return res.status(400).json({ error: 'Session ID or authentication required' });
    }

    const basket = await getOrCreateBasket(sessionId, customerId);

    await prisma.basketItem.deleteMany({
      where: { basketId: basket.id }
    });

    await prisma.basket.update({
      where: { id: basket.id },
      data: { subtotal: 0 }
    });

    res.json({
      success: true,
      message: 'Cart cleared'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
