const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Import auth middleware
const { authenticateToken } = require('./auth');

// Validation schemas
const orderStatusSchema = Joi.object({
  status: Joi.string().valid('CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED').required(),
  metadata: Joi.object().optional()
});

// GET /api/orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const customerId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { customerId };
    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          address: {
            select: {
              street: true,
              number: true,
              apartment: true,
              postalCode: true,
              city: true
            }
          },
          items: {
            select: {
              name: true,
              size: true,
              quantity: true,
              price: true
            }
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: whereClause })
    ]);

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        etaBand: order.etaBand,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        address: order.address,
        items: order.items,
        latestEvent: order.events[0] || null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId
      },
      include: {
        address: {
          select: {
            street: true,
            number: true,
            apartment: true,
            postalCode: true,
            city: true,
            lat: true,
            lng: true
          }
        },
        items: {
          select: {
            name: true,
            size: true,
            quantity: true,
            price: true
          }
        },
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        etaBand: order.etaBand,
        substitutionAllowed: order.substitutionAllowed,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        address: order.address,
        items: order.items,
        timeline: order.events.map(event => ({
          event: event.event,
          timestamp: event.timestamp,
          metadata: event.metadata
        }))
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders/:id/track
router.get('/:id/track', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId
      },
      include: {
        address: {
          select: {
            street: true,
            number: true,
            apartment: true,
            postalCode: true,
            city: true
          }
        },
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Define status timeline
    const statusTimeline = [
      { status: 'CONFIRMED', label: 'Order Confirmed', description: 'Your order has been confirmed and payment processed' },
      { status: 'PREPARING', label: 'Preparing', description: 'We are preparing your order' },
      { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Your order is on its way' },
      { status: 'DELIVERED', label: 'Delivered', description: 'Your order has been delivered' }
    ];

    // Map events to timeline
    const timeline = statusTimeline.map(statusInfo => {
      const event = order.events.find(e => e.event === statusInfo.status.toLowerCase().replace('_', ' '));
      return {
        status: statusInfo.status,
        label: statusInfo.label,
        description: statusInfo.description,
        completed: order.events.some(e => e.event === statusInfo.status.toLowerCase().replace('_', ' ')),
        timestamp: event?.timestamp || null,
        metadata: event?.metadata || null
      };
    });

    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        etaBand: order.etaBand,
        address: order.address,
        timeline
      }
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Cannot cancel delivered order' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order already cancelled' });
    }

    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Create cancellation event
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        event: 'cancelled',
        metadata: {
          cancelledBy: 'customer',
          cancelledAt: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// POST /api/orders/:id/update-status (Admin only - for order management)
router.post('/:id/update-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = orderStatusSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status, metadata } = value;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status }
    });

    // Create status update event
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        event: status.toLowerCase().replace('_', ' '),
        metadata: metadata || {}
      }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders/stats (for customer dashboard)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      totalSpent
    ] = await Promise.all([
      prisma.order.count({
        where: { customerId }
      }),
      prisma.order.count({
        where: { 
          customerId,
          status: 'DELIVERED'
        }
      }),
      prisma.order.count({
        where: { 
          customerId,
          status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] }
        }
      }),
      prisma.order.aggregate({
        where: { 
          customerId,
          status: 'DELIVERED'
        },
        _sum: { total: true }
      })
    ]);

    res.json({
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent: totalSpent._sum.total || 0
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

module.exports = router;
