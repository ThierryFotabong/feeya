# Feeya Grocery Delivery - Component Documentation

## Overview
This document provides comprehensive documentation for all React components used in the Feeya grocery delivery application. Components are organized by feature area and include props, usage examples, and styling information.

## Table of Contents
- [Authentication Components](#authentication-components)
- [Product Components](#product-components)
- [Cart Components](#cart-components)
- [Order Components](#order-components)
- [User Interface Components](#user-interface-components)
- [Layout Components](#layout-components)
- [Form Components](#form-components)

---

## Authentication Components

### LoginForm

**Description:** A form component for user authentication.

**Props:**
```typescript
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  redirectTo?: string;
  showRegisterLink?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

**Usage Example:**
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

function LoginPage() {
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await authService.login(credentials);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-container">
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
        showRegisterLink={true}
      />
    </div>
  );
}
```

**Styling:**
- Uses Tailwind CSS classes
- Responsive design with mobile-first approach
- Includes focus states and accessibility features

---

### RegisterForm

**Description:** A comprehensive registration form for new users.

**Props:**
```typescript
interface RegisterFormProps {
  onSubmit: (userData: RegisterData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  showLoginLink?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: Address;
  agreeToTerms: boolean;
}
```

**Usage Example:**
```tsx
import { RegisterForm } from '@/components/auth/RegisterForm';

function RegisterPage() {
  const handleRegister = async (userData: RegisterData) => {
    try {
      await authService.register(userData);
      router.push('/welcome');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <RegisterForm
      onSubmit={handleRegister}
      isLoading={isLoading}
      error={error}
      showLoginLink={true}
    />
  );
}
```

---

## Product Components

### ProductCard

**Description:** Displays product information in a card format.

**Props:**
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
  onQuickView?: (productId: string) => void;
  showAddToCart?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  unit?: string;
}
```

**Usage Example:**
```tsx
import { ProductCard } from '@/components/products/ProductCard';

function ProductGrid({ products }: { products: Product[] }) {
  const handleAddToCart = (productId: string, quantity: number) => {
    cartService.addItem(productId, quantity);
    toast.success('Added to cart!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onQuickView={openQuickView}
          showAddToCart={true}
          variant="default"
        />
      ))}
    </div>
  );
}
```

**Features:**
- Responsive image with lazy loading
- Add to cart button with quantity selector
- Quick view functionality
- Stock status indicator
- Rating display
- Price formatting

---

### ProductList

**Description:** A list view for products with filtering and sorting capabilities.

**Props:**
```typescript
interface ProductListProps {
  products: Product[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  filters?: ProductFilters;
  onFilterChange?: (filters: ProductFilters) => void;
  sortOptions?: SortOption[];
  onSortChange?: (sort: SortOption) => void;
}

interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  inStock?: boolean;
  rating?: number;
}
```

**Usage Example:**
```tsx
import { ProductList } from '@/components/products/ProductList';

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({});

  return (
    <ProductList
      products={products}
      isLoading={isLoading}
      onLoadMore={loadMoreProducts}
      hasMore={hasMore}
      filters={filters}
      onFilterChange={setFilters}
      sortOptions={sortOptions}
      onSortChange={handleSortChange}
    />
  );
}
```

---

### ProductDetail

**Description:** Comprehensive product detail view with images, description, and purchase options.

**Props:**
```typescript
interface ProductDetailProps {
  product: Product;
  onAddToCart: (quantity: number) => void;
  onAddToWishlist?: () => void;
  reviews?: Review[];
  relatedProducts?: Product[];
  isLoading?: boolean;
}
```

**Usage Example:**
```tsx
import { ProductDetail } from '@/components/products/ProductDetail';

function ProductPage({ productId }: { productId: string }) {
  const { product, reviews, relatedProducts } = useProduct(productId);

  return (
    <ProductDetail
      product={product}
      onAddToCart={handleAddToCart}
      onAddToWishlist={handleAddToWishlist}
      reviews={reviews}
      relatedProducts={relatedProducts}
    />
  );
}
```

---

## Cart Components

### CartItem

**Description:** Represents a single item in the shopping cart.

**Props:**
```typescript
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
  variant?: 'default' | 'compact' | 'checkout';
}

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
```tsx
import { CartItem } from '@/components/cart/CartItem';

function CartList({ items }: { items: CartItem[] }) {
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemove(itemId);
    } else {
      cartService.updateQuantity(itemId, quantity);
    }
  };

  return (
    <div className="cart-items">
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          isUpdating={updatingItems.includes(item.id)}
        />
      ))}
    </div>
  );
}
```

---

### CartSummary

**Description:** Displays cart totals and checkout button.

**Props:**
```typescript
interface CartSummaryProps {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
  promoCode?: string;
  onApplyPromo?: (code: string) => void;
  discount?: number;
}
```

**Usage Example:**
```tsx
import { CartSummary } from '@/components/cart/CartSummary';

function CartPage() {
  const { cart } = useCart();

  return (
    <div className="cart-page">
      <CartList items={cart.items} />
      <CartSummary
        subtotal={cart.subtotal}
        tax={cart.tax}
        deliveryFee={cart.deliveryFee}
        total={cart.total}
        itemCount={cart.itemCount}
        onCheckout={handleCheckout}
        onApplyPromo={handleApplyPromo}
        discount={cart.discount}
      />
    </div>
  );
}
```

---

### MiniCart

**Description:** A dropdown cart component for the header.

**Props:**
```typescript
interface MiniCartProps {
  items: CartItem[];
  isOpen: boolean;
  onToggle: () => void;
  onViewCart: () => void;
  onCheckout: () => void;
  itemCount: number;
  total: number;
}
```

**Usage Example:**
```tsx
import { MiniCart } from '@/components/cart/MiniCart';

function Header() {
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { cart } = useCart();

  return (
    <header>
      <nav>
        {/* Other nav items */}
        <MiniCart
          items={cart.items}
          isOpen={isMiniCartOpen}
          onToggle={() => setIsMiniCartOpen(!isMiniCartOpen)}
          onViewCart={() => router.push('/cart')}
          onCheckout={() => router.push('/checkout')}
          itemCount={cart.itemCount}
          total={cart.total}
        />
      </nav>
    </header>
  );
}
```

---

## Order Components

### OrderSummary

**Description:** Displays order details and status.

**Props:**
```typescript
interface OrderSummaryProps {
  order: Order;
  showTracking?: boolean;
  showItems?: boolean;
  variant?: 'full' | 'compact' | 'receipt';
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: Address;
  estimatedDeliveryTime: string;
  createdAt: string;
}
```

**Usage Example:**
```tsx
import { OrderSummary } from '@/components/orders/OrderSummary';

function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const { order } = useOrder(orderId);

  return (
    <div className="confirmation-page">
      <h1>Order Confirmed!</h1>
      <OrderSummary
        order={order}
        showTracking={true}
        showItems={true}
        variant="full"
      />
    </div>
  );
}
```

---

### OrderTracking

**Description:** Real-time order tracking component.

**Props:**
```typescript
interface OrderTrackingProps {
  orderId: string;
  tracking: TrackingInfo;
  onRefresh?: () => void;
  showMap?: boolean;
  showDriver?: boolean;
}

interface TrackingInfo {
  status: OrderStatus;
  estimatedArrival: string;
  driver?: Driver;
  location?: Location;
  timeline: TimelineEvent[];
}
```

**Usage Example:**
```tsx
import { OrderTracking } from '@/components/orders/OrderTracking';

function TrackingPage({ orderId }: { orderId: string }) {
  const { tracking, refetch } = useOrderTracking(orderId);

  return (
    <OrderTracking
      orderId={orderId}
      tracking={tracking}
      onRefresh={refetch}
      showMap={true}
      showDriver={true}
    />
  );
}
```

---

## User Interface Components

### Button

**Description:** Reusable button component with multiple variants.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Usage Example:**
```tsx
import { Button } from '@/components/ui/Button';

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="primary" size="md" isLoading={isSubmitting}>
        Submit Order
      </Button>
      <Button variant="outline" size="md" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="danger" size="sm" leftIcon={<TrashIcon />}>
        Delete
      </Button>
    </div>
  );
}
```

---

### Modal

**Description:** Flexible modal component for overlays and dialogs.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}
```

**Usage Example:**
```tsx
import { Modal } from '@/components/ui/Modal';

function ProductQuickView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Quick View</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Product Details"
        size="lg"
      >
        <ProductDetail product={selectedProduct} />
      </Modal>
    </>
  );
}
```

---

### Toast

**Description:** Notification toast component for user feedback.

**Props:**
```typescript
interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
}
```

**Usage Example:**
```tsx
import { useToast } from '@/hooks/useToast';

