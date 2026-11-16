# Area 36 — Inventory Management

## Status
🔲 Pending

## Decisions Made
- **Current state**: `sizes[].stock` field exists in product schema but is never decremented
- **No inventory tracking**: Stock levels never updated when orders are placed
- **Out-of-stock behavior**: Not implemented (no logic to hide/show/label out-of-stock items)
- **Low stock alerts**: Not implemented
- **Multi-platform selling**: Not applicable (single store)

*Source: key-findings.md line 91 — "No inventory tracking", data-flow.md lines 63-68 (sizes[].stock exists)*

## Next Steps
- Implement stock decrement on order placement (requires order management first)
- Add out-of-stock label display on product cards and detail pages
- Add low-stock alerts in admin panel
- Decide: auto-tracking (decrement on order) or manual (admin updates stock)
- Decide: hide out-of-stock items or show with "out of stock" badge

## References
- `key-findings.md` line 91 — Critical gap
- `data-flow.md` lines 63-68 — Product size/stock schema
- `key-findings.md` line 163 — Recommendation
