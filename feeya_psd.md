# **Feeya MVP — Product Specification Document (PSD)**

**Version:** 1.0  
 **Date:** 12 Sep 2025

---

## **0\. Product Vision (MVP framing)**

Feeya helps diaspora households in Belgium get culturally specific groceries delivered quickly and reliably. The MVP focuses on **discovery → add to cart → checkout → order confirmation → basic tracking** for a **single logical store** in a limited delivery zone.

**MVP principles**

* Make **delivery expectations** obvious up-front (coverage, ETA, fee).

* Optimize for **zero-friction checkout** (native wallets when available \+ card fallback), **guest** identity via phone OTP.

* Modular, flag-guarded features to iterate weekly.

---

## **1\. Goals & Non-Goals**

**Primary Goals (G1–G5)**

* **G1:** Native IOS and Andriod apps.   
* **G2**: Convert first-time visitors in eligible postcodes to first order in ≤5 minutes.  
* **G3:** Ensure **LCP \< 2.5s** on a mid-tier Android over 4G; cart persists across refresh.  
* **G4:** Offer **Apple Pay / Google Pay / Bancontact** when supported; always show card fallback (SCA-ready).

* **G4:** Provide clear **order status timeline** (Confirmed → Preparing → Out for delivery → Delivered). \#\# No live map in MVP.

**Non-Goals (out of scope for MVP)**

* Multi-vendor baskets; detailed vendor pages.

* Real-time courier location map.

---

## **2\. Target Users & Use Cases**

**Personas (condensed)**

* **Diaspora Parent:** weekly staples (fufu, plantain, egusi, etc), wants reliability and substitutions control.

* **Student:** small baskets, price/fee sensitive, prefers native wallet payments.

**Top Use Cases**

1. Search for a staple (“plantains”), add to cart, check total with fees visible, pay with Apple/Google Pay, receive confirmation \+ ETA.

2. Browse category (“Rice & Grains”), add multiple items, adjust quantities in cart, toggle substitution policy, complete checkout with card, Apple/Google Pay, receive confirmation \+ ETA.

---

## **3\. Success Metrics & Guardrails**

**North-star (NS):** First-order completion rate for eligible visitors.

**Activation funnel metrics**

* Home → Search/Category click ≥ **60%**

* Product list Add-to-Cart rate ≥ **12%**

* Cart → Checkout start ≥ **70%**

* Checkout completion rate ≥ **75%**

**Operational SLAs**

* On-time delivery (within promised band): **≥ 85%**

* Refund/issue rate: **≤ 3%** of orders

**Performance & Quality**

* LCP \< 2.5s; TTI \< 4s; 0 blocking main-thread \> 200ms tasks

* WCAG 2.1 AA for critical flows

---

## **4\. Information Architecture & Flows**

**Primary screens**

1. **Home (Welcome)** – What/where/when/how much; search; categories

2. **Search/Category Results** – 2-column grid, add buttons, size/unit price, availability

3. **Cart** – Items with \+/- steppers, substitution toggle, fees/thresholds, proceed

4. **Checkout** – Address (search first, location second), contact name \+ phone OTP, payment methods, review total, pay

5. **Order Confirmation** – Thank you, order \#, ETA band, delivery address, items summary, track order link

6. **Track Order (basic)** – Status timeline (no map), help link

**Golden path**: Home → Search → Add → Cart → Checkout → Pay → Confirmation

---

## **5\. Functional Requirements (FR)**

### **5.1 Home**

* **FR-H1:** Sticky bar: editable **postcode**, **delivery fee**, **next ETA band** (e.g., 18:30–19:00).

* **FR-H2:** Language: EN/FR/NL auto-detect from device with manual toggle.

* **FR-H3:** Prominent search with autocomplete (popular terms \+ synonyms/typos).

* **FR-H4:** “Shop by Category” chips: Stews & Soups, Rice & Grains, Spices & Seasonings, Meat & Fish, Snacks & Drinks, Fresh Produce, Bakery.

* **FR-H5:** “Popular now” carousel and “Essentials bundles” (feature-flagged; default off at launch).

### **5.2 Search & Category Results (**Use Meilisearch as the search engine)

* **FR-S1:** 2-column product grid with image, **name**, **size/weight**, **unit price (€/kg/L)**, **price**, availability.

* **FR-S2:** Primary action **Add** (tap → “Added ✓” → quantity stepper). Image tap opens optional PDP modal.

