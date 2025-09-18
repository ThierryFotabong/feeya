# Feeya Grocery Delivery - Function Documentation

## Overview
This document provides comprehensive documentation for all utility functions, services, and helper functions used in the Feeya grocery delivery application. Functions are organized by module and include parameters, return values, and usage examples.

## Table of Contents
- [Authentication Services](#authentication-services)
- [Cart Services](#cart-services)
- [Product Services](#product-services)
- [Order Services](#order-services)
- [Payment Services](#payment-services)
- [Utility Functions](#utility-functions)
- [Validation Functions](#validation-functions)
- [API Client Functions](#api-client-functions)
- [Storage Functions](#storage-functions)
- [Date/Time Functions](#datetime-functions)

---

## Authentication Services

### authService.login()

**Description:** Authenticates a user with email and password.

**Signature:**
```typescript
async function login(credentials: LoginCredentials): Promise<AuthResponse>
```

**Parameters:**
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

**Return Value:**
```typescript
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}
```

**Usage Example:**
```typescript
import { authService } from '@/services/auth';

async function handleLogin(email: string, password: string) {
  try {
    const response = await authService.login({ email, password });
    
    // Store tokens
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Update user state
    setUser(response.user);
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    setError(error.message);
  }
}
```

**Error Handling:**
- Throws `InvalidCredentialsError` for wrong email/password
- Throws `AccountLockedError` for locked accounts
- Throws `NetworkError` for connection issues

---

### authService.register()

**Description:** Creates a new user account.

**Signature:**
```typescript
async function register(userData: RegisterData): Promise<AuthResponse>
```

**Parameters:**
```typescript
interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: Address;
  agreeToTerms: boolean;
}
```

**Usage Example:**
```typescript
import { authService } from '@/services/auth';

async function handleRegister(formData: RegisterData) {
  try {
    // Validate form data
    const validationErrors = validateRegistrationData(formData);
    if (validationErrors.length > 0) {
      throw new ValidationError('Invalid form data', validationErrors);
    }

    const response = await authService.register(formData);
    
    // Auto-login after successful registration
    setUser(response.user);
    localStorage.setItem('token', response.token);
    
    // Show welcome message
    toast.success('Welcome to Feeya! Your account has been created.');
    
    router.push('/onboarding');
  } catch (error) {
    handleRegistrationError(error);
  }
}
```

---

### authService.refreshToken()

**Description:** Refreshes an expired access token.

**Signature:**
```typescript
async function refreshToken(refreshToken: string): Promise<TokenResponse>
```

**Usage Example:**
```typescript
import { authService } from '@/services/auth';

async function refreshAuthToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authService.refreshToken(refreshToken);
    
    // Update stored tokens
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response.token;
  } catch (error) {
    // Refresh failed, redirect to login
    localStorage.clear();
    router.push('/login');
    throw error;
  }
}
```

---

### authService.logout()

**Description:** Logs out the current user and clears session data.

**Signature:**
```typescript
async function logout(): Promise<void>
```

**Usage Example:**
```typescript
import { authService } from '@/services/auth';

async function handleLogout() {
  try {
    await authService.logout();
    
    // Clear local storage
    localStorage.clear();
    
    // Clear user state
    setUser(null);
    
    // Redirect to home page
    router.push('/');
    
    toast.success('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if API call fails
    localStorage.clear();
    setUser(null);
    router.push('/');
  }
}
```

---

## Cart Services

### cartService.addItem()

**Description:** Adds a product to the shopping cart.

**Signature:**
```typescript
async function addItem(productId: string, quantity: number): Promise<CartItem>
```

**Parameters:**
- `productId` (string): The ID of the product to add
- `quantity` (number): The quantity to add (must be positive)

**Return Value:**
```typescript
interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

**Usage Example:**
```typescript
import { cartService } from '@/services/cart';

async function handleAddToCart(productId: string, quantity: number = 1) {
  try {
    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const cartItem = await cartService.addItem(productId, quantity);
    
    // Update cart state
    setCart(prevCart => ({
      ...prevCart,
      items: [...prevCart.items, cartItem],
      itemCount: prevCart.itemCount + quantity,
      subtotal: prevCart.subtotal + cartItem.totalPrice
    }));
    
    // Show success message
    toast.success(`Added ${cartItem.product.name} to cart`);
    
    // Optional: Open mini cart
    setMiniCartOpen(true);
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    toast.error(error.message || 'Failed to add item to cart');
  }
}
```

---

### cartService.updateQuantity()

**Description:** Updates the quantity of an item in the cart.

**Signature:**
```typescript
async function updateQuantity(itemId: string, quantity: number): Promise<CartItem>
```

**Usage Example:**
```typescript
import { cartService } from '@/services/cart';

async function handleQuantityChange(itemId: string, newQuantity: number) {
  try {
    if (newQuantity === 0) {
      // Remove item if quantity is 0
      await cartService.removeItem(itemId);
      return;
    }

    const updatedItem = await cartService.updateQuantity(itemId, newQuantity);
    
    // Update cart state
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item => 
        item.id === itemId ? updatedItem : item
      )
    }));
    
    // Recalculate totals
    recalculateCartTotals();
  } catch (error) {
    console.error('Failed to update quantity:', error);
    toast.error('Failed to update item quantity');
  }
}
```

---

### cartService.removeItem()

**Description:** Removes an item from the cart.

**Signature:**
```typescript
async function removeItem(itemId: string): Promise<void>
```

**Usage Example:**
```typescript
import { cartService } from '@/services/cart';

async function handleRemoveItem(itemId: string) {
  try {
    await cartService.removeItem(itemId);
    
    // Update cart state
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.id !== itemId)
    }));
    
    // Recalculate totals
    recalculateCartTotals();
    
    toast.success('Item removed from cart');
  } catch (error) {
    console.error('Failed to remove item:', error);
    toast.error('Failed to remove item from cart');
  }
}
```

---

### cartService.getCart()

**Description:** Retrieves the current user's cart.

**Signature:**
```typescript
async function getCart(): Promise<Cart>
```

**Return Value:**
```typescript
interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  updatedAt: string;
}
```

**Usage Example:**
```typescript
import { cartService } from '@/services/cart';

async function loadCart() {
  try {
    const cart = await cartService.getCart();
    setCart(cart);
    
    // Update cart badge
    setCartItemCount(cart.itemCount);
  } catch (error) {
    console.error('Failed to load cart:', error);
    // Initialize empty cart on error
    setCart(createEmptyCart());
  }
}

// Load cart on app initialization
useEffect(() => {
  if (user) {
    loadCart();
  }
}, [user]);
```

---

## Product Services

### productService.getProducts()

**Description:** Retrieves a paginated list of products with optional filtering.

**Signature:**
```typescript
async function getProducts(params: ProductSearchParams): Promise<ProductSearchResult>
```

**Parameters:**
```typescript
interface ProductSearchParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'name' | 'price' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
}
```

**Return Value:**
```typescript
interface ProductSearchResult {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    categories: Category[];
    priceRange: [number, number];
  };
}
```

**Usage Example:**
```typescript
import { productService } from '@/services/products';

