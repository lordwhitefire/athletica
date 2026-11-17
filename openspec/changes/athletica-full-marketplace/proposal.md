# Proposal — athletica-full-marketplace

**Date:** 2026-11-16
**Architect:** openspec-architect (Moment 1)
**Source plan:** `blueprint/` (the Plan-mode blueprint for the full Athletica marketplace) + `product-management/04-creators-api-recommendation.md` (the Creators API decision).
**Supersedes:** the MVP-scoped pending items in `openspec/tasks-registry.md` (ROLL-08/09/15/16/17/18, ARCH-10/11) and the old `roll-arch` / `athletica-architecture` changes where they conflict with the full-marketplace scope.

## What this change is

Build Athletica as the **full football affiliate marketplace** — not the one-page MVP. Every surface the reverse-engineering engagements studied, built as real subsystems: storefront (homepage + catalog + search + product detail with variants + reviews), redirect + click pipeline with geo-routing, three-locks admin auth, full product CRUD + variants + bulk import, media library, live analytics dashboard, affiliate program (signup + trackers + balance + payouts), Amazon Creators API integration (optional booster, own-data-first), dead-link detection, i18n for 22 marketplaces, monitoring, legal.

## Why

The MVP plan (2026-10-26) treated Athletica as a thin affiliate funnel (one product page, two backlinks). The owner clarified: **full software**. The 7 reverse-engineering engagements (2026-11-16) extracted rules for the whole marketplace; the blueprint (2026-11-16) plans the whole marketplace; the Creators API recommendation (2026-11-16) corrects the Amazon-data assumption (PA-API 5 is dead; use own-data-first with the Creators API as an optional booster). This change turns that decided plan into architecture + a task registry the Builder can work through.

## Scope

**In:** everything in `blueprint/04-checklist.md` marked Decided (66 of 80 areas). 6 build phases, 26 tasks (FM-01…FM-26).

**Out (structural, not deferral):** the 14 Skips — Amazon owns the transaction (payment, inventory, cart/checkout, shipping, order mgmt); no mobile app; no PWA; no outgoing webhooks.

## Build order (6 phases, 26 tasks)

| Phase | Tasks | Ships |
|---|---|---|
| 1 Foundation | FM-01…FM-05 | Three-locks auth, core data model, product page, redirect + click pipeline, analytics pipeline. |
| 2 Storefront | FM-06…FM-09 | Homepage, catalog browse + search, product detail with variants + reviews, SEO suite. |
| 3 Admin workspace | FM-10…FM-14 | Product CRUD + variants + categories, bulk ops, CSV import, media library, live analytics dashboard. |
| 4 Affiliate program | FM-15…FM-18 | Affiliate signup + onboarding, trackers + campaigns, balance ledger, payout request + admin review. |
| 5 Amazon integration | FM-19…FM-22 | 22-marketplace geo-routing, Creators API client (optional booster), dead-link detection, reviews via API. |
| 6 Hardening | FM-23…FM-26 | i18n, legal, Sentry + monitoring, documentation + handoff. |

Each phase ends with a **phase gate**: the owner reviews before the next phase. One task at a time inside a phase (the registry rule).

## Relationship to existing work

- **Completed ROLL tasks stay as foundation:** ROLL-12 (data foundation: `source`/`visitor_hash` + helpers), ROLL-13 (product page v1), ROLL-14 (`/go/[id]` + click recording + affiliate config) are ✅ Done. The FM tasks extend them to full-marketplace scope — the ROLL work is the seed, FM is the full build.
- **MVP-pending ROLL items are absorbed/superseded:** ROLL-15 (admin auth) → FM-01; ROLL-16 (price optional) → folded into FM-10; ROLL-17 (Sentry) → FM-25; ROLL-18 (tests + handoff) → FM-26; ROLL-08 (analytics page) → FM-14; ROLL-09 (deployment) → handled per-phase.
- **Old `roll-arch` / `athletica-architecture` changes:** stand as history. Where they conflict with the blueprint, the blueprint wins (per the blueprint README's precedence rule).

## Creators API decision (locked into this change)

Per `product-management/04-creators-api-recommendation.md` (Option B, owner-approved):
- **Own data first.** Product data is owner-entered (admin catalog). The Creators API is an optional background booster for availability + reviews, switched on only when the owner has credentials + eligibility (10 qualifying sales / 30 days).
- **Soft-fail.** If the API is unavailable, ineligible, or errors, nothing breaks. The shop runs on owner data.
- **Dead-link detection does not depend on the API.** HEAD probe + redirect-time 4xx always run. API availability is a third signal only when enabled.
- **Limits:** 1 TPS / 8,640 per day (not 86,400). Cache offers ≤ 1 hour, other data ≤ 1 day. Retry with backoff on 429/5xx.

## Boundaries

- The Architect writes planning artifacts only (proposal, specs, design, tasks, registry). No code.
- Each task is a **plan/intent**, not instructions. The Builder figures out how.
- Each task ships with `task.md` (what to achieve + why + benchmarks) + `testing.md` (behavioral verification).
- One task at a time. Phase gates between phases.

## Stop point

Moment 1 ends here: the change (proposal + design + specs + tasks) + the registry are written. Moment 2 (the per-task task.md + testing.md pairs) follows in the same session per the owner's instruction. After both, the Architect stops and waits for the owner to pick the first task for the Builder.
