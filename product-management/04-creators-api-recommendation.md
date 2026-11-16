# 04 — Creators API: CIRCLES recommendation

**Date:** 2026-11-16
**Agent:** Product Management (recommends; the owner decides)
**Plan:** `PLAN-creators-api.md` (approved with "start")
**Inputs:** RE engagement 08 (`reverse-engineering-workspace/engagements/08-amazon-creators-api/`), reports for goark/pa-api and amazon-flash-catalog, plus `official-docs-crosscheck.md` (rows D1–D9).
**Supersedes:** every PAAPI statement in `01`, `02`, `03` and in `blueprint/` — see section 8.

---

## C — Comprehend

**Goal:** Product pages must show only what a visitor can really buy, and keep working, whatever Amazon's API does.
**Metric it implies:** share of live products whose "buyable or greyed" state is current.
**What changed:** the blueprint assumed Amazon's PA-API 5 (AWS keys, 1 TPS, 86,400 requests/day) for product data, availability, reviews and refresh jobs. Amazon says PA-API 5 is deprecated and now answers 403 (D1); its old keys do not work with the new Creators API (D1).

**Constraints** (all from Amazon's docs via a page-summary tool, so `likely` until the owner reads them):
- Access needs an Associates account plus **10 qualifying sales in the last 30 days** (D5).
- Starting limits are **1 request/second and 8,640/day**, and grow only with revenue from links created *through the API* (D6). The old blueprint number was 86,400/day — ten times too high.
- No qualifying sales for 30 days **loses access** (D6).
- Cache offers at most 1 hour and other data at most 1 day; do not edit links the API returns (D8).
- Retries: back off on 429 and 5xx (D7).

**Assumptions I had to make (not answers):**
1. A1 — Athletica launches **before** reaching 10 sales in 30 days. (Unknown; the owner can say.)
2. A2 — The owner has, or will create, an Associates account whose tag works for the target marketplace.
3. A3 — Reviews and ratings are retrievable through the API's `customerReviews` resource. goark lists it (`resources.go:69-72`); nobody ran it. `not proven`.

## I — Identify

**Cohort chosen:** the **owner as operator** — one person running a phone-first affiliate store from Nigeria, who cannot babysit an API and loses money if pages show dead products.
**Why:** the API decision is operational. The owner is the one who gets eligible, holds the credentials, and sees the damage when it fails.
**Other side of the market:** visitors arriving from DMs on slow phones. They are the reason the page must never be blank or wrong, but they do not choose the data source. Affiliates are affected only through click and conversion trust.

## R — Report the need

**Stated want (from the earlier plan):** "swap PAAPI for the Creators API."
**Underlying need:** *"Keep every product page honest and working, even on days the Amazon API is unavailable to me."*
**User story:** As the owner, I want product pages to depend on my own data first and Amazon's API only as a bonus, so that a lost eligibility or a bad API day never breaks the shop.
**Evidence:** needs 1 (honest pages) and 2 (survive API loss) are **reported** (D5, D6 loss-of-access rule; flash-catalog's soft-fail rule, `README.md:166`, `pipeline.ts:147-163`). Need 3 (richer data from the API) is **inferred**.

## C — Cut

| Need | Value to the goal | Cost / risk | Result |
|---|---|---|---|
| 1. Honest, current buyable state | High | Low (HEAD probe + redirect signals already in blueprint) | **Chosen** |
| 2. Survive API loss | High | Low | Chosen together with 1 (same design) |
| 3. Rating + review counts from the API | Medium | Needs eligibility; `customerReviews` unproven | **Cut for now** |
| 4. High request throughput | Low at launch | 1 TPS is enough for a small catalogue | Cut |
| 5. Live price display | Already decided: price is never shown | — | Out |

Framework: none; plain ranking. Cut items are not dropped, only moved behind eligibility.

## L — List solutions

| Option | What it is | Horizon |
|---|---|---|
| **A. Swap in place** | Rename PAAPI to Creators API everywhere. Product data, availability, reviews and refresh all come from the API. | Quick edit |
| **B. Own data first, API optional** | Product data is entered by the owner (admin catalogue, already in blueprint). The Creators API is a background booster for availability and reviews, switched on only when credentials and eligibility exist, and failures change nothing. Dead-link checks run without the API. | Core bet |
| **C. Third-party data service** | Use a paid scraping API (the repo already has `inv01.mjs` using Rainforest) for product data now, instead of Amazon's API. | Longer horizon |

Discarded: scraping Amazon pages directly (flash-catalog's discovery route) — its own code says Amazon blocks it (`pipeline.ts:148`) and I have not assessed Amazon's terms.

## E — Evaluate

Axes chosen in advance: (1) works at launch, (2) survives API loss, (3) cost and effort, (4) risk to the Associates account.

| | A. Swap in place | B. Own data first | C. Third-party service |
|---|---|---|---|
| Works at launch | **No** — blocked until 10 sales/30 days (A1) | **Yes** | Yes |
| Survives API loss | **No** — the 30-day loss rule hits the whole design | **Yes** | Partly — depends on the vendor |
| Cost / effort | Lowest edit | Low; most pieces already designed | Ongoing fees, unknown price; `not proven` |
| Account risk | Low | Low | Unknown; terms **not assessed** |

**Risk of B:** the owner types product data by hand, so data can go stale (titles, images, "in stock"). The dead-link probe covers "still on sale"; nothing covers a changed title or image until the API is on.
**Trade-off named:** choosing B gives up automatic freshness and API-sourced ratings/reviews until the owner qualifies, and spends owner time on data entry.
**Also found by RE-08 (needs fixing in the plan whichever option wins):**
- If Athletica builds its own links from ASIN + tag (decision D8), the API sees no revenue from "links created through the API", so limits may never rise above 1 TPS (D6). D8 is left as decided; see open question Q2.
- Send the partner tag in the request **body**, use scope `creatorsapi::default`, retry with backoff — three things amazon-flash-catalog gets wrong or omits (RE-08 flash-catalog §2.3).

## S — Summarize

**Recommendation: Option B — own data first, Creators API as an optional booster.**
**Success metric:** 30 days after launch, **100% of live products have a dead-link status checked within the last 24 hours**, measured with the Creators API switched off — compared with 0% under the old plan, which cannot run before eligibility.
**Given up:** automatic data refresh and Amazon ratings/reviews until the owner qualifies; extra data-entry work.
**Link to goal:** it keeps every page honest (goal from C) without depending on an API the owner may not qualify for or may lose.

**Open questions and honest answers**
- Q1. *Is the 10-sales/30-days rule current?* The docs pages say so (D5, D7), read through a summary tool. The owner should confirm in Associates Central before relying on it.
- Q2. *Should D8 (never store the Amazon URL) change once the API is on?* Amazon says do not alter links it returns, and ties limits to revenue from those links (D6, D8). Unknown whether a self-built `/dp/{ASIN}?tag=` link counts. **Owner decision; left unchanged.**
- Q3. *Do reviews really come back from `customerReviews`?* Not proven; blueprint now hides the reviews block when there is no data (already its rule).
- Q4. *AzTracker.* Could not be found; a third sample is not required for this recommendation, but the owner may supply a URL.
- Objection: "Why not just wait until eligible, then do A?" Because the shop would show stale or empty data in the meantime and any 30-day sales gap would repeat the problem.

## 8. What this supersedes (old wording → new)

| Old (in `01`/`02`/`03`/blueprint) | New |
|---|---|
| "PAAPI" / "PA-API 5" / AWS access + secret keys | Amazon **Creators API**; OAuth credential ID + secret, credential version 3.1/3.2/3.3 |
| "PAAPI 1 TPS / 86400/day" | Starts at **1 TPS / 8,640 per day**; grows with API-link revenue (D6) |
| Product data, availability, reviews "via PAAPI" | Owner-entered data first; API enrichment **optional and soft-fail** |
| Dead-link: 3 signals incl. PAAPI availability | 2 signals always on (HEAD probe, redirect-time 4xx) + API availability when eligible |
| PAAPI refresh "TTL-based" | Creators API refresh only when enabled; offers ≤ 1 hour, other fields ≤ 1 day |
