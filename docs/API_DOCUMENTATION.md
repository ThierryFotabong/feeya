# Feeya Grocery Delivery API Documentation

## Overview
This document provides comprehensive documentation for all public APIs in the Feeya grocery delivery application. The APIs are designed to support core shopping features including product browsing, cart management, order processing, and delivery tracking.

## Table of Contents
- [Authentication APIs](#authentication-apis)
- [Product APIs](#product-apis)
- [Cart APIs](#cart-apis)
- [Order APIs](#order-apis)
- [User APIs](#user-apis)
- [Delivery APIs](#delivery-apis)
- [Payment APIs](#payment-apis)
- [Store APIs](#store-apis)

---

## Authentication APIs

### POST /api/auth/login
Authenticates a user and returns an access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  })
});
const data = await response.json();
```

### POST /api/auth/register
Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### POST /api/auth/refresh
Refreshes an expired access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

---

## Product APIs

### GET /api/products
Retrieves a paginated list of products with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `search` (string): Search products by name or description
- `sortBy` (string): Sort by field (name, price, popularity)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Organic Bananas",
        "description": "Fresh organic bananas, 1 lb",
        "price": 2.99,
        "category": "fruits",
        "imageUrl": "https://example.com/banana.jpg",
        "inStock": true,
        "stockQuantity": 50,
        "unit": "lb",
        "nutrition": {
          "calories": 105,
          "protein": "1.3g",
          "carbs": "27g"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

**Example Usage:**
```javascript
// Get products with filtering
const response = await fetch('/api/products?category=fruits&search=organic&page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### GET /api/products/:id
Retrieves detailed information about a specific product.

**Parameters:**
- `id` (string): Product ID

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_123",
      "name": "Organic Bananas",
      "description": "Fresh organic bananas, perfect for smoothies and snacks",
      "price": 2.99,
      "category": "fruits",
      "imageUrl": "https://example.com/banana.jpg",
      "images": [
        "https://example.com/banana1.jpg",
        "https://example.com/banana2.jpg"
      ],
      "inStock": true,
      "stockQuantity": 50,
      "unit": "lb",
      "nutrition": {
        "calories": 105,
        "protein": "1.3g",
        "carbs": "27g",
        "fiber": "3.1g",
        "sugar": "14.4g"
      },
      "reviews": {
        "averageRating": 4.5,
        "totalReviews": 123
      }
    }
  }
}
```

### GET /api/categories
Retrieves all product categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_1",
        "name": "Fruits & Vegetables",
        "slug": "fruits-vegetables",
        "imageUrl": "https://example.com/fruits.jpg",
        "productCount": 150
      },
      {
        "id": "cat_2",
        "name": "Dairy & Eggs",
        "slug": "dairy-eggs",
        "imageUrl": "https://example.com/dairy.jpg",
        "productCount": 80
      }
    ]
  }
}
```

---

## Cart APIs

### GET /api/cart
Retrieves the current user's cart.

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart_123",
      "userId": "user_123",
      "items": [
        {
          "id": "item_1",
          "productId": "prod_123",
          "product": {
            "name": "Organic Bananas",
            "price": 2.99,
            "imageUrl": "https://example.com/banana.jpg"
          },
          "quantity": 2,
          "unitPrice": 2.99,
          "totalPrice": 5.98
        }
      ],
      "subtotal": 5.98,
      "tax": 0.48,
      "deliveryFee": 3.99,
      "total": 10.45,
      "itemCount": 2
    }
  }
}
```

### POST /api/cart/items
Adds an item to the cart.

**Request Body:**
```json
{
  "productId": "prod_123",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cartItem": {
      "id": "item_1",
      "productId": "prod_123",
      "quantity": 2,
      "unitPrice": 2.99,
      "totalPrice": 5.98
    }
  }
}
```

### PUT /api/cart/items/:itemId
Updates the quantity of a cart item.

**Parameters:**
- `itemId` (string): Cart item ID

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "cartItem": {
      "id": "item_1",
      "quantity": 3,
      "totalPrice": 8.97
    }
  }
}
```

### DELETE /api/cart/items/:itemId
Removes an item from the cart.

**Parameters:**
- `itemId` (string): Cart item ID

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

### DELETE /api/cart
Clears all items from the cart.

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Order APIs

### POST /api/orders
Creates a new order from the current cart.

**Request Body:**
```json
{
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "instructions": "Leave at front door"
  },
  "paymentMethod": {
    "type": "card",
    "cardId": "card_123"
  },
  "deliveryTime": "asap"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "orderNumber": "ORD-2023-001",
      "status": "confirmed",
      "items": [...],
      "subtotal": 25.99,
      "tax": 2.08,
      "deliveryFee": 3.99,
      "total": 32.06,
      "estimatedDeliveryTime": "2023-12-01T15:30:00Z",
      "createdAt": "2023-12-01T14:00:00Z"
    }
  }
}
```

