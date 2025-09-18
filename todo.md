# Feeya MVP — Execution Tracker

## Phase 0 — Foundations
- [] Set Expo Router, entry, and navigation skeleton
  - [] Update `App.tsx` and `index.ts` to use `expo-router`
  - [] Create `app/_layout.tsx` and `(tabs)` with `index`, `search`
  - [] Stub `cart`, `checkout/index`, `order/confirmation`, `order/track`
- []Apply logo as app icon and favicon in `app.json`
- [] Create theme tokens
  - [] `theme/colors.ts` using `color_palette.md`
  - [] `theme/typography.ts`
- [] Adjust TypeScript config (`tsconfig.json` paths)
- [] Install dependency set compatible with Expo SDK 51 and Router v3
- [ ] Verify iOS boot end-to-end and tab navigation

## Phase 1 — Catalog & Cart
- [ ] Catalog list UI (2-column grid) and category chips
- [ ] Basket store with add/update/remove and substitution toggle
- [ ] Sticky delivery bar (postcode, fee, ETA)

## Phase 2 — Checkout
- [ ] Address search + validation
- [ ] Guest identity via OTP
- [ ] Stripe card payment + capability detection

## Phase 3 — Confirmation & Tracking
- [ ] Order confirmation screen with ETA and summary
- [ ] Track-order status timeline

## Phase 4 — Instrumentation & Polish
- [ ] Analytics events baseline
- [ ] Sentry setup
- [ ] Accessibility and performance passes