# Report — Engagement 08, Sample: amazon-flash-catalog

**Sample:** github.com/SteveSimonson/amazon-flash-catalog, TypeScript Cloudflare Worker, MIT
**Commit analysed:** `ab32076f120f0ce26917184ba582cb9a841f361b` (2026-10-14)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16
**Confidence words:** `confirmed` · `likely` · `not proven`. Evidence is in `evidence/excerpts.txt`.

## 0. Licence note

MIT. We extract rules and re-implement. Nothing is copied.

## 1. What is it?

A Worker that builds a themed product catalogue ("bamboo" products for one site). Products are
**found by scraping Amazon best-seller and search pages**, then optionally **enriched by the
Creators API**, filtered, de-duplicated and published as JSON to R2 storage on a schedule.
The Creators API is an add-on here, not the main data source.

## 2. What it does

### 2.1 The catalogue pipeline (confirmed)

1. Discover products per category (scraping). (`pipeline.ts:76`)
2. Enrich with Creators API; if it fails, carry on. (`pipeline.ts:82-87`)
3. Filter: junk titles, include/exclude keywords, rating, reviews, price band. (`filters.ts:35-101`)
4. De-duplicate by upper-cased ASIN across categories. (`pipeline.ts:130-135`)
5. Publish to a stable key; an hourly cron runs whichever sites are due. (`index.ts:553-563`, `wrangler.jsonc`)

**Rule worth keeping (confirmed):** if a refresh produces zero good products, keep the previous
published catalogue and record the error instead of wiping the shop. (`pipeline.ts:147-163`)

**Rule worth keeping (confirmed):** the API step never blocks publishing. Not being eligible for the
API (needs sales, D5) only means less data. (`README.md:166`, `creators.ts:96-99`)

### 2.2 Creators API client (confirmed what the code does)

- Token endpoint by credential version 3.1/3.2/3.3. (`creators.ts:9-13`)
- Batches of 10 ASINs. (`creators.ts:75`) — matches Amazon's advice (D8).
- Resources asked for: main image, title, OffersV2 price, sales rank. (`creators.ts:88-93`)

### 2.3 Mistakes and gaps, checked against Amazon's docs

| # | Finding | Evidence | Verdict |
|---|---|---|---|
| 1 | Token scope is `creatorsapi/default` (Cognito spelling) while Amazon's 3.x example uses `creatorsapi::default`. goark uses the `::` form for v3. | `creators.ts:38`, `auth.go:21-22`, D2 | `confirmed` mismatch with docs; effect `likely` token failures |
| 2 | Partner tag is sent as an `x-partner-tag` **header**. Amazon's example puts `partnerTag` in the **body**; goark does the same. | `creators.ts:84,86-94`, `request.go:112`, D3 | `confirmed` mismatch; effect `likely` request rejected or tag ignored |
| 3 | Token failure returns `null` silently, so enrichment can fail on every run with no visible error. Combined with #1 and #2 the Creators path may never have worked. | `creators.ts:46,51`, `pipeline.ts:82` | `likely`; **not proven** (nothing was run) |
| 4 | Any 401/403 stops the run; other errors skip the batch. No retry, no 429 handling, no pause between batches. Amazon says back off on 429/5xx and start at 1 request/second. | `creators.ts:96-99,131-133`, D6, D7 | `confirmed` gap |
| 5 | A real-looking associate tag `iu0e3-20` is hard-coded as the fallback. | `creators.ts:70`, `pipeline.ts:52`, `wrangler.jsonc` | `confirmed`; bad practice, would credit another person's tag if env is unset |
| 6 | Availability is never requested; only `listings[0].price` is read. A product Amazon no longer sells can stay in the catalogue. | `creators.ts:88-93,121` | `confirmed` gap |
| 7 | Ratings and review counts are merged but never requested from the API, so rating filters depend on scraped values. | `creators.ts:152-153`, evidence 6 | `confirmed` |
| 8 | Token cache is module-level (per Worker instance), not shared. | `creators.ts:15-16` | `confirmed`; D8 says share one token |
| 9 | Discovery relies on scraping Amazon pages; the code itself admits Amazon often blocks Worker scrapes. | `pipeline.ts:148` | `confirmed` comment; legality/terms **not assessed** |

## 3. What to take for Athletica

- The "last good catalogue wins" rule and "API is optional, never blocks" rule.
- ASIN-keyed de-duplication and per-site schedule presets.
- Batches of 10.

What not to take: the auth call, the partner-tag header, silent failure, the hard-coded tag.

## 4. Limits of this report

- Nothing was run; findings 1–3 are comparisons against documentation, not observed failures.
- Amazon docs were read through a page-summary tool (see `../../official-docs-crosscheck.md`).
- Scraping, storage and admin-login code were out of scope.
