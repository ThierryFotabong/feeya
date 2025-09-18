const request = require('supertest');
const { app } = require('../index');

describe('Feeya API Tests', () => {
  let authToken;
  let customerId;

  describe('Health Check', () => {
    test('GET /health should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Product Endpoints', () => {
    test('GET /api/products/categories should return categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
    });

    test('GET /api/products/search should return search results', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'fufu' })
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /api/products/popular should return popular products', async () => {
      const response = await request(app)
        .get('/api/products/popular')
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/send-otp should send OTP', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '+32412345678' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/auth/verify-otp should verify OTP (development mode)', async () => {
      // In development mode, the OTP is returned in the response
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '+32412345678' });

      if (otpResponse.body.otp) {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ 
            phone: '+32412345678', 
            code: otpResponse.body.otp 
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.customer).toBeDefined();

        authToken = response.body.token;
        customerId = response.body.customer.id;
      }
    });
  });

  describe('Cart Endpoints', () => {
    beforeEach(() => {
      if (!authToken) {
        // Skip tests if not authenticated
        return;
      }
    });

    test('GET /api/cart should return empty cart for new user', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.basket).toBeDefined();
      expect(response.body.basket.items).toEqual([]);
    });

    test('POST /api/cart/add should add item to cart', async () => {
      if (!authToken) return;

      // First, get a product ID
      const productsResponse = await request(app)
        .get('/api/products/popular')
        .expect(200);

      if (productsResponse.body.products.length > 0) {
        const productId = productsResponse.body.products[0].id;

        const response = await request(app)
          .post('/api/cart/add')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ productId, quantity: 1 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBeDefined();
      }
    });
  });

  describe('Order Endpoints', () => {
    beforeEach(() => {
      if (!authToken) {
        return;
      }
    });

    test('GET /api/orders should return user orders', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /api/orders/stats/summary should return order statistics', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/orders/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalOrders).toBeDefined();
    });
  });

  describe('Address Endpoints', () => {
    beforeEach(() => {
      if (!authToken) {
        return;
      }
    });

    test('GET /api/addresses should return user addresses', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.addresses).toBeDefined();
      expect(Array.isArray(response.body.addresses)).toBe(true);
    });

    test('POST /api/addresses/validate should validate address', async () => {
      const response = await request(app)
        .post('/api/addresses/validate')
        .send({
          street: 'Rue de la Paix',
          number: '1',
          postalCode: '1000',
          city: 'Brussels'
        })
        .expect(200);

      expect(response.body.valid).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('GET /api/products/invalid-id should return 404', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    test('POST /api/cart/add without authentication should return 400', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({ productId: 'invalid', quantity: 1 })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
