# Feeya Grocery Delivery App

A comprehensive grocery delivery application built with modern web technologies, focusing on core shopping features including product browsing, cart management, order processing, and real-time delivery tracking.

## 📚 Documentation

This project includes comprehensive documentation for developers and integrators:

### 📖 Core Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference with examples
- **[Component Documentation](docs/COMPONENT_DOCUMENTATION.md)** - React components with props and usage
- **[Function Documentation](docs/FUNCTION_DOCUMENTATION.md)** - Utility functions and services
- **[Usage Examples](docs/USAGE_EXAMPLES.md)** - Integration guides and implementation examples

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/feeya-grocery-app.git
cd feeya-grocery-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application running.

## ✨ Features

### 🛒 Core Shopping Features
- **Product Browsing**: Advanced filtering, sorting, and search capabilities
- **Shopping Cart**: Persistent cart with real-time updates
- **Checkout Process**: Multi-step checkout with validation
- **Order Management**: Complete order lifecycle management
- **User Authentication**: Secure login/registration with social auth

### 📱 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live order tracking with Pusher integration
- **Notifications**: In-app and browser notifications
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Optimized with Next.js and caching strategies

### 🔧 Technical Features
- **TypeScript**: Full type safety throughout the application
- **Next.js 13+**: App Router with server-side rendering
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with refresh tokens
- **Payments**: Stripe integration for secure payments
- **File Uploads**: Cloudinary integration for images
- **Testing**: Jest and React Testing Library

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Custom API client with interceptors

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Real-time**: Pusher

### Third-party Integrations
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Analytics**: Google Analytics 4
- **Error Tracking**: Sentry
- **Monitoring**: Vercel Analytics

## 📁 Project Structure

```
feeya-grocery-app/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # Authentication routes
│   ├── (shop)/            # Shopping routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── cart/              # Shopping cart components
│   ├── products/          # Product components
│   ├── orders/            # Order components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── services/              # API services
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation files
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── tests/                 # Test files
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/feeya"

# Authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# External Services
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
GOOGLE_MAPS_API_KEY="AIza..."
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_PUSHER_APP_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@feeya.com"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Performance

- **Core Web Vitals**: Optimized for excellent scores
- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized with code splitting
- **Database**: Indexed queries with connection pooling
- **Caching**: Redis for session and API caching
- **CDN**: Static assets served via CDN

## 🔒 Security

- **Authentication**: Secure JWT implementation
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **HTTPS**: TLS encryption for all connections
- **CSRF Protection**: Built-in CSRF protection
- **Rate Limiting**: API rate limiting
- **SQL Injection**: Parameterized queries with Prisma

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure accessibility compliance
- Maintain documentation updates

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: support@feeya.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Stripe](https://stripe.com/) for secure payments
- [Vercel](https://vercel.com/) for hosting and deployment
- All the open-source contributors who made this possible

---

Built with ❤️ by the Feeya team