async function searchProducts(searchParams: ProductSearchParams) {
  try {
    setLoading(true);
    
    const result = await productService.getProducts(searchParams);
    
    // Update products state
    if (searchParams.page === 1) {
      setProducts(result.products);
    } else {
      // Append for pagination
      setProducts(prev => [...prev, ...result.products]);
    }
    
    // Update pagination info
    setPagination(result.pagination);
    
    // Update available filters
    setAvailableFilters(result.filters);
  } catch (error) {
    console.error('Failed to search products:', error);
    toast.error('Failed to load products');
  } finally {
    setLoading(false);
  }
}

// Example: Search for organic fruits
searchProducts({
  category: 'fruits',
  search: 'organic',
  sortBy: 'popularity',
  sortOrder: 'desc',
  page: 1,
  limit: 20
});
```

---

### productService.getProduct()

**Description:** Retrieves detailed information about a specific product.

**Signature:**
```typescript
async function getProduct(productId: string): Promise<ProductDetail>
```

**Usage Example:**
```typescript
import { productService } from '@/services/products';

async function loadProductDetail(productId: string) {
  try {
    setLoading(true);
    
    const product = await productService.getProduct(productId);
    setProduct(product);
    
    // Load related products
    const relatedProducts = await productService.getRelatedProducts(productId);
    setRelatedProducts(relatedProducts);
    
    // Load reviews
    const reviews = await reviewService.getProductReviews(productId);
    setReviews(reviews);
  } catch (error) {
    console.error('Failed to load product:', error);
    if (error.status === 404) {
      router.push('/404');
    } else {
      toast.error('Failed to load product details');
    }
  } finally {
    setLoading(false);
  }
}
```

---

### productService.getCategories()

**Description:** Retrieves all product categories.

**Signature:**
```typescript
async function getCategories(): Promise<Category[]>
```

**Usage Example:**
```typescript
import { productService } from '@/services/products';