function AddToCartButton({ productId }: { productId: string }) {
  const { showToast } = useToast();

  const handleAddToCart = async () => {
    try {
      await cartService.addItem(productId, 1);
      showToast({
        message: 'Item added to cart!',
        type: 'success',
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart')
        }
      });
    } catch (error) {
      showToast({
        message: 'Failed to add item to cart',
        type: 'error'
      });
    }
  };

  return <Button onClick={handleAddToCart}>Add to Cart</Button>;
}
```

---

### SearchInput

**Description:** Search input component with autocomplete and suggestions.

**Props:**
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  showSuggestions?: boolean;
  debounceMs?: number;
}

interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  onClick: () => void;
}
```

**Usage Example:**
```tsx
import { SearchInput } from '@/components/ui/SearchInput';

function ProductSearch() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading } = useProductSuggestions(query);

  const handleSearch = (searchQuery: string) => {
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      onSubmit={handleSearch}
      placeholder="Search for products..."
      suggestions={suggestions}
      isLoading={isLoading}
      showSuggestions={true}
      debounceMs={300}
    />
  );
}
```

---

## Layout Components

### Header

**Description:** Main navigation header component.

**Props:**
```typescript
interface HeaderProps {
  user?: User;
  cartItemCount?: number;
  onSearch?: (query: string) => void;
  onLocationChange?: (location: Location) => void;
  currentLocation?: Location;
}
```

