# Blueprint — Athletica (FULL MARKETPLACE)

**Date:** Mon Nov 16 2026
**Mode:** Plan (every area settled Decided / Skip / Pending)
**Prepared by:** Product Management agent
**Status:** Recommendation. No code, configuration, deployment, or product change has been made. The decision remains the owner's.
**Scope:** FULL marketplace — every surface, every entity, every capability the 7 RE engagements studied. Not an MVP.
**Supersedes:** the 2026-10-24/26 six-layer plan in `product-management/` (predates the RE findings) AND the 2026-11-16 MVP blueprint draft (this same folder, prior version), which treated the marketplace as a thin affiliate funnel.

## What this is

This is the Plan-mode blueprint for the **Athletica football affiliate marketplace** — a single Next.js app that does four things:

1. **Public storefront:** homepage, catalog browse + search, product detail with variants + reviews, and a SHOP PRODUCT CTA that redirects to Amazon in the visitor's local marketplace.
2. **Private admin workspace:** full product CRUD + variants + bulk import, media library, live analytics dashboard, affiliate + payout management.
3. **Affiliate dashboard:** self-serve signup + onboarding, trackers, balance, payout requests.
4. **Amazon integration:** 22-marketplace geo-routing, PAAPI product cache with availability, dead-link detection, reviews.

The blueprint is built from the **reverse-engineering findings** — 7 engagements, 10 samples, all reported 2026-11-16 in `reverse-engineering-workspace/`. Every rule traces to a `report.md` `file:line` citation. Full evidence in `product-management/02-area-decisions-evidence.md`; rule extracts in `product-management/01-re-findings-consolidated.md`; Feature Cards in `product-management/03-feature-cards.md`.

## The names (from the blueprint skill)

| Name | What it is |
|---|---|
| **Blueprint** | This whole folder. |
| **Build Layers** | UI, Data, Business logic, Functionality. Study order: UI → Data → Business logic → Functionality. **Build order (confirmed 2026-11-08): Functionality → Business logic → Data → UI.** |
| **UX Thread** | Runs through every layer. Shapes each one. |
| **Engine** | 10 Engine Parts. Sits under the Build Layers. |
| **Project Ring** | The work around the product: client, version control, legal, docs, handoff, progress. |
| **Checklist** | The 80 areas. In Plan mode each is Decided / Skip / Pending. |
| **Home** | The one place an area belongs. |
| **Feature Card** | A short note that traces one feature through every layer. |

## How to read this folder

1. **This README** — scope, build order.
2. **`01-build-layers.md`** — UI, Data, Business logic, Functionality + UX Thread.
3. **`02-engine.md`** — the 10 Engine Parts.
4. **`03-project-ring.md`** — the work around the product.
5. **`04-checklist.md`** — the 80-area table, every area Decided/Skip/Pending.
6. **`05-gap-questions.md`** — the 17 extras (D1–D9, R1–R5, C1–C3).
7. **`06-iso-25010.md`** — the quality double-check.

Evidence behind any decision: `product-management/02-area-decisions-evidence.md`.

## Scope

**In scope (full marketplace):** storefront (homepage + catalog + search + categories), product detail (variants + reviews + JSON-LD), redirect + click pipeline with geo-routing, three-locks admin auth, full product CRUD + variants + bulk import, media library, live analytics dashboard, affiliate program (signup + trackers + balance + payouts), Amazon PAAPI cache + availability + dead-link detection, i18n for 22 marketplace locales, Sentry, legal.

**Skip (honest, structural — not deferrals):**
- **Amazon owns the transaction (5 areas):** payment, inventory, cart/checkout, shipping, order management. We are an affiliate marketplace, not a retailer.
- **No mobile app (7 areas):** app store, push, device, offline-mobile, app updates, deep links, mobile-perf.
- **No PWA (1 area):** one-shot visits + dashboards (degrade to polling).
- **No outgoing webhooks (1 area):** PAAPI is polled.

**14 Skips total — all structural to the business model, not MVP shortcuts.**

## The one loop (still the entry point)

```
Instagram link → /product/product-1?utm_source=instagram ─┐
                                                          ├→ SHOP PRODUCT → /go/[id] → Amazon (visitor's marketplace)
WhatsApp link  → /product/product-2?utm_source=whatsapp ─┘
```

- Phone-first; in-app browsers primary.
- No price on the page (Amazon Associates policy). CTA says **SHOP PRODUCT**.
- CTA greyed + disabled when ASIN/tag missing or dead-link; no click recorded.
- Geo-routed to the visitor's local Amazon marketplace.
- Clicks recorded server-side, with `utm_source` + visitor hash; bots skipped; EU IPs redacted; attributed to an affiliate tracker if `/go/[id]` is a tracker URL.

## Build order (6 phases — full system)

| Phase | What ships |
|---|---|
| 1 Foundation | Three-locks auth, core data model, product page, redirect + click pipeline, analytics pipeline (visitor hash, salt rotation, bot filter). |
| 2 Storefront | Homepage (3-up grid + carousel), catalog browse + search + categories, product detail with variants + reviews + JSON-LD. |
| 3 Admin workspace | Full product CRUD + variants + bulk import, media library, live analytics dashboard. |
| 4 Affiliate program | Signup + onboarding, trackers, campaigns, balance ledger, payout request + admin review + state machine. |
| 5 Amazon integration | 22-marketplace geo-routing, PAAPI cache, availability checks, dead-link detection, reviews via PAAPI. |
| 6 Hardening | i18n (marketplace locales), real-time analytics, Sentry, legal, handoff, documentation. |

Each phase ends with a phase gate: the owner reviews before the next phase begins.

## Inputs

- `reverse-engineering-workspace/` — 7 engagements (YOURLS, Dub, Raider, Weferral, Amazon Auto Links, Spree, athletica/rollout own, NextBase, Plausible, Vercel Commerce).
- `BLUEPRINT.md` (root, Study mode, mini) — the current state of the existing app.
- `product-management/ROLLOUT-MVP-SIX-LAYERS.md` (2026-10-26) — stale; only locked constraints carry.
- `web-development-areas.md` (root) — the 80-area checklist source.
