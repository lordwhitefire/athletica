# Area 37 — Cart & Checkout

## Status
✅ Decided (Partial — cart complete, checkout pending)

## Decisions Made
- **Cart type**: Multi-product (full shopping cart)
- **Guest checkout**: No account required
- **Cart persistence**: Cookie-based (`athletica_cart`, 30-day expiry)
- **Cart scope**: Per-device only — no cross-device sync
- **Cart operations**: addToCart, removeFromCart, updateQuantity, clearCart, isInCart
- **Cart storage**: Purely client-side — no database storage
- **Checkout steps**: Single page (placeholder — "demo, no real payment")
- **Address collection**: Collected at checkout but not stored or used for shipping
- **No server-side cart**: Cart is entirely client-side
- **MiniCart**: Slide-in drawer component with tests

*Source: data-flow.md lines 150-164, architecture.md lines 64-67, key-findings.md line 15*

## Next Steps
- Implement real payment integration (Paystack/Stripe) — top priority
- Connect checkout flow to payment provider
- Add order summary page before payment confirmation
- Consider saved cart (persists after browser close — already done via cookie)

## References
- `data-flow.md` lines 150-164 — Cart implementation details
- `src/context/CartContext.tsx` — Cart context provider
- `src/components/cart/CartPage.tsx` — Cart page
- `src/components/cart/MiniCart.tsx` — MiniCart component
- `app/cart/page.tsx` — Cart route
- `app/checkout/page.tsx` — Checkout route (placeholder)
