# Implementation Report: INV-01 — Rainforest single-ASIN field inventory (probe)

## Summary

Probe executed against the Rainforest Product API for one real ASIN (`B0FN655XF8`, adidas Real Madrid 25/26 Men's Third Jersey). Exactly **1 request** was spent (credits: 1 used / 99 remaining). The full raw response was captured to disk and a field inventory was produced, mapped against the rollout product schema. This is an owner-supervised pre-architecture probe — **no `testing.md`**, no code in the apps, no schema or database changes.

## Files Created

| File | Purpose | Git status |
|------|---------|-----------|
| `inv01.mjs` (repo root) | Standalone probe script: reads `RAIN_FOREST_API_KEY` via dotenv, makes 1 Rainforest product call, saves raw JSON, prints flattened field inventory + schema coverage | Git-ignored |
| `node_modules/dotenv/` | Copied from `frontend/node_modules` (dotenv 16.6.1, zero deps) so the root script can load `.env` without installing anything | Git-ignored |
| `inv01-B0FN655XF8.json` (repo root) | Full raw Rainforest response for the ASIN | Git-ignored |
| `openspec/tasks/INV-01/inventory.md` | Field inventory + "Rainforest gives us" vs "research agent must supply" two-column list | Tracked |

## How it ran

Approved by owner mid-run (AGENTS.md hard-stop rule respected — the owner explicitly said "run it"). Key loaded from `rollout/.env.local` via dotenv (pointed there after owner noted the key lives in the rollout folder). The key itself was never read, printed, or committed.

- Request: `GET https://api.rainforestapi.com/request?type=product&asin=B0FN655XF8&amazon_domain=amazon.com`
- Result: HTTP 200, `success=true`, credits_used=1, credits_remaining=99

## Field inventory result

Response shape: `request_info`, `request_parameters`, `request_metadata`, `product`.

**8/25 rollout schema fields have a usable source in one product response:**

| Schema field | Source | Notes |
|---|---|---|
| `name` | `product.title` | Dirty — contains repeated variant tokens `(US, Alpha, Small, Regular, Regular, Blue Bird)` |
| `price` | `product.buybox_winner.price` | `$70.20 USD` — buybox (featured offer) only |
| `asin` | `product.asin` | `B0FN655XF8` |
| `color` | `product.color` | `Blue Bird` |
| `main_image` | `product.main_image.link` | Single low-res URL |
| `availability` | `product.buybox_winner.availability` | `in_stock`, stock_level 1, "Only 1 left in stock - order soon." + `dispatch_days` |
| `technical_details` | `product.specifications` | **Partial** — 26 raw name/value rows (care, fabric, weight, UPC, etc.), needs rewriting as styled copy |
| `key_benefits` | `feature_bullets` | **Weak** — exactly 1 bullet |

**17/25 missing/partial** — must come from the research agent: `slug`, `gender` (only "Department: mens" in spec prose), `collection`, `tagline`, `subtitle`, `intro`, `adjustment`, `range`, `sole_type`, `upper_material` (only generic `material`), `traction`, `images[]` (no gallery returned — main_image is the only image), `meta`, `tags[]`, `box_contents`, `sizes`, `sizes_detail` (`has_size_guide=true` is a boolean only, no size data).

**Bonus fields returned (not in the rollout schema):** brand, rating 5.0 / ratings_total 6 / rating_breakdown / 2 top_reviews, categories path + flat, bestsellers_rank (Sports & Outdoors #164,380 / Sports Fan Jerseys #595), first_available (2025-10-10), weight, dimensions, keywords_list, buybox extras (new_offers_count 3, shipping $12.90, return_policy 30-day, third_party_seller, FBA flags).

## Constraints hit & resolved

| Constraint | Resolution |
|---|---|
| Root `node_modules` has no dotenv | Copied `frontend/node_modules/dotenv` (16.6.1, zero deps) — no install |
| No root `.env` | Owner confirmed key lives in `rollout/.env.local`; script loads that then falls back to root `.env` |
| Key must never leak | Env var only, never logged; raw JSON and script are git-ignored |

## Acceptance benchmarks met (from task.md)

| Benchmark | Status |
|---|---|
| Raw Rainforest JSON for one chosen ASIN exists in a file | ✅ `inv01-B0FN655XF8.json` (git-ignored) |
| Field inventory exists, mapped against rollout schema fields, populated vs empty | ✅ `openspec/tasks/INV-01/inventory.md` |
| Two-column list: "Rainforest gives us" / "the research agent must supply" | ✅ `inventory.md` |
| Exactly one request consumed | ✅ 1 used, 99 remaining |
| Nothing in the apps, schema, or database changed | ✅ Only root probe files + `inventory.md` in openspec |

## Known gaps / follow-ups

1. **Single-product bias** — findings are from one jersey ASIN. Footwear (the actual rollout products) may return different fields; the schema coverage exercise should be re-run on a shoe ASIN before architecture if credits allow.
2. **One image only** — image gallery sourcing strategy needed regardless.
3. **Size data unavailable** from this endpoint — size feed will need an external source (e.g. seller size tables) even for `has_size_guide` products.

## Next steps

- Architect reads `inventory.md` and this report before designing the ingestion pipeline and the research-agent spec — per the "probe before architecture" decision.
- Registry: INV-01 is eligible to be ticked ✅ after owner review.