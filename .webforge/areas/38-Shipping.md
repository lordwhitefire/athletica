# Area 38 — Shipping & Delivery

## Status
🔲 Pending

## Decisions Made
- **Current state**: Address collected at checkout but not processed
- **No shipping calculation**: No zones, no cost calculation, no tracking
- **Product type**: Physical goods (football boots/sports gear)
- **Delivery responsibility**: Not assigned (client or courier?)

*Source: key-findings.md lines 92-93 — "No shipping calculation", key-findings.md line 164*

## Next Steps
- Determine who handles shipping (client or external courier)
- Define shipping zones (Nigeria only or international)
- Implement shipping cost calculation (flat rate, by weight, or by location)
- Show delivery time estimates to customers
- Add order tracking integration (optional, post-MVP)
- Decide on free shipping thresholds

## References
- `key-findings.md` lines 92-93 — Shipping gap
- `key-findings.md` line 164 — Recommendation