* **FR-S3:** Filters (flagged): price, dietary (Halal/Vegan), ETA.

* **FR-S4:** Error/empty states with suggested queries.

### **5.3 Product Detail (PDP modal) — optional**

* **FR-P1:** Ingredients/allergen badges, origin, shelf-life tips. No reviews in MVP.

### **5.4 Cart**

* **FR-C1:** Item rows with thumbnail, name, size, **\+/- steppers**, line price.

* **FR-C2:** **Substitution policy toggle** (default off). Link to policy.

* **FR-C3:** Costs: **Subtotal**, **Delivery fee**, **Discounts**, **Total** (bold). Microcopy: “€3.99 delivery • Free over €40”.

* **FR-C4:** Validation: min-order threshold; stock/price changes surfaced inline.

* **FR-C5:** CTA: **Proceed to Checkout** (persistent at bottom on mobile).

### **5.5 Checkout**

* **FR-CH1:** Sections order: **Address → Contact → Payment**.

* **FR-CH2:** Address search (Places autocomplete). Secondary action: “ Use my current location” (permission prompt with context). Never prefill city; use suggestions.

* **FR-CH3:** Fields: Street & Number, Apartment (optional), Postal code, City. Country fixed (Belgium) for MVP.

* **FR-CH4:** Contact: Full name; Phone number. **One-time OTP** for identity (guest checkout). Optional email for receipt/updates.

* **FR-CH5:** Payment methods (capability-detected): **Apple Pay / Google Pay / Bancontact** buttons; always show **Card (Stripe)** inline. SCA flows supported.

* **FR-CH6:** Final summary: Items (collapsible), fees, **“Pay €XX.XX”** primary button.

* **FR-CH7:** Consent: privacy \+ T\&Cs checkbox; marketing opt-in unchecked by default.

### **5.6 Order Confirmation**

* **FR-O1:** Large success state; **Order \#**, **ETA band**, delivery address, items summary (collapsible), “Track Order”.

* **FR-O2:** Secondary CTAs (flagged): “Reorder this basket”, “Share Feeya”.

### **5.7 Track Order (basic)**

* **FR-T1:** Status timeline: Confirmed → Preparing → Out for delivery → Delivered; timestamps.

* **FR-T2:** “Need help?” link to support (email/chat form). No map.

---

## **6\. Business & Ops Rules**

* **Coverage:** Only allow checkout within configured delivery zones; show apology & waitlist for others.

* **ETAs:** Precomputed slot bands by zone and hour; shown on Home/Category/Cart/Checkout/Confirmation.

* **Stock:** Prevent oversell; surface changes at add-to-cart/checkout with inline toasts.

* **Substitutions:** If enabled, follow mapper table (preferred alternatives, price difference rule: refund deltas \> €0.20 unless approved).

* **Refunds:** Full/partial via Stripe dashboard; customer notified by email/SMS.

---

## **7\. Non-Functional Requirements (NFR)**

**Performance**

* Image CDN (AVIF/WebP), responsive `srcset`, lazy loading, skeletons.

* API p95 \< 300ms within region; end-to-end p95 \< 2s for list responses.

**Reliability**

* Idempotent cart/checkout operations; retries with exponential backoff.

* Graceful degradation if payment wallet unavailable.

**Accessibility**

* 44px tap targets; focus states; ARIA on controls; color contrast ≥ 4.5:1; prefers-reduced-motion.

**Localization**

* EN/FR/NL; ICU message format; number/currency formatting; RTL-safe styles.

**Security & Privacy**

* Stripe for PCI scope reduction; phone OTP rate-limited; data minimization; consent logging; GDPR DSAR-ready.

---

## **8\. Technical Architecture (MVP suggestion)**

* **Frontend:** React Native for cross platform app.  
* **Backend:** Serverless API (Node) for catalog/cart/checkout; Postgres (Supabase)   
* **Payments:** Stripe (Cards, Apple Pay/Google Pay; Bancontact via Stripe Sources/Payment Intents). Capability detection on client.

* **Addressing:** Places autocomplete \+ reverse geocoding via provider; server-side validation.

* **Auth:** Session cookie post OTP (guest); optional account scaffold behind flag.

* **Observability:** Cloud logs \+ error tracking (e.g., Sentry); uptime monitor.

---

## **9\. Data Model (high level)**

