# Plan — Blueprint (Plan mode) for the FULL Athletica marketplace

**Date:** Mon Nov 16 2026
**Agent:** Product Management
**Status:** Owner said **yes** to full-software scope. Work in progress.
**Method:** the `blueprint` skill, Plan mode.
**Supersedes:** the 2026-10-24/26 six-layer plan AND the 2026-11-16 MVP blueprint draft (this same folder, prior version). Both treated the marketplace as a thin affiliate funnel (one product page, two backlinks). The owner clarified: **full software**, not just one product page.

## What the owner asked for

Replan Athletica as the **full marketplace** — every surface, every entity, every capability the 7 RE engagements studied — using the blueprint skill, drawing on the reverse-engineering findings. Not an MVP. Not a one-page funnel. The whole thing: storefront, catalog, admin workspace, affiliate program, geo-routing, analytics, dead-link detection, Amazon integration.

## Scope: full marketplace

**Every surface, built:**
- Public storefront with a real homepage (Vercel Commerce 3-up hero grid + carousel + footer), catalog browsing, search, categories.
- Full admin workspace: products + variants, bulk import, media library, analytics dashboard, affiliate + payout management.
- Affiliate storefront / dashboard: signup, onboarding, trackers, balance, payout requests.
- Geo-routing to 22 Amazon marketplaces.
- Dead-link detection as a first-class subsystem.
- Amazon PAAPI cache + availability + reviews.

**No "later phase" deferrals.** The affiliate ledger (Raider + Weferral), geo-routing (Amazon Auto Links 22-marketplace map), and dead-link detection are in-scope, built as real subsystems, not modeled-and-deferred.

**What genuinely stays Skip (honest, not deferral):**
- Cart, checkout, payment, inventory, shipping, order management — Amazon owns the transaction; we are an affiliate marketplace, not a retailer.
- Mobile-app surfaces (app store, push, device, offline-mobile, deep links) — no mobile app; full web software.
- PWA/offline — one-shot visits; no PWA value.
- Outgoing webhooks — PAAPI is polled.

## What I will produce

**Deliverable (outside the workspace, its own folder):** a Plan-mode blueprint at `blueprint/` — the 4 Build Layers + UX Thread + 10 Engine Parts + Project Ring, every one of the 80 areas settled to **Decided / Skip / Pending**, the 17 gap questions answered, ~14 Feature Cards for the full scope, and the ISO 25010 double-check.

**Artifacts (inside `product-management/`):**
- `PLAN-blueprint.md` — this file.
- `01-re-findings-consolidated.md` — every rule from the 7 RE engagements (unchanged; the rules don't change with scope, only which ones are in-scope vs deferred).
- `02-area-decisions-evidence.md` — for each of the 80 areas + 17 gap questions: the decision and the citation. Flips the MVP's deferral-Skips to Decided for the full build.
- `03-feature-cards.md` — ~14 Feature Cards, no "later phase."
- `EVIDENCE.md` — commands run, files read, verification.

## Inputs (unchanged)

- `reverse-engineering-workspace/engagements/01–07/*/2026-11-16/report.md` (7 engagements, 10 samples, all reported).
- `BLUEPRINT.md` (root, Study mode, mini) — the current state of the existing app.
- `product-management/ROLLOUT-MVP-SIX-LAYERS.md` (2026-10-26) — stale; only the locked product constraints carry (no price on page, SHOP PRODUCT CTA, phone-first, plain 404, Sentry, Sanity images).
- `web-development-areas.md` (root) — the 80-area checklist source.

## Build order (phased — full system)

1. **Phase 1 — Foundation:** three-locks auth, core data model, product page, redirect + click pipeline, analytics pipeline (visitor hash, salt rotation, bot filter).
2. **Phase 2 — Storefront:** homepage (3-up grid + carousel), catalog browsing, search, categories, product detail with variants + reviews + JSON-LD.
3. **Phase 3 — Admin workspace:** full product CRUD + variants, two-phase CSV import, media library, live analytics dashboard.
4. **Phase 4 — Affiliate program:** affiliate signup + onboarding, trackers, campaigns, balance ledger, payout request + admin review + state machine.
5. **Phase 5 — Amazon integration:** 22-marketplace geo-routing, PAAPI cache, availability checks, dead-link detection, reviews via PAAPI.
6. **Phase 6 — Hardening:** i18n (marketplace locales), real-time analytics, Sentry, legal, handoff, documentation.

## Boundaries (unchanged)

- I recommend; I do not decide.
- No code, no config, no deploy, no tickets.
- I write only inside `product-management/` (artifacts) and `blueprint/` (the deliverable).
- Every decision cites a RE `report.md` `file:line` or the existing app.

## Stop point

Work ends when the blueprint is handed back. Nothing is built, shipped, or changed by me.