async function loadCategories() {
  try {
    const categories = await productService.getCategories();
    
    // Sort categories by product count
    const sortedCategories = categories.sort((a, b) => 
      b.productCount - a.productCount
    );
    
    setCategories(sortedCategories);
  } catch (error) {
    console.error('Failed to load categories:', error);
    // Use fallback categories
    setCategories(DEFAULT_CATEGORIES);
  }
}
```

---

## Order Services

### orderService.createOrder()

**Description:** Creates a new order from the current cart.

**Signature:**
```typescript
async function createOrder(orderData: CreateOrderData): Promise<Order>
```

**Parameters:**
```typescript
interface CreateOrderData {
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  deliveryTime: 'asap' | string; // ISO date string for scheduled delivery
  specialInstructions?: string;
  promoCode?: string;
}
```

**Usage Example:**
```typescript
import { orderService } from '@/services/orders';

async function handleCheckout(checkoutData: CreateOrderData) {
  try {
    setProcessing(true);
    
    // Validate checkout data
    const validationErrors = validateCheckoutData(checkoutData);
    if (validationErrors.length > 0) {
      throw new ValidationError('Invalid checkout data', validationErrors);
    }
    
    // Create the order
    const order = await orderService.createOrder(checkoutData);
    
    // Clear the cart
    await cartService.clearCart();
    setCart(createEmptyCart());
    
    // Show success message
    toast.success('Order placed successfully!');
    
    // Redirect to order confirmation
    router.push(`/orders/${order.id}/confirmation`);
    
    // Send confirmation email
    await emailService.sendOrderConfirmation(order.id);
  } catch (error) {
    console.error('Checkout failed:', error);
    
    if (error instanceof PaymentError) {
      toast.error('Payment failed. Please check your payment method.');
    } else if (error instanceof ValidationError) {
      setFieldErrors(error.details);
    } else {
      toast.error('Failed to place order. Please try again.');
    }
  } finally {
    setProcessing(false);
  }
}
```

---

### orderService.getOrders()

**Description:** Retrieves the user's order history.

**Signature:**
```typescript
async function getOrders(params?: OrderHistoryParams): Promise<OrderHistoryResult>
```

**Parameters:**
```typescript
interface OrderHistoryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}
```

**Usage Example:**
```typescript
import { orderService } from '@/services/orders';

async function loadOrderHistory(filters: OrderHistoryParams = {}) {
  try {
    setLoading(true);
    
    const result = await orderService.getOrders({
      page: 1,
      limit: 10,
      ...filters
    });
    
    setOrders(result.orders);
    setPagination(result.pagination);
    
    // Group orders by date for better UX
    const groupedOrders = groupOrdersByDate(result.orders);
    setGroupedOrders(groupedOrders);
  } catch (error) {
    console.error('Failed to load order history:', error);
    toast.error('Failed to load orders');
  } finally {
    setLoading(false);
  }
}

// Example: Load recent orders
loadOrderHistory({ 
  status: 'delivered', 
  limit: 5 
});
```

---

### orderService.trackOrder()

**Description:** Gets real-time tracking information for an order.

**Signature:**
```typescript
async function trackOrder(orderId: string): Promise<OrderTracking>
```

**Return Value:**
```typescript
interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  estimatedArrival: string;
  driver?: {
    name: string;
    phone: string;
    rating: number;
    photo?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  timeline: TimelineEvent[];
}
```

**Usage Example:**
```typescript
import { orderService } from '@/services/orders';