* **Product** {id, name, category, image, size/weight, unit, price, unit\_price, allergens\[\], availability}

* **Basket** {id, items\[{product\_id, qty, price\_snapshot}\], subtotal, created\_at}

* **Customer** {id, name, phone, email? consent\_flags}

* **Address** {id, street, number, apt?, postal\_code, city, lat, lng}

* **Order** {id, basket\_id, customer\_id, address\_id, status, fee, total, eta\_band, substitution\_allowed, payment\_intent\_id}

* **Event** {id, name, payload, ts}

---

## **10\. Analytics & Events (Tracking Plan)**

* `view_home` {postcode\_set}

* `click_category` {category}

* `search_submit` {query\_len, source}

* `product_impression` {product\_id}

* `add_to_cart` {product\_id, qty}

* `view_cart`

* `start_checkout`

* `address_confirmed` {postal\_code}

* `phone_otp_sent` {country\_code}

* `payment_method_selected` {method}

* `purchase` {order\_id, value, fee, items\_count}

* `checkout_error` {stage, reason}

* `order_status_update` {order\_id, status}

---

## **11\. Edge Cases & Error States**

* Wallet not available → show card fields by default; explain.

* Price/stock update during checkout → inline notification, auto-recalc, require confirm.

* Address outside zone → disable pay, prompt to change address or join waitlist.

* OTP delivery failure → fallback to voice call OTP (flagged).

---

## **12\. Content & Microcopy (samples)**

* **Home sticky:** “Delivering to **{postcode}** • **€{fee}** fee • Next slot **{eta}**.”

* **Permissions:** “Use your location to fill address faster (we’ll ask once).”

* **Cart empty:** “Your basket is empty — popular essentials below.”

* **Substitutions toggle:** “Allow similar items if something’s out of stock.”

---

## **13\. Risks & Mitigations (MVP)**

* **Inaccurate ETAs** → Conservative bands; start with Standard-only; instrument lateness.

* **Payment frictions** → Capability sniffing; wallet-first UI; SCA test cases; card fallback.

* **Stock mismatches** → Daily manual stock updates \+ “mark OOS” back-office; customer-first refunds.

* **Courier capacity** → Start with limited slot availability; cap concurrent orders.

---

## **14\. Rollout Plan (Agile, modular)**

**Sprint 0 (1 week)** — Skeleton app, catalog, product list, cart state, sticky delivery bar.  
 **Sprint 1 (1–2 weeks)** — Checkout (address search, contact, card payments), order confirmation, basic admin order view.  
 **Sprint 2 (1 week)** — Wallet payments (Apple/Google/Bancontact), phone OTP, track-order timeline, instrumentation.  
 **Sprint 3 (1 week)** — Substitution toggle, free-delivery threshold, PWA polish, accessibility fixes.  
 **Beta** — Hasselt-only soft launch (friends & family), daily ops standups.  
 **GA** — Expand to Brussels segments once SLAs hit.

**Feature flags**: bundles, filters, reorder, referral, voice OTP, map tracking.

---

## **15\. Acceptance Criteria (per screen)**

**Home**

* Given eligible postcode, fee & ETA show; changing postcode updates eligibility.

* Search autocomplete suggests at least 5 popular items.

**Results**

* Grid tiles show name/size/unit price/price; Add flows to quantity stepper.

**Cart**

* Min-order enforced; substitution toggle persists through checkout.

**Checkout**

* Address search before location; OTP verifies phone; wallets shown only when available; SCA passes; final button displays “Pay €X.XX”.

**Confirmation/Tracking**

* Order number shown; ETA band repeats; status timeline updates via webhook/simulator.

---

## **16\. QA Plan**

* Device matrix: iPhone Safari, Pixel Chrome, mid-tier Android; desktop Chrome/Edge.

* Payment test cases: wallet present/absent; SCA challenge; decline; partial refund.

* Accessibility pass: keyboard-only, screen reader paths for all CTAs.

* Performance budget checks on CI.

---

## **17\. Open Questions**

* Initial delivery zones & fee/threshold values per postcode?

* Exact substitution rules (brand → brand, size deltas)?

* Which address/places provider and pricing?

* Support channel for MVP (email vs embedded chat)?

---

## **18\. Appendices**

* Terminology glossary

* Config dictionary (fees, thresholds, ETA bands)

* Event taxonomy reference

