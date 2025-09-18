const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe payment intent for an order
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (default: 'eur')
 * @param {string} params.customerId - Customer ID
 * @param {string} params.basketId - Basket ID
 * @param {string} params.addressId - Address ID
 * @param {boolean} params.substitutionAllowed - Whether substitutions are allowed
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Stripe payment intent
 */
async function createPaymentIntent({
  amount,
  currency = 'eur',
  customerId,
  basketId,
  addressId,
  substitutionAllowed = false,
  metadata = {}
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: [
        'card',
        ...(process.env.ENABLE_APPLE_PAY === 'true' ? ['apple_pay'] : []),
        ...(process.env.ENABLE_GOOGLE_PAY === 'true' ? ['google_pay'] : []),
        ...(process.env.ENABLE_BANCONTACT === 'true' ? ['bancontact'] : [])
      ],
      metadata: {
        customerId,
        basketId,
        addressId,
        substitutionAllowed: substitutionAllowed.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
}

/**
 * Confirm a Stripe payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Confirmed payment intent
 */
async function confirmPaymentIntent(paymentIntentId, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId
    });

    return paymentIntent;
  } catch (error) {
    console.error('Confirm payment intent error:', error);
    throw new Error('Failed to confirm payment intent');
  }
}

/**
 * Create a Stripe customer
 * @param {Object} customerData - Customer data
 * @param {string} customerData.email - Customer email
 * @param {string} customerData.phone - Customer phone
 * @param {string} customerData.name - Customer name
 * @returns {Promise<Object>} Stripe customer
 */
async function createStripeCustomer({ email, phone, name }) {
  try {
    const customer = await stripe.customers.create({
      email,
      phone,
      name,
      metadata: {
        source: 'feeya_app'
      }
    });

    return customer;
  } catch (error) {
    console.error('Create Stripe customer error:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

/**
 * Create a payment method for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Attached payment method
 */
async function attachPaymentMethod(customerId, paymentMethodId) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    return paymentMethod;
  } catch (error) {
    console.error('Attach payment method error:', error);
    throw new Error('Failed to attach payment method');
  }
}

/**
 * Get customer's payment methods
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Array>} Customer's payment methods
 */
async function getCustomerPaymentMethods(customerId) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Get payment methods error:', error);
    throw new Error('Failed to get payment methods');
  }
}

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund in cents (optional, full refund if not provided)
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund object
 */
async function createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason
    });

    return refund;
  } catch (error) {
    console.error('Create refund error:', error);
    throw new Error('Failed to create refund');
  }
}

/**
 * Get payment intent details
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent details
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Get payment intent error:', error);
    throw new Error('Failed to get payment intent');
  }
}

/**
 * Check if payment method is supported
 * @param {string} type - Payment method type
 * @returns {boolean} Whether the payment method is supported
 */
function isPaymentMethodSupported(type) {
  const supportedMethods = ['card'];
  
  if (process.env.ENABLE_APPLE_PAY === 'true') {
    supportedMethods.push('apple_pay');
  }
  
  if (process.env.ENABLE_GOOGLE_PAY === 'true') {
    supportedMethods.push('google_pay');
  }
  
  if (process.env.ENABLE_BANCONTACT === 'true') {
    supportedMethods.push('bancontact');
  }

  return supportedMethods.includes(type);
}

/**
 * Get available payment methods for the current configuration
 * @returns {Array} Available payment methods
 */
function getAvailablePaymentMethods() {
  const methods = [
    { type: 'card', name: 'Credit/Debit Card', enabled: true }
  ];

  if (process.env.ENABLE_APPLE_PAY === 'true') {
    methods.push({ type: 'apple_pay', name: 'Apple Pay', enabled: true });
  }

  if (process.env.ENABLE_GOOGLE_PAY === 'true') {
    methods.push({ type: 'google_pay', name: 'Google Pay', enabled: true });
  }

  if (process.env.ENABLE_BANCONTACT === 'true') {
    methods.push({ type: 'bancontact', name: 'Bancontact', enabled: true });
  }

  return methods;
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  createStripeCustomer,
  attachPaymentMethod,
  getCustomerPaymentMethods,
  createRefund,
  getPaymentIntent,
  isPaymentMethodSupported,
  getAvailablePaymentMethods
};