function useOrderTracking(orderId: string) {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTracking = async () => {
    try {
      setIsLoading(true);
      const trackingData = await orderService.trackOrder(orderId);
      setTracking(trackingData);
    } catch (error) {
      console.error('Failed to load tracking:', error);
      toast.error('Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh tracking every 30 seconds for active orders
  useEffect(() => {
    if (orderId && tracking?.status === 'out_for_delivery') {
      const interval = setInterval(refreshTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [orderId, tracking?.status]);

  // Initial load
  useEffect(() => {
    if (orderId) {
      refreshTracking();
    }
  }, [orderId]);

  return { tracking, isLoading, refreshTracking };
}
```

---

## Payment Services

### paymentService.processPayment()

**Description:** Processes a payment for an order.

**Signature:**
```typescript
async function processPayment(paymentData: PaymentData): Promise<PaymentResult>
```

**Parameters:**
```typescript
interface PaymentData {
  amount: number;
  currency: string;
  paymentMethodId: string;
  orderId: string;
  customerId: string;
}
```

**Usage Example:**
```typescript
import { paymentService } from '@/services/payment';

async function handlePayment(orderTotal: number, paymentMethodId: string, orderId: string) {
  try {
    const paymentResult = await paymentService.processPayment({
      amount: orderTotal,
      currency: 'USD',
      paymentMethodId,
      orderId,
      customerId: user.id
    });

    if (paymentResult.status === 'succeeded') {
      return { success: true, transactionId: paymentResult.transactionId };
    } else if (paymentResult.status === 'requires_action') {
      // Handle 3D Secure authentication
      const actionResult = await paymentService.handlePaymentAction(
        paymentResult.clientSecret
      );
      return actionResult;
    } else {
      throw new PaymentError('Payment failed', paymentResult.error);
    }
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
}
```

---

### paymentService.addPaymentMethod()

**Description:** Adds a new payment method for the user.

**Signature:**
```typescript
async function addPaymentMethod(paymentMethodData: PaymentMethodData): Promise<PaymentMethod>
```

**Usage Example:**
```typescript
import { paymentService } from '@/services/payment';

async function handleAddPaymentMethod(cardElement: StripeCardElement) {
  try {
    setProcessing(true);
    
    // Create payment method with Stripe
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: user.name,
        email: user.email,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Save payment method to our backend
    const savedPaymentMethod = await paymentService.addPaymentMethod({
      stripePaymentMethodId: paymentMethod.id,
      type: 'card',
      isDefault: paymentMethods.length === 0, // First card is default
    });

    // Update payment methods list
    setPaymentMethods(prev => [...prev, savedPaymentMethod]);
    
    toast.success('Payment method added successfully');
    
    // Close modal
    setShowAddCardModal(false);
  } catch (error) {
    console.error('Failed to add payment method:', error);
    toast.error(error.message || 'Failed to add payment method');
  } finally {
    setProcessing(false);
  }
}
```

---

## Utility Functions

### formatCurrency()

**Description:** Formats a number as currency with proper locale and symbol.

**Signature:**
```typescript
function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string
```

**Usage Example:**
```typescript
import { formatCurrency } from '@/utils/currency';

function ProductPrice({ price }: { price: number }) {
  return (
    <div className="price">
      <span className="current-price">
        {formatCurrency(price)}
      </span>
      {/* Example outputs: "$12.99", "$1,299.00" */}
    </div>
  );
}

// Advanced usage with different currencies
const priceInEuros = formatCurrency(29.99, 'EUR', 'de-DE'); // "29,99 €"
const priceInYen = formatCurrency(1500, 'JPY', 'ja-JP'); // "¥1,500"
```

---

### debounce()

**Description:** Creates a debounced version of a function that delays execution.

**Signature:**
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void
```

**Usage Example:**
```typescript
import { debounce } from '@/utils/debounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = debounce(async (searchTerm: string) => {
    if (searchTerm.length >= 3) {
      const results = await productService.searchProducts({ search: searchTerm });
      setSuggestions(results.products);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      placeholder="Search products..."
    />
  );
}
```

---

### generateId()

**Description:** Generates a unique identifier string.

**Signature:**
```typescript
function generateId(prefix?: string, length?: number): string
```

**Usage Example:**
```typescript
import { generateId } from '@/utils/id';

function createCartItem(product: Product, quantity: number): CartItem {
  return {
    id: generateId('cart_item'), // "cart_item_abc123def456"
    productId: product.id,
    product,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
    addedAt: new Date().toISOString()
  };
}

// Different use cases
const orderId = generateId('order'); // "order_xyz789abc123"
const sessionId = generateId('session', 32); // Longer ID
const tempId = generateId(); // "temp_abc123"
```

---

### slugify()

**Description:** Converts a string to a URL-friendly slug.

**Signature:**
```typescript
function slugify(text: string): string
```

**Usage Example:**
```typescript
import { slugify } from '@/utils/string';

function generateProductUrl(product: Product): string {
  const slug = slugify(product.name);
  return `/products/${product.id}/${slug}`;
}

// Examples:
slugify('Organic Fresh Bananas'); // "organic-fresh-bananas"
slugify('Milk & Dairy Products'); // "milk-dairy-products"
slugify('100% Natural Juice!!!'); // "100-natural-juice"
```

---

### calculateDistance()

**Description:** Calculates the distance between two geographic coordinates.

**Signature:**
```typescript
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
  unit?: 'miles' | 'kilometers'
): number
```

**Usage Example:**
```typescript
import { calculateDistance } from '@/utils/geo';

function findNearestStores(userLocation: Location, stores: Store[]): Store[] {
  return stores
    .map(store => ({
      ...store,
      distance: calculateDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: store.latitude, longitude: store.longitude },
        'miles'
      )
    }))
    .filter(store => store.distance <= 10) // Within 10 miles
    .sort((a, b) => a.distance - b.distance); // Nearest first
}
```

---

## Validation Functions

### validateEmail()

**Description:** Validates an email address format.

**Signature:**
```typescript
function validateEmail(email: string): { isValid: boolean; error?: string }
```

**Usage Example:**
```typescript
import { validateEmail } from '@/utils/validation';

function EmailInput({ value, onChange, onError }: EmailInputProps) {
  const handleBlur = () => {
    const validation = validateEmail(value);
    if (!validation.isValid) {
      onError(validation.error);
    } else {
      onError(null);
    }
  };

  return (
    <input
      type="email"
      value={value}
      onChange={onChange}
      onBlur={handleBlur}
      className={!validateEmail(value).isValid ? 'error' : ''}
    />
  );
}
```

---

### validatePassword()

**Description:** Validates password strength and requirements.

**Signature:**
```typescript
function validatePassword(password: string): ValidationResult
```

**Return Value:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}
```

**Usage Example:**
```typescript
import { validatePassword } from '@/utils/validation';

function PasswordInput({ value, onChange }: PasswordInputProps) {
  const validation = validatePassword(value);
  
  return (
    <div className="password-input">
      <input
        type="password"
        value={value}
        onChange={onChange}
        className={validation.isValid ? 'valid' : 'invalid'}
      />
      
      <div className="password-strength">
        <div className={`strength-bar strength-${validation.strength}`}>
          <div style={{ width: `${validation.score}%` }} />
        </div>
        <span>Password strength: {validation.strength}</span>
      </div>
      
      {validation.errors.length > 0 && (
        <ul className="validation-errors">
          {validation.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

### validateAddress()

**Description:** Validates a delivery address.

**Signature:**
```typescript
function validateAddress(address: Address): AddressValidationResult
```

**Usage Example:**
```typescript
import { validateAddress } from '@/utils/validation';

function AddressForm({ address, onChange, onValidation }: AddressFormProps) {
  const handleAddressChange = (field: keyof Address, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    onChange(updatedAddress);
    
    // Validate on change
    const validation = validateAddress(updatedAddress);
    onValidation(validation);
  };

  const validation = validateAddress(address);

  return (
    <form className="address-form">
      <input
        placeholder="Street Address"
        value={address.street}
        onChange={(e) => handleAddressChange('street', e.target.value)}
        className={validation.errors.street ? 'error' : ''}
      />
      {validation.errors.street && (
        <span className="error-text">{validation.errors.street}</span>
      )}
      
      {/* Other address fields... */}
    </form>
  );
}
```

---

## API Client Functions

### apiClient.request()

**Description:** Makes authenticated HTTP requests to the API.

**Signature:**
```typescript
async function request<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>>
```

**Parameters:**
```typescript
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}
```

**Usage Example:**
```typescript
import { apiClient } from '@/services/api';

async function fetchUserProfile(userId: string): Promise<User> {
  try {
    const response = await apiClient.request<User>(`/users/${userId}`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error.message);
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
}

// POST request example
async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  const response = await apiClient.request<User>(`/users/${userId}`, {
    method: 'PUT',
    body: updates,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

---

### apiClient.upload()

**Description:** Uploads files to the API with progress tracking.

**Signature:**
```typescript
async function upload(
  endpoint: string,
  file: File,
  options?: UploadOptions
): Promise<UploadResponse>
```

**Usage Example:**
```typescript
import { apiClient } from '@/services/api';

async function uploadProfilePhoto(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    const response = await apiClient.upload('/users/profile-photo', file, {
      onProgress: (progress) => {
        onProgress?.(progress);
        setUploadProgress(progress);
      },
      maxSize: 5 * 1024 * 1024, // 5MB limit
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    
    return response.data.photoUrl;
  } catch (error) {
    if (error instanceof FileSizeError) {
      toast.error('File size must be less than 5MB');
    } else if (error instanceof FileTypeError) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
    } else {
      toast.error('Failed to upload photo');
    }
    throw error;
  }
}
```

---

## Storage Functions

### storage.set()

**Description:** Stores data in browser storage with serialization.

**Signature:**
```typescript
function set<T>(key: string, value: T, options?: StorageOptions): void
```

**Parameters:**
```typescript
interface StorageOptions {
  storage?: 'localStorage' | 'sessionStorage';
  encrypt?: boolean;
  expiresAt?: Date;
}
```

**Usage Example:**
```typescript
import { storage } from '@/utils/storage';

function saveUserPreferences(preferences: UserPreferences) {
  try {
    storage.set('user_preferences', preferences, {
      storage: 'localStorage',
      encrypt: true // Encrypt sensitive data
    });
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

// Save temporary cart data
function saveCartToSession(cart: Cart) {
  storage.set('temp_cart', cart, {
    storage: 'sessionStorage',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  });
}
```

---

### storage.get()

**Description:** Retrieves and deserializes data from browser storage.

**Signature:**
```typescript
function get<T>(key: string, defaultValue?: T): T | null
```

**Usage Example:**
```typescript
import { storage } from '@/utils/storage';

function loadUserPreferences(): UserPreferences {
  const preferences = storage.get<UserPreferences>('user_preferences');
  
  if (preferences) {
    return preferences;
  }
  
  // Return default preferences
  return {
    theme: 'light',
    notifications: true,
    currency: 'USD',
    language: 'en'
  };
}

// Check for saved cart
function restoreCartFromSession(): Cart | null {
  return storage.get<Cart>('temp_cart');
}
```

---

## Date/Time Functions

### formatDate()

**Description:** Formats dates for display with locale support.

**Signature:**
```typescript
function formatDate(
  date: Date | string,
  format?: DateFormat,
  locale?: string
): string
```

**Types:**
```typescript
type DateFormat = 
  | 'short'      // 12/1/2023
  | 'medium'     // Dec 1, 2023
  | 'long'       // December 1, 2023
  | 'full'       // Friday, December 1, 2023
  | 'time'       // 2:30 PM
  | 'datetime'   // Dec 1, 2023 2:30 PM
  | 'relative';  // 2 hours ago
```

**Usage Example:**
```typescript
import { formatDate } from '@/utils/date';

function OrderHistoryItem({ order }: { order: Order }) {
  return (
    <div className="order-item">
      <h3>Order #{order.orderNumber}</h3>
      <p>Placed: {formatDate(order.createdAt, 'medium')}</p>
      <p>Delivered: {formatDate(order.deliveredAt, 'datetime')}</p>
      <p>Status updated: {formatDate(order.updatedAt, 'relative')}</p>
    </div>
  );
}

// Examples of different formats:
formatDate(new Date(), 'short');     // "12/1/2023"
formatDate(new Date(), 'medium');    // "Dec 1, 2023"
formatDate(new Date(), 'long');      // "December 1, 2023"
formatDate(new Date(), 'time');      // "2:30 PM"
formatDate(new Date(), 'relative');  // "just now", "2 minutes ago"
```

---

### calculateDeliveryTime()

**Description:** Calculates estimated delivery time based on location and current load.

**Signature:**
```typescript
function calculateDeliveryTime(
  storeLocation: Location,
  deliveryAddress: Address,
  currentTime: Date = new Date()
): DeliveryEstimate
```

**Return Value:**
```typescript
interface DeliveryEstimate {
  estimatedTime: Date;
  minTime: Date;
  maxTime: Date;
  deliveryWindow: string; // "30-45 minutes"
  canDeliverToday: boolean;
  nextAvailableSlot?: Date;
}
```

**Usage Example:**
```typescript
import { calculateDeliveryTime } from '@/utils/delivery';

function DeliveryTimeSelector({ storeId, deliveryAddress }: Props) {
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  
  useEffect(() => {
    async function calculateEstimate() {
      try {
        const store = await storeService.getStore(storeId);
        const deliveryEstimate = calculateDeliveryTime(
          store.location,
          deliveryAddress
        );
        setEstimate(deliveryEstimate);
      } catch (error) {
        console.error('Failed to calculate delivery time:', error);
      }
    }
    
    if (storeId && deliveryAddress) {
      calculateEstimate();
    }
  }, [storeId, deliveryAddress]);

  if (!estimate) {
    return <div>Calculating delivery time...</div>;
  }

  return (
    <div className="delivery-estimate">
      <h3>Estimated Delivery</h3>
      <p className="delivery-window">{estimate.deliveryWindow}</p>
      <p className="delivery-time">
        By {formatDate(estimate.estimatedTime, 'time')}
      </p>
      
      {!estimate.canDeliverToday && (
        <p className="next-slot">
          Next available: {formatDate(estimate.nextAvailableSlot, 'datetime')}
        </p>
      )}
    </div>
  );
}
```

---

## Error Handling

### Custom Error Classes

```typescript
// Custom error classes for better error handling
class ValidationError extends Error {
  constructor(message: string, public details: ValidationErrors) {
    super(message);
    this.name = 'ValidationError';
  }
}

class PaymentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

class NetworkError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

### Error Handling Utilities

```typescript
// Global error handler
function handleError(error: Error): void {
  console.error('Application error:', error);
  
  if (error instanceof ValidationError) {
    toast.error('Please check your input and try again');
  } else if (error instanceof PaymentError) {
    toast.error('Payment failed. Please try a different payment method.');
  } else if (error instanceof NetworkError) {
    if (error.status === 401) {
      // Redirect to login
      router.push('/login');
    } else {
      toast.error('Network error. Please check your connection.');
    }
  } else {
    toast.error('An unexpected error occurred');
  }
  
  // Report to error tracking service
  errorTracker.report(error);
}
```

---

## Testing Utilities

### Mock Functions

```typescript
// Mock implementations for testing
export const mockProductService = {
  getProducts: jest.fn(),
  getProduct: jest.fn(),
  getCategories: jest.fn(),
};

export const mockCartService = {
  addItem: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  getCart: jest.fn(),
};

// Test helpers
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'prod_123',
    name: 'Test Product',
    description: 'Test description',
    price: 9.99,
    category: 'test',
    imageUrl: 'https://example.com/test.jpg',
    inStock: true,
    ...overrides
  };
}

export function createMockCart(overrides?: Partial<Cart>): Cart {
  return {
    id: 'cart_123',
    userId: 'user_123',
    items: [],
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0,
    itemCount: 0,
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}
```

---

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Memoized calculations
function useCartTotals(items: CartItem[]) {
  return useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = subtotal > 35 ? 0 : 3.99; // Free delivery over $35
    const total = subtotal + tax + deliveryFee;
    
    return { subtotal, tax, deliveryFee, total };
  }, [items]);
}

// Memoized event handlers
function useCartHandlers(cartService: CartService) {
  const addItem = useCallback(async (productId: string, quantity: number) => {
    await cartService.addItem(productId, quantity);
  }, [cartService]);
  
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await cartService.updateQuantity(itemId, quantity);
  }, [cartService]);
  
  const removeItem = useCallback(async (itemId: string) => {
    await cartService.removeItem(itemId);
  }, [cartService]);
  
  return { addItem, updateQuantity, removeItem };
}
```

This comprehensive function documentation provides detailed information about all the utility functions, services, and helper functions that would be used in the Feeya grocery delivery application. Each function includes type definitions, usage examples, error handling, and best practices.