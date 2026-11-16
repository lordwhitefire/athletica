# Report — Engagement 08, Sample: goark/pa-api

**Sample:** github.com/goark/pa-api, Go client for the Amazon Creators API, Apache-2.0
**Commit analysed:** `60cfe0145252ca17586e39f4d0d43d64a68d8057` (2026-05-12)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16
**Confidence words:** `confirmed` (read in the code) · `likely` · `not proven`. Evidence is in `evidence/excerpts.txt`.

## 0. Licence note

Apache-2.0 allows study and reuse with notice. We extract rules and re-implement; no code is copied.

## 1. What is it?

A small Go library. It was a PA-API 5 client and has been rewritten for the Creators API while
keeping the old package name. It builds requests, gets and caches OAuth tokens, and sends them.
Its tests use fake local servers only, so **nothing here was ever proven against Amazon itself**.

## 2. What it does

### 2.1 Authentication (confirmed)

1. OAuth 2.0 `client_credentials`. Credential ID + Secret replace the AWS keys. (`auth.go:24`)
2. Credential version picks the token endpoint: 3.1 / 3.2 / 3.3 use `api.amazon.com`, `.co.uk`, `.co.jp`
   at `/auth/o2/token`. The older 2.x versions use regional Cognito endpoints. (`server.go:27-35`)
3. For 3.x the secret is sent as an HTTP Basic header and scope is `creatorsapi::default`.
   For 2.x the id and secret go in the form body with scope `creatorsapi/default`. (`auth.go:103-120`)
4. Catalog calls send `Authorization: Bearer <token>`; 2.x adds `, Version <v>`. (`auth.go:182-194`)

### 2.2 Token cache (confirmed)

- Held in memory behind a mutex; reused until 30 seconds before expiry; if `expires_in` is missing
  it assumes 3600. (`auth.go:68-83`, `156-165`)
- The mutex is held during the network call, so concurrent callers wait for one refresh instead of
  each requesting a token. This matches Amazon's advice to avoid a token fetch per call (D7, D8).
- Limit: the cache is per process. Amazon's advice is to share one token across processes (D8).
  On serverless hosting this library design would refetch per cold instance. (`likely` relevant to Vercel)

### 2.3 Request shape (confirmed)

- One host for all marketplaces: `creatorsapi.amazon`. (`server.go:18`)
- Marketplace goes in the `x-marketplace` header. (`client.go:16, 101`)
- Operation is chosen by URL path, e.g. `/catalog/v1/getItems`. (`operation.go:31-36`)
- Body keys are lowerCamelCase, including `partnerTag`. (`query/request.go:112`) — matches D3.
- Credentials are region-scoped, not marketplace-scoped; 21 marketplaces map to three credential
  versions. (`marketplace.go:163-185`) Belgium is missing from the map though Amazon lists it (D4 table). (`confirmed` gap)

### 2.4 Resources relevant to Athletica (confirmed)

- Availability lives under **OffersV2**: `offersV2.listings.availability`. (`query/resources.go:51`)
- Reviews: `customerReviews.count` and `.starRating`. (`resources.go:69-72`)
- Variations: a separate `GetVariations` operation and `variationSummary.*` resources.
- V1 Offers is gone; the old call is silently redirected to OffersV2. (`query/query.go:100-113`)

### 2.5 Errors and limits

- Token-endpoint failures are turned into a typed error with status and a body clipped to 256 bytes,
  so secrets or huge responses do not land in logs. (`auth.go:133-140`, `confirmed`) — a good pattern.
- **No retry, backoff, throttling or 429 handling anywhere in the library.** (`evidence 5`, `confirmed`)
  Amazon documents 429 and 5xx as retry-with-backoff cases (D7), so callers must add this themselves.
- How a non-2xx reply to the API call itself is reported depends on the separate `goark/fetch`
  library. `not proven`.

## 3. What is sound and what is a mistake

| Verdict | Finding |
|---|---|
| Sound | Cached token with leeway, mutex, default lifetime, capped error bodies. |
| Sound | Single host + header-based marketplace; partner tag in the body. Matches Amazon's example (D3). |
| Sound | Credential version derived from marketplace, overridable. |
| Gap | No retry/backoff/429 handling. |
| Gap | Cache is per-process only. |
| Gap | Belgium missing from the marketplace map. |
| Unproven | Using HTTP Basic + form for v3 where Amazon's cURL example uses a JSON body (D2). Both may work; no live test exists. |
| Trap | Legacy options (`Merchant`, `OfferCount`, body `Marketplace`) are accepted by the builder but silently dropped. |

## 4. Limits of this report

- Nothing was run. Behaviour against Amazon is unverified.
- Amazon documentation was read through a page-summary tool (see `../../official-docs-crosscheck.md`).
- Retry guidance, rate numbers and eligibility come from Amazon docs, not from this library.