### GET /api/orders
Retrieves the user's order history.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by order status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "orderNumber": "ORD-2023-001",
        "status": "delivered",
        "total": 32.06,
        "itemCount": 5,
        "createdAt": "2023-12-01T14:00:00Z",
        "deliveredAt": "2023-12-01T15:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

### GET /api/orders/:orderId
Retrieves detailed information about a specific order.

**Parameters:**
- `orderId` (string): Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "orderNumber": "ORD-2023-001",
      "status": "delivered",
      "items": [
        {
          "productId": "prod_123",
          "name": "Organic Bananas",
          "quantity": 2,
          "unitPrice": 2.99,
          "totalPrice": 5.98
        }
      ],
      "subtotal": 25.99,
      "tax": 2.08,
      "deliveryFee": 3.99,
      "total": 32.06,
      "deliveryAddress": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345"
      },
      "timeline": [
        {
          "status": "confirmed",
          "timestamp": "2023-12-01T14:00:00Z",
          "message": "Order confirmed"
        },
        {
          "status": "preparing",
          "timestamp": "2023-12-01T14:15:00Z",
          "message": "Order is being prepared"
        },
        {
          "status": "out_for_delivery",
          "timestamp": "2023-12-01T15:00:00Z",
          "message": "Order is out for delivery"
        },
        {
          "status": "delivered",
          "timestamp": "2023-12-01T15:45:00Z",
          "message": "Order delivered successfully"
        }
      ]
    }
  }
}
```

---

## User APIs

### GET /api/user/profile
Retrieves the current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "addresses": [
        {
          "id": "addr_1",
          "type": "home",
          "street": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zipCode": "12345",
          "isDefault": true
        }
      ],
      "preferences": {
        "notifications": true,
        "emailUpdates": true,
        "smsUpdates": false
      }
    }
  }
}
```

### PUT /api/user/profile
Updates the user's profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "preferences": {
    "notifications": false,
    "emailUpdates": true,
    "smsUpdates": true
  }
}
```

### POST /api/user/addresses
Adds a new delivery address.

**Request Body:**
```json
{
  "type": "work",
  "street": "456 Business Ave",
  "city": "Corporate City",
  "state": "NY",
  "zipCode": "54321",
  "instructions": "Building entrance on the left"
}
```

---

## Delivery APIs

### GET /api/delivery/zones
Retrieves available delivery zones and their fees.

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "id": "zone_1",
        "name": "Downtown",
        "deliveryFee": 2.99,
        "minimumOrder": 15.00,
        "estimatedTime": "30-45 min"
      },
      {
        "id": "zone_2",
        "name": "Suburbs",
        "deliveryFee": 4.99,
        "minimumOrder": 25.00,
        "estimatedTime": "45-60 min"
      }
    ]
  }
}
```

### GET /api/delivery/track/:orderId
Tracks the delivery status of an order.

**Parameters:**
- `orderId` (string): Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {
      "orderId": "order_123",
      "status": "out_for_delivery",
      "estimatedArrival": "2023-12-01T15:30:00Z",
      "driver": {
        "name": "Mike Johnson",
        "phone": "+1555123456",
        "rating": 4.8
      },
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "lastUpdated": "2023-12-01T15:15:00Z"
      }
    }
  }
}
```

---

## Payment APIs

### GET /api/payment/methods
Retrieves the user's saved payment methods.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "card_123",
        "type": "card",
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2025,
        "isDefault": true
      }
    ]
  }
}
```

### POST /api/payment/methods
Adds a new payment method.

**Request Body:**
```json
{
  "type": "card",
  "token": "payment_token_from_stripe"
}
```

---

## Store APIs

### GET /api/stores
Retrieves available stores in the user's area.

**Query Parameters:**
- `latitude` (number): User's latitude
- `longitude` (number): User's longitude
- `radius` (number): Search radius in miles (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "id": "store_1",
        "name": "Fresh Market Downtown",
        "address": "789 Store St, Downtown, CA 12345",
        "distance": 2.3,
        "rating": 4.5,
        "isOpen": true,
        "hours": {
          "monday": "8:00 AM - 10:00 PM",
          "tuesday": "8:00 AM - 10:00 PM"
        }
      }
    ]
  }
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_REQUIRED`: User must be authenticated
- `AUTHORIZATION_FAILED`: User lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

---

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 24 hours and can be refreshed using the `/api/auth/refresh` endpoint.