**Usage Example:**
```tsx
import { Header } from '@/components/layout/Header';

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { cart } = useCart();
  const { location } = useLocation();

  return (
    <div className="min-h-screen">
      <Header
        user={user}
        cartItemCount={cart.itemCount}
        onSearch={handleSearch}
        onLocationChange={handleLocationChange}
        currentLocation={location}
      />
      <main>{children}</main>
    </div>
  );
}
```

---

### Sidebar

**Description:** Collapsible sidebar for navigation and filters.

**Props:**
```typescript
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  items: SidebarItem[];
  currentPath?: string;
  variant?: 'navigation' | 'filters';
}

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: SidebarItem[];
  badge?: string | number;
}
```

---

### Footer

**Description:** Site footer with links and information.

**Props:**
```typescript
interface FooterProps {
  links?: FooterLink[];
  showNewsletter?: boolean;
  showSocial?: boolean;
  companyInfo?: CompanyInfo;
}
```

---

## Form Components

### FormField

**Description:** Reusable form field wrapper with label, error, and help text.

**Props:**
```typescript
interface FormFieldProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Usage Example:**
```tsx
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/forms/Input';

function ContactForm() {
  return (
    <form>
      <FormField
        label="Email Address"
        error={errors.email}
        required
      >
        <Input
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
      </FormField>
    </form>
  );
}
```

---

### AddressForm

**Description:** Comprehensive address input form.

**Props:**
```typescript
interface AddressFormProps {
  address: Address;
  onChange: (address: Address) => void;
  errors?: AddressErrors;
  showAddressType?: boolean;
  showInstructions?: boolean;
}
```

**Usage Example:**
```tsx
import { AddressForm } from '@/components/forms/AddressForm';

function CheckoutForm() {
  const [deliveryAddress, setDeliveryAddress] = useState<Address>({});

  return (
    <div className="checkout-form">
      <h3>Delivery Address</h3>
      <AddressForm
        address={deliveryAddress}
        onChange={setDeliveryAddress}
        errors={addressErrors}
        showInstructions={true}
      />
    </div>
  );
}
```

---

## Component Guidelines

### Accessibility
- All components include proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

### Performance
- Components use React.memo for optimization
- Lazy loading for heavy components
- Image optimization with next/image
- Debounced search inputs
- Virtual scrolling for large lists

### Testing
Each component includes:
- Unit tests with Jest and React Testing Library
- Accessibility tests
- Visual regression tests
- Storybook stories for documentation

### Styling
- Tailwind CSS for consistent styling
- CSS modules for component-specific styles
- Dark mode support
- Responsive design patterns
- Animation and transition utilities

### Error Handling
- Graceful error boundaries
- Loading states
- Empty states
- Network error handling
- Form validation

### TypeScript
- Comprehensive prop type definitions
- Generic components where appropriate
- Strict type checking
- Documentation through types