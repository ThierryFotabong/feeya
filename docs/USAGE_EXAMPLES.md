# Feeya Grocery Delivery - Usage Examples & Integration Guide

## Overview
This document provides comprehensive usage examples and integration guides for the Feeya grocery delivery application. It includes complete implementation examples, best practices, and common integration patterns.

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication Flow](#authentication-flow)
- [Product Browsing](#product-browsing)
- [Shopping Cart Management](#shopping-cart-management)
- [Checkout Process](#checkout-process)
- [Order Management](#order-management)
- [Real-time Features](#real-time-features)
- [Mobile Integration](#mobile-integration)
- [Third-party Integrations](#third-party-integrations)
- [Error Handling Patterns](#error-handling-patterns)

---

## Getting Started

### Project Setup

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

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.feeya.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Server-side only
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE_API_KEY=your_email_api_key
```

### Basic App Structure

```tsx
// app/layout.tsx
import { AuthProvider } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Authentication Flow

### Complete Login Implementation

```tsx
// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { Link } from '@/components/ui/Link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await login(credentials);
      
      // Redirect to intended page or dashboard
      const redirectTo = router.query.redirect as string || '/dashboard';
      router.push(redirectTo);
    } catch (error) {
      console.error('Login failed:', error);
      
      if (error instanceof AuthenticationError) {
        setError('Invalid email or password');
      } else if (error instanceof AccountLockedError) {
        setError('Account is temporarily locked. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      await login({ provider });
      router.push('/dashboard');
    } catch (error) {
      setError(`${provider} login failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="space-y-6">
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <SocialLogin
            onGoogleLogin={() => handleSocialLogin('google')}
            onFacebookLogin={() => handleSocialLogin('facebook')}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

### Protected Route Implementation

```tsx
// components/auth/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'driver';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated - redirect to login
        router.push(`${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`);
      } else if (requiredRole && user.role !== requiredRole) {
        // Insufficient permissions
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, requiredRole, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

// Usage in pages
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

## Product Browsing

### Complete Product Listing with Filters

```tsx
// pages/products/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { SearchBar } from '@/components/products/SearchBar';
import { SortDropdown } from '@/components/products/SortDropdown';
import { Pagination } from '@/components/ui/Pagination';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Fetch products with current filters
  const {
    products,
    pagination,
    isLoading,
    error,
    refetch
  } = useProducts({
    search: debouncedSearchQuery,
    filters,
    sortBy,
    page: currentPage,
    limit: 24
  });

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.priceMin) params.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax) params.set('priceMax', filters.priceMax.toString());
    if (sortBy !== 'popularity') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    const newUrl = queryString ? `/products?${queryString}` : '/products';
    
    router.replace(newUrl, undefined, { shallow: true });
  }, [debouncedSearchQuery, filters, sortBy, currentPage, router]);

  // Parse URL parameters on page load
  useEffect(() => {
    const { query } = router;
    
    if (query.search) setSearchQuery(query.search as string);
    if (query.category) setFilters(prev => ({ ...prev, category: query.category as string }));
    if (query.priceMin) setFilters(prev => ({ ...prev, priceMin: Number(query.priceMin) }));
    if (query.priceMax) setFilters(prev => ({ ...prev, priceMax: Number(query.priceMax) }));
    if (query.sort) setSortBy(query.sort as SortOption);
    if (query.page) setCurrentPage(Number(query.page));
  }, [router.query]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resultCount = pagination?.totalItems || 0;
  const hasResults = resultCount > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
        </h1>
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search for products..."
          className="mb-6"
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${resultCount} products found`}
          </div>
          
          <SortDropdown
            value={sortBy}
            onChange={handleSortChange}
            options={[
              { value: 'popularity', label: 'Most Popular' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'name', label: 'Name: A to Z' },
              { value: 'rating', label: 'Highest Rated' }
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            isLoading={isLoading}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Failed to load products. Please try again.</p>
              <button
                onClick={refetch}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : hasResults ? (
            <>
              <ProductGrid products={products} />
              
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({});
                  setCurrentPage(1);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

### Product Detail Page with Related Products

```tsx
// pages/products/[id]/[slug].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticProps, GetStaticPaths } from 'next';
import { ProductDetail } from '@/components/products/ProductDetail';
import { ProductReviews } from '@/components/products/ProductReviews';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/useToast';
import { productService } from '@/services/products';

interface ProductPageProps {
  product: Product;
  relatedProducts: Product[];
  reviews: Review[];
}

export default function ProductPage({ 
  product: initialProduct, 
  relatedProducts, 
  reviews: initialReviews 
}: ProductPageProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState(initialProduct);
  const [reviews, setReviews] = useState(initialReviews);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Handle add to cart
  const handleAddToCart = async (quantity: number) => {
    try {
      setIsAddingToCart(true);
      
      await addItem(product.id, quantity);
      
      showToast({
        type: 'success',
        message: `Added ${product.name} to cart!`,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart')
        }
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast({
        type: 'error',
        message: 'Failed to add item to cart'
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        showToast({
          type: 'success',
          message: 'Removed from wishlist'
        });
      } else {
        await addToWishlist(product.id);
        showToast({
          type: 'success',
          message: 'Added to wishlist'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update wishlist'
      });
    }
  };

  // Breadcrumb items
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: product.category, href: `/products?category=${product.category}` },
    { label: product.name, href: router.asPath }
  ];

  // Handle product not found
  if (router.isFallback) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      
      <ProductDetail
        product={product}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleWishlistToggle}
        isInWishlist={isInWishlist(product.id)}
        isAddingToCart={isAddingToCart}
      />

      <div className="mt-12 space-y-12">
        <ProductReviews
          productId={product.id}
          reviews={reviews}
          onReviewSubmitted={(newReview) => {
            setReviews(prev => [newReview, ...prev]);
            // Update product rating
            setProduct(prev => ({
              ...prev,
              rating: calculateNewRating(prev.rating, prev.reviewCount, newReview.rating),
              reviewCount: prev.reviewCount + 1
            }));
          }}
        />

        <RelatedProducts
          products={relatedProducts}
          title="You might also like"
        />
      </div>
    </div>
  );
}

// Static generation for SEO and performance
export const getStaticPaths: GetStaticPaths = async () => {
  // Get most popular products for pre-generation
  const popularProducts = await productService.getProducts({
    sortBy: 'popularity',
    limit: 100
  });

  const paths = popularProducts.products.map(product => ({
    params: {
      id: product.id,
      slug: slugify(product.name)
    }
  }));

  return {
    paths,
    fallback: 'blocking' // Generate other pages on-demand
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const productId = params?.id as string;
    
    const [product, relatedProducts, reviews] = await Promise.all([
      productService.getProduct(productId),
      productService.getRelatedProducts(productId),
      reviewService.getProductReviews(productId, { limit: 10 })
    ]);

    return {
      props: {
        product,
        relatedProducts,
        reviews
      },
      revalidate: 300 // Revalidate every 5 minutes
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};
```

---

## Shopping Cart Management

### Complete Cart Implementation with Persistence

```tsx
// hooks/useCart.ts
import { useState, useEffect, useContext, createContext } from 'react';
import { cartService } from '@/services/cart';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(createEmptyCart());
  const [isLoading, setIsLoading] = useState(false);

  // Load cart on user change
  useEffect(() => {
    if (user) {
      loadUserCart();
    } else {
      loadGuestCart();
    }
  }, [user]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user && cart.items.length > 0) {
      storage.set('guest_cart', cart, { storage: 'localStorage' });
    }
  }, [cart, user]);

  const loadUserCart = async () => {
    try {
      setIsLoading(true);
      const userCart = await cartService.getCart();
      
      // Merge with guest cart if exists
      const guestCart = storage.get<Cart>('guest_cart');
      if (guestCart && guestCart.items.length > 0) {
        await mergeGuestCart(guestCart);
        storage.remove('guest_cart');
      } else {
        setCart(userCart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart(createEmptyCart());
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuestCart = () => {
    const guestCart = storage.get<Cart>('guest_cart');
    setCart(guestCart || createEmptyCart());
  };

  const mergeGuestCart = async (guestCart: Cart) => {
    try {
      // Add guest cart items to user cart
      for (const item of guestCart.items) {
        await cartService.addItem(item.productId, item.quantity);
      }
      
      // Refresh cart after merging
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
      // Fallback to user cart
      const userCart = await cartService.getCart();
      setCart(userCart);
    }
  };

  const addItem = async (productId: string, quantity: number) => {
    try {
      if (user) {
        // Authenticated user - use API
        const cartItem = await cartService.addItem(productId, quantity);
        setCart(prev => ({
          ...prev,
          items: [...prev.items, cartItem],
          itemCount: prev.itemCount + quantity
        }));
        recalculateCartTotals();
      } else {
        // Guest user - update local state
        const product = await productService.getProduct(productId);
        const existingItem = cart.items.find(item => item.productId === productId);
        
        if (existingItem) {
          await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        } else {
          const newItem: CartItem = {
            id: generateId('cart_item'),
            productId,
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity
          };
          
          setCart(prev => ({
            ...prev,
            items: [...prev.items, newItem],
            itemCount: prev.itemCount + quantity
          }));
          recalculateCartTotals();
        }
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity === 0) {
        await removeItem(itemId);
        return;
      }

      if (user) {
        const updatedItem = await cartService.updateQuantity(itemId, quantity);
        setCart(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId ? updatedItem : item
          )
        }));
      } else {
        setCart(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId 
              ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
              : item
          )
        }));
      }
      
      recalculateCartTotals();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      if (user) {
        await cartService.removeItem(itemId);
      }
      
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
      
      recalculateCartTotals();
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        await cartService.clearCart();
      }
      
      setCart(createEmptyCart());
      storage.remove('guest_cart');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const refreshCart = async () => {
    if (user) {
      await loadUserCart();
    }
  };

  const recalculateCartTotals = () => {
    setCart(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.08; // 8% tax
      const deliveryFee = subtotal >= 35 ? 0 : 3.99; // Free delivery over $35
      const total = subtotal + tax + deliveryFee;
      const itemCount = prev.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...prev,
        subtotal,
        tax,
        deliveryFee,
        total,
        itemCount
      };
    });
  };

  const value: CartContextValue = {
    cart,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

function createEmptyCart(): Cart {
  return {
    id: '',
    userId: '',
    items: [],
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0,
    itemCount: 0,
    updatedAt: new Date().toISOString()
  };
}
```

### Cart Page with Optimistic Updates

```tsx
// pages/cart.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { PromoCodeInput } from '@/components/cart/PromoCodeInput';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { Button } from '@/components/ui/Button';
import { EmptyCart } from '@/components/cart/EmptyCart';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, updateQuantity, removeItem } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Optimistic update for better UX
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    // Add to updating set
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      // Revert optimistic update on error
      console.error('Failed to update quantity:', error);
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handlePromoCode = async (code: string) => {
    try {
      const discount = await cartService.applyPromoCode(code);
      setPromoCode(code);
      setPromoDiscount(discount);
    } catch (error) {
      console.error('Invalid promo code:', error);
      throw error;
    }
  };

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    } else {
      router.push('/checkout');
    }
  };

  if (cart.items.length === 0) {
    return <EmptyCart />;
  }

  const finalTotal = cart.total - promoDiscount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
        {/* Cart Items */}
        <section className="lg:col-span-7">
          <div className="space-y-4">
            {cart.items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => handleQuantityChange(item.id, quantity)}
                onRemove={() => handleRemoveItem(item.id)}
                isUpdating={updatingItems.has(item.id)}
              />
            ))}
          </div>
          
          {/* Continue Shopping */}
          <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
            <p>
              or{' '}
              <button
                type="button"
                className="text-indigo-600 font-medium hover:text-indigo-500"
                onClick={() => router.push('/products')}
              >
                Continue Shopping<span aria-hidden="true"> &rarr;</span>
              </button>
            </p>
          </div>
        </section>

        {/* Order Summary */}
        <section className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Subtotal</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(cart.subtotal)}
              </dd>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="flex items-center text-sm text-gray-600">
                <span>Delivery</span>
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)}
              </dd>
            </div>
            
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Tax</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(cart.tax)}
              </dd>
            </div>
            
            {promoDiscount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-green-600">
                  Promo Code ({promoCode})
                </dt>
                <dd className="text-sm font-medium text-green-600">
                  -{formatCurrency(promoDiscount)}
                </dd>
              </div>
            )}
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">Order Total</dt>
              <dd className="text-base font-medium text-gray-900">
                {formatCurrency(finalTotal)}
              </dd>
            </div>
          </dl>
          
          <PromoCodeInput
            onApply={handlePromoCode}
            className="mt-6"
            disabled={!!promoCode}
          />
          
          <div className="mt-6">
            <Button
              onClick={handleCheckout}
              className="w-full"
              size="lg"
              disabled={cart.items.length === 0}
            >
              {user ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </Button>
          </div>
          
          {cart.subtotal < 35 && (
            <p className="mt-4 text-sm text-center text-gray-600">
              Add {formatCurrency(35 - cart.subtotal)} more for free delivery!
            </p>
          )}
        </section>
      </div>
      
      {/* Recommended Products */}
      <div className="mt-16">
        <RelatedProducts
          products={[]} // Load based on cart items
          title="Frequently bought together"
        />
      </div>
    </div>
  );
}
```

---

## Checkout Process

### Multi-step Checkout with Validation

```tsx
// pages/checkout.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { DeliveryAddressStep } from '@/components/checkout/DeliveryAddressStep';
import { PaymentMethodStep } from '@/components/checkout/PaymentMethodStep';
import { DeliveryTimeStep } from '@/components/checkout/DeliveryTimeStep';
import { OrderReviewStep } from '@/components/checkout/OrderReviewStep';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { orderService } from '@/services/orders';

