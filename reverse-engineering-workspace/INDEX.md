# Engagement Registry

Live status of all reverse-engineering engagements. Updated as work proceeds.

## Status legend

- `pending` — not started
- `triage` — scope + sample being recorded
- `static` — static analysis in progress
- `reported` — `report.md` written and reviewed
- `blocked` — stopped at a gate; reason recorded in `scope.md`

## Engagements

| # | Capability | Sample | Date | Status | Report |
|---|---|---|---|---|---|
| 01 | Short-link redirect + click tracking + bot filter + rate limit | YOURLS | 2026-11-16 | reported | [report.md](engagements/01-redirect-click-tracking/yourls/2026-11-16/report.md) |
| 01 | Short-link redirect + click tracking + bot filter + rate limit | Dub | 2026-11-16 | reported | [report.md](engagements/01-redirect-click-tracking/dub/2026-11-16/report.md) |
| 02 | Affiliate tracking + commissions + payout workflow | Raider | 2026-11-16 | reported | [report.md](engagements/02-affiliate-commissions/raider/2026-11-16/report.md) |
| 02 | Affiliate tracking + commissions + payout workflow | Weferral | 2026-11-16 | reported | [report.md](engagements/02-affiliate-commissions/weferral/2026-11-16/report.md) |
| 03 | ASIN → Amazon URL derivation + marketplace routing + dead-link detection | Amazon Auto Links | 2026-11-16 | reported | [report.md](engagements/03-asin-amazon-routing/amazon-auto-links/2026-11-16/report.md) |
| 04 | Manual product catalog + admin CRUD + bulk import | Spree | 2026-11-16 | reported | [report.md](engagements/04-product-catalog-admin/spree/2026-11-16/report.md) |
| 05 | Multi-lock admin auth + RLS-at-DB | athletica/rollout (own) | 2026-11-16 | reported | [report.md](engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/report.md) |
| 05 | Multi-lock admin auth + RLS-at-DB | NextBase | 2026-11-16 | reported | [report.md](engagements/05-multi-lock-auth-rls/nextbase/2026-11-16/report.md) |
| 06 | Privacy-first click analytics + visitor hashing | Plausible | 2026-11-16 | reported | [report.md](engagements/06-privacy-analytics/plausible/2026-11-16/report.md) |
| 07 | Storefront UX — product grid, detail page, "Buy on Amazon" CTA | Vercel Commerce | 2026-11-16 | reported | [report.md](engagements/07-storefront-ux/vercel-commerce/2026-11-16/report.md) |
| 08 | Amazon Creators API client (auth, token cache, marketplace routing, enrichment, failure handling) | goark/pa-api | 2026-11-16 | reported | [report.md](engagements/08-amazon-creators-api/goark-pa-api/2026-11-16/report.md) |
| 08 | Amazon Creators API client (auth, token cache, marketplace routing, enrichment, failure handling) | amazon-flash-catalog | 2026-11-16 | reported | [report.md](engagements/08-amazon-creators-api/amazon-flash-catalog/2026-11-16/report.md) |
| 08 | Amazon Creators API client (auth, token cache, marketplace routing, enrichment, failure handling) | AzTracker | 2026-11-16 | blocked | [scope.md](engagements/08-amazon-creators-api/aztracker/2026-11-16/scope.md) — sample could not be located |

## Consolidated outputs (built after engagements complete)

| Output | Path | Status |
|---|---|---|
| Master rules + behaviour document | (TBD, in repo) | pending — all 7 engagements complete; ready to consolidate |
| Architecture + data model for the new single app | (TBD, in repo) | pending — all 7 engagements complete; ready to consolidate |

## Engagement summary

All 7 engagements complete. 10 samples studied across 7 capabilities:

| # | Capability | Samples | Licences |
|---|---|---|---|
| 01 | Redirect + click tracking + bot filter + rate limit | YOURLS, Dub | MIT, AGPLv3 |
| 02 | Affiliate tracking + commissions + payout | Raider, Weferral | MPL-2.0, MIT |
| 03 | ASIN → Amazon URL + marketplace routing + dead-link | Amazon Auto Links | GPL-2.0+ |
| 04 | Manual product catalog + admin CRUD + bulk import | Spree | BSD-3 |
| 05 | Multi-lock admin auth + RLS | athletica/rollout (own), NextBase | own, MIT |
| 06 | Privacy-first click analytics + visitor hashing | Plausible | AGPLv3 |
| 07 | Storefront UX | Vercel Commerce | MIT |
| 08 | Amazon Creators API client | goark/pa-api, amazon-flash-catalog (AzTracker not found) | Apache-2.0, MIT |

Engagement 08 was added after engagements 01–07 because Amazon's PA-API 5 (assumed by engagement 03 and
the blueprint) is deprecated. Amazon's own documentation cross-check is in
`engagements/08-amazon-creators-api/official-docs-crosscheck.md`.

Every report cites `file:line` evidence in its `evidence/excerpts.txt`. The next
step is to consolidate the rules into the master architecture + data model
document for the new single-app build — that lives in the repo, not here.
