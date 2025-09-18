
Here’s a **complete brand UI/UX color system** for Feeya, grounded in your logo, accessibility standards, and the culturally premium positioning described in your strategy documents.

---

# 🎨 Feeya Design System — Color Palette

## 1. Brand Identity Colors

| Color            | Hex       | Usage                                                                     | Notes                                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Feeya Yellow** | `#FFEB3B` | Primary CTA (buttons, highlights, active icons, progress indicators).     | Bright, energetic, symbolizes warmth and optimism. Works best on dark backgrounds. |
| **Feeya Black**  | `#000000` | Primary background (default app theme), header/footer bars.               | Creates premium contrast; makes yellow and white pop.                              |
| **Feeya White**  | `#FFFFFF` | Primary text on dark surfaces, icons, secondary backgrounds (light mode). | Neutral, ensures clarity and contrast.                                             |

---

## 2. Neutral System Colors (Structural)

| Color               | Hex       | Usage                                                  | Notes                                                 |
| ------------------- | --------- | ------------------------------------------------------ | ----------------------------------------------------- |
| **Charcoal Gray**   | `#1C1C1E` | Card backgrounds, modals, list containers (dark mode). | Slightly softer than pure black to reduce eye strain. |
| **Slate Gray**      | `#2E2E2E` | Dividers, inactive icons, secondary text.              | Balances hierarchy without overpowering.              |
| **Cool Light Gray** | `#F5F5F7` | Light mode background, skeleton loaders, form fields.  | Clean, Apple-like, subtle contrast.                   |

---

## 3. Functional Colors (System Feedback)

| Color             | Hex       | Usage                                                            | Notes                                             |
| ----------------- | --------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| **Success Green** | `#34C759` | Status “Confirmed / Delivered”, positive alerts, success toasts. | Matches Apple’s system success color.             |
| **Error Red**     | `#FF3B30` | Payment failures, form errors, stock alerts.                     | High visibility for critical feedback.            |
| **Info Blue**     | `#0A84FF` | Secondary CTAs, links, active states (like “Help”).              | Calm and trustworthy; default to system blue.     |
| **Warning Amber** | `#FF9500` | Substitution warnings, low stock indicators, ETA delays.         | Distinct from Feeya Yellow to avoid CTA conflict. |

---

## 4. Accessibility & Contrast

* **Primary Contrast Pair**: Yellow (#FFEB3B) on Black (#000000) → passes WCAG AA (ratio \~19:1).
* **Avoid Yellow on White**: Poor contrast; instead use black or gray text on yellow when needed.
* **Touch Targets**: Buttons and chips ≥ 44x44px, with sufficient padding.
* **States**:

  * Disabled: Use Slate Gray (`#2E2E2E`) with 40% opacity.
  * Focus/Active: Outline or glow in Feeya Yellow for clarity.

---

# 📱 Color Usage by Screen

### **Home Screen**

* Background: Feeya Black
* Search bar: White field on Charcoal Gray container
* Category chips: White background, black text, thin yellow outline (active state: filled yellow with black text).
* “Popular Now” highlights: Yellow label/tag on product tiles.

### **Search / Category Results**

* Background: Charcoal Gray
* Product cards: Dark card (`#1C1C1E`) with white text; price highlighted in yellow.
* Empty/error state: Info Blue for links (“Try another search”), Red for errors.

### **Cart**

* Background: Black
* Items: White text, yellow highlights for quantity stepper buttons.
* Subtotal: White
* Delivery fee threshold: Warning Amber if below free-delivery threshold.
* Checkout button: Full-width Feeya Yellow with black text.

### **Checkout**

* Input fields: White background on light gray (`#F5F5F7`) in dark mode.
* Labels: White text.
* Payment buttons: Stripe’s native (Apple Pay = black, Google Pay = white, Bancontact = blue) for recognition.
* Primary “Pay €XX” button: Feeya Yellow with black text.

### **Order Confirmation**

* Background: Black
* Success checkmark: Success Green
* Order details: White text with yellow highlights (ETA band).
* Secondary CTA (“Shop again”): Info Blue.

### **Track Order**

* Map markers: Driver = Yellow pin, Destination = Info Blue pin.
* Timeline:

  * Confirmed = Green
  * Preparing = Blue
  * Out for delivery = Yellow
  * Delivered = Green
* Status pill background = Charcoal Gray, text = white.

---

# 🌗 Light vs Dark Modes

* **Dark Mode (Default)**: Black + Yellow = Feeya’s bold, premium look.
* **Light Mode (Optional)**: White background, black text, yellow CTAs. Retains accessibility for users preferring light UIs.

---

