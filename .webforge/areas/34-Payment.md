# Area 34 — Payment Integration

## Status
🔲 Pending

## Decisions Made
- **Current state**: Checkout page shows "demo, no real payment" placeholder
- **No payment integration built**: This is the #1 blocker to going live

*Source: key-findings.md line 89 — "No payment integration"*

## Next Steps
- **Integrate Paystack** (primary) for Nigerian customers — accepts Naira, cards, USSD, bank transfer
- **Integrate Stripe** (secondary) for international customers — USD
- Implement webhook handling for payment events (success, failed, refunded)
- Add test mode vs live mode toggle in admin settings
- Build receipt/invoice generation flow
- Handle failed payment scenarios gracefully
- Set up refund flow in admin panel

## References
- `key-findings.md` lines 89-90 — Critical gaps
- `key-findings.md` line 160 — Recommendation: Paystack first, Stripe for international
