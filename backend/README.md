# Feeya Backend API

A comprehensive backend API for the Feeya grocery delivery app, built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- 🛍️ **Product Management**: Full CRUD operations with search and filtering
- 🛒 **Shopping Cart**: Session-based cart with real-time updates
- 💳 **Payment Processing**: Stripe integration with Apple Pay, Google Pay, and Bancontact
- 📱 **Phone OTP Authentication**: Secure authentication via SMS
- 🗺️ **Address Management**: Google Places integration for address validation
- 📦 **Order Tracking**: Complete order lifecycle management
- 🔍 **Search Engine**: Meilisearch integration for fast product search
- 🌍 **Delivery Zones**: Configurable delivery areas and pricing
- 🔄 **Substitutions**: Product substitution management
- 📊 **Analytics**: Event tracking and order statistics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Search**: Meilisearch
- **Payments**: Stripe
- **SMS**: Twilio
- **Maps**: Google Places API
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Meilisearch instance
- Stripe account
- Twilio account (for SMS)
- Google Places API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate
   
   # Seed the database with sample data
   npm run seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/feeya_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"

# Google Places API
GOOGLE_PLACES_API_KEY="AIza..."

# Server
PORT=3001
NODE_ENV="development"

# Feature Flags
ENABLE_APPLE_PAY=true
ENABLE_GOOGLE_PAY=true
ENABLE_BANCONTACT=true
ENABLE_SUBSTITUTIONS=false
ENABLE_FILTERS=false
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP code
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products/search` - Search products
- `GET /api/products/categories` - Get product categories
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/:id` - Get product details
- `GET /api/products/popular` - Get popular products

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:productId` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Checkout
- `GET /api/checkout/delivery-info` - Get delivery information
- `POST /api/checkout/validate-address` - Validate delivery address
- `POST /api/checkout/create-payment-intent` - Create payment intent
- `POST /api/checkout/confirm-payment` - Confirm payment

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id/track` - Track order status
- `POST /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats/summary` - Get order statistics

### Addresses
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `POST /api/addresses/:id/set-default` - Set default address
- `POST /api/addresses/validate` - Validate address

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Database Schema

The database includes the following main entities:

- **Products**: Product catalog with categories, pricing, and inventory
- **Customers**: User accounts with phone-based authentication
- **Addresses**: Delivery addresses with validation
- **Baskets**: Shopping cart functionality
- **Orders**: Order management with status tracking
- **Delivery Zones**: Configurable delivery areas
- **Substitutions**: Product substitution rules

## Search Integration

The API integrates with Meilisearch for fast product search:

- Full-text search across product names and descriptions
- Category filtering
- Price range filtering
- Dietary restrictions filtering
- Allergen filtering
- Autocomplete suggestions

## Payment Integration

Stripe integration supports:

- Credit/Debit cards
- Apple Pay (when enabled)
- Google Pay (when enabled)
- Bancontact (when enabled)
- Webhook handling for payment events
- Refund processing

## Security Features

- JWT-based authentication
- Rate limiting on sensitive endpoints
- Input validation with Joi
- CORS protection
- Helmet security headers
- Phone OTP verification
- Address validation

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
# Create a new migration
npm run migrate:create

# Apply migrations
npm run migrate

# Reset database
npm run migrate:reset
```

### Seeding Data
```bash
# Seed with sample data
npm run seed
```

## Deployment

### Production Considerations

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use a managed PostgreSQL service
3. **Meilisearch**: Use a managed Meilisearch instance
4. **Stripe**: Use live API keys and configure webhooks
5. **Twilio**: Use production credentials
6. **Monitoring**: Set up error tracking and logging
7. **SSL**: Use HTTPS in production
8. **Rate Limiting**: Configure appropriate rate limits

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

## API Documentation

For detailed API documentation, see the individual route files in `src/routes/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
