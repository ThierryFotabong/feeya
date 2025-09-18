const express = require('express');
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();
const prisma = new PrismaClient();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { customerId, basketId, addressId, substitutionAllowed } = paymentIntent.metadata;

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: paymentIntent.id
      }
    });

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID' }
    });

    // Create payment success event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'payment_succeeded',
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      }
    });

    console.log(`Payment succeeded for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: paymentIntent.id
      }
    });

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        paymentStatus: 'FAILED',
        status: 'CANCELLED'
      }
    });

    // Create payment failed event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'payment_failed',
        metadata: {
          paymentIntentId: paymentIntent.id,
          failureCode: paymentIntent.last_payment_error?.code,
          failureMessage: paymentIntent.last_payment_error?.message
        }
      }
    });

    console.log(`Payment failed for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: paymentIntent.id
      }
    });

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: 'CANCELLED'
      }
    });

    // Create payment canceled event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'payment_canceled',
        metadata: {
          paymentIntentId: paymentIntent.id
        }
      }
    });

    console.log(`Payment canceled for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Handle payment canceled error:', error);
  }
}

// Handle charge dispute
async function handleChargeDispute(dispute) {
  try {
    const paymentIntentId = dispute.payment_intent;
    
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId
      }
    });

    if (!order) {
      console.error('Order not found for dispute:', dispute.id);
      return;
    }

    // Create dispute event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'dispute_created',
        metadata: {
          disputeId: dispute.id,
          reason: dispute.reason,
          amount: dispute.amount,
          currency: dispute.currency
        }
      }
    });

    console.log(`Dispute created for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Handle charge dispute error:', error);
  }
}

module.exports = router;