const CHECKOUT_STEPS = [
  { id: 'address', title: 'Delivery Address', component: DeliveryAddressStep },
  { id: 'payment', title: 'Payment Method', component: PaymentMethodStep },
  { id: 'delivery', title: 'Delivery Time', component: DeliveryTimeStep },
  { id: 'review', title: 'Review Order', component: OrderReviewStep }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    deliveryAddress: null,
    paymentMethod: null,
    deliveryTime: 'asap',
    specialInstructions: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart.items.length, router]);

  const validateStep = (stepIndex: number): boolean => {
    const step = CHECKOUT_STEPS[stepIndex];
    const newErrors: Record<string, string> = {};

    switch (step.id) {
      case 'address':
        if (!checkoutData.deliveryAddress) {
          newErrors.address = 'Please select a delivery address';
        }
        break;
      case 'payment':
        if (!checkoutData.paymentMethod) {
          newErrors.payment = 'Please select a payment method';
        }
        break;
      case 'delivery':
        if (!checkoutData.deliveryTime) {
          newErrors.delivery = 'Please select a delivery time';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow going back to completed steps
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleDataChange = (stepData: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...stepData }));
    // Clear errors when data changes
    setErrors({});
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setIsProcessing(true);
      
      const order = await orderService.createOrder({
        deliveryAddress: checkoutData.deliveryAddress!,
        paymentMethod: checkoutData.paymentMethod!,
        deliveryTime: checkoutData.deliveryTime,
        specialInstructions: checkoutData.specialInstructions
      });

      // Clear cart after successful order
      await clearCart();

      // Redirect to confirmation page
      router.push(`/orders/${order.id}/confirmation`);
    } catch (error) {
      console.error('Order creation failed:', error);
      
      if (error instanceof PaymentError) {
        setErrors({ payment: 'Payment failed. Please try again.' });
        setCurrentStep(1); // Go back to payment step
      } else if (error instanceof ValidationError) {
        setErrors(error.details);
      } else {
        setErrors({ general: 'Failed to place order. Please try again.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const CurrentStepComponent = CHECKOUT_STEPS[currentStep].component;
  const isLastStep = currentStep === CHECKOUT_STEPS.length - 1;

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {/* Progress Steps */}
        <CheckoutSteps
          steps={CHECKOUT_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          className="mb-8"
        />
        
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <CurrentStepComponent
              data={checkoutData}
              onChange={handleDataChange}
              errors={errors}
              user={user}
            />
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h3>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>
                    {cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(cart.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-medium border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <button
            onClick={isLastStep ? handlePlaceOrder : handleNext}
            disabled={isProcessing}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : isLastStep ? (
              'Place Order'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## Order Management

### Order Tracking with Real-time Updates

```tsx
// pages/orders/[orderId]/track.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { DeliveryMap } from '@/components/orders/DeliveryMap';
import { DriverContact } from '@/components/orders/DriverContact';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { usePusher } from '@/hooks/usePusher';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function OrderTrackingPage() {
  const router = useRouter();
  const orderId = router.query.orderId as string;
  
  const {
    tracking,
    isLoading,
    error,
    refetch
  } = useOrderTracking(orderId);

  // Real-time updates via Pusher
  usePusher(`order-${orderId}`, {
    'status-updated': (data) => {
      refetch();
    },
    'location-updated': (data) => {
      setTracking(prev => prev ? {
        ...prev,
        location: data.location
      } : null);
    },
    'driver-assigned': (data) => {
      setTracking(prev => prev ? {
        ...prev,
        driver: data.driver
      } : null);
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load tracking information
          </h1>
          <p className="text-gray-600 mt-2">
            Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={refetch}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isActiveDelivery = ['confirmed', 'preparing', 'out_for_delivery'].includes(tracking.status);

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Track Order #{tracking.orderNumber}
          </h1>
          
          <p className="text-gray-600 mt-1">
            Estimated delivery: {formatDate(tracking.estimatedArrival, 'datetime')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tracking Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <OrderStatusCard 
                status={tracking.status}
                estimatedArrival={tracking.estimatedArrival}
                driver={tracking.driver}
              />
            </div>

            {/* Live Map (only show during active delivery) */}
            {isActiveDelivery && tracking.location && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Live Tracking
                </h3>
                <DeliveryMap
                  driverLocation={tracking.location}
                  deliveryAddress={tracking.deliveryAddress}
                  orderStatus={tracking.status}
                />
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Order Progress
              </h3>
              <OrderTimeline
                timeline={tracking.timeline}
                currentStatus={tracking.status}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Contact (only show when driver is assigned) */}
            {tracking.driver && (
              <div className="bg-white rounded-lg shadow p-6">
                <DriverContact
                  driver={tracking.driver}
                  orderStatus={tracking.status}
                />
              </div>
            )}

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Order Details
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Order Number:</span>
                  <span className="ml-2 font-medium">{tracking.orderNumber}</span>
                </div>
                
                <div>
                  <span className="text-gray-600">Items:</span>
                  <span className="ml-2 font-medium">{tracking.itemCount} items</span>
                </div>
                
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="ml-2 font-medium">{formatCurrency(tracking.total)}</span>
                </div>
                
                <div className="pt-3 border-t">
                  <span className="text-gray-600">Delivery Address:</span>
                  <address className="mt-1 text-gray-900 not-italic">
                    {tracking.deliveryAddress.street}<br />
                    {tracking.deliveryAddress.city}, {tracking.deliveryAddress.state} {tracking.deliveryAddress.zipCode}
                  </address>
                </div>
                
                {tracking.deliveryAddress.instructions && (
                  <div>
                    <span className="text-gray-600">Instructions:</span>
                    <p className="mt-1 text-gray-900">{tracking.deliveryAddress.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Support Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Need Help?
              </h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Call Support
                </button>
                
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <ChatIcon className="w-4 h-4 mr-2" />
                  Live Chat
                </button>
                
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <MailIcon className="w-4 h-4 mr-2" />
                  Email Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh notification */}
        {isActiveDelivery && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="ml-3 text-sm text-gray-600">
                Tracking updates automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Real-time Features

### Pusher Integration for Live Updates

```tsx
// hooks/usePusher.ts
import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from '@/hooks/useAuth';

let pusherInstance: Pusher | null = null;

function getPusherInstance(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      encrypted: true,
    });
  }
  return pusherInstance;
}

export function usePusher(
  channelName: string,
  eventHandlers: Record<string, (data: any) => void>
) {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return; // Only connect for authenticated users

    const pusher = getPusherInstance();
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Bind event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.bind(event, handler);
    });

    // Cleanup
    return () => {
      Object.keys(eventHandlers).forEach(event => {
        channel.unbind(event);
      });
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName, user, eventHandlers]);

  return channelRef.current;
}

// Specific hook for order tracking
export function useOrderTracking(orderId: string) {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial data fetch
  const fetchTracking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.trackOrder(orderId);
      setTracking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchTracking();
    }
  }, [orderId]);

  // Real-time updates
  usePusher(`order-${orderId}`, {
    'status-updated': (data) => {
      setTracking(prev => prev ? {
        ...prev,
        status: data.status,
        estimatedArrival: data.estimatedArrival,
        timeline: [...prev.timeline, data.timelineEvent]
      } : null);
    },
    
    'location-updated': (data) => {
      setTracking(prev => prev ? {
        ...prev,
        location: data.location
      } : null);
    },
    
    'driver-assigned': (data) => {
      setTracking(prev => prev ? {
        ...prev,
        driver: data.driver
      } : null);
    }
  });

  return {
    tracking,
    isLoading,
    error,
    refetch: fetchTracking
  };
}
```

### Live Notifications System

```tsx
// components/notifications/NotificationCenter.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePusher } from '@/hooks/usePusher';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { BellIcon } from '@heroicons/react/24/outline';

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Real-time notification updates
  usePusher(`user-${user?.id}`, {
    'notification': (data) => {
      const newNotification: Notification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/icon-192x192.png',
          tag: data.id
        });
      }
    }
  });

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onClick={() => {
                      handleNotificationClick(notification);
                      setIsOpen(false);
                    }}
                  />
                ))
              )}
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  router.push('/notifications');
                }}
                className="w-full text-center text-indigo-600 hover:text-indigo-500 text-sm"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function handleNotificationClick(notification: Notification) {
  // Handle different notification types
  switch (notification.type) {
    case 'order_status':
      router.push(`/orders/${notification.data.orderId}/track`);
      break;
    case 'delivery_arrived':
      router.push(`/orders/${notification.data.orderId}`);
      break;
    case 'promotion':
      router.push('/promotions');
      break;
    default:
      // Default action
      break;
  }
}
```

This comprehensive usage examples and integration guide provides detailed implementations for all major features of the Feeya grocery delivery application. Each example includes proper error handling, loading states, accessibility considerations, and best practices for React development.