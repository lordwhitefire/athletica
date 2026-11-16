# Engagement 08 — Amazon official documentation cross-check

**Date read:** 2026-11-16
**How:** `WebFetch` on Amazon's Creators API documentation pages. The tool returns a summary of the
page, not the page itself, so every row below is **secondhand** — treat as `likely` until the
owner reads the page. These rows are the yardstick used to judge the two samples.

| # | Claim | Page |
|---|---|---|
| D1 | PA-API 5 is deprecated; calls now return HTTP 403 `AccessDeniedException`. Existing AWS keys do not work with Creators API; new credentials are needed. | [paapiv5-deprecation](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation), [migration guide](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi) |
| D2 | Auth is OAuth 2.0 client credentials; bearer token lasts 1 hour. Token endpoint for credential version 3.1 / 3.2 / 3.3 is `api.amazon.com` / `api.amazon.co.uk` / `api.amazon.co.jp` `/auth/o2/token`. The cURL example sends `grant_type`, `client_id`, `client_secret` and `scope: "creatorsapi::default"` in a JSON body. | [using-curl](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl) |
| D3 | GetItems is `POST https://creatorsapi.amazon/catalog/v1/getItems`, headers `Authorization: Bearer …` and `x-marketplace`. **`partnerTag` goes in the JSON body**, not a header. Body also carries `itemIds`, `itemIdType`, `marketplace`, `resources`. | using-curl |
| D4 | "Credentials work globally across all marketplaces"; version only picks the token endpoint. | using-curl |
| D5 | Eligibility: enrolled in Associates for the marketplace **and 10 qualifying sales in the past 30 days**. `AssociateNotEligible` is a 403 `AccessDeniedException` reason. | [introduction](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [error codes](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/troubleshooting/error-codes-and-messages) |
| D6 | Limits start at **1 TPS and 8,640 requests/day** for the first 30 days, then grow with shipped-item revenue **from links created through Creators API** in the last 30 days: +1 request/day per 5 cents, +1 TPS per $4,320, max 10 TPS. No qualified referring sales for 30 days loses access. Over the limit returns 429. | [api-rates](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates) |
| D7 | Errors: 401 `UnauthorizedException` (TokenExpired, InvalidToken…), 400 `ValidationException` (InvalidPartnerTag, InvalidAssociate…), 403 `AccessDeniedException`, 404, 429 `ThrottleException` (may include `retryAfterSeconds`; use exponential backoff), 500 (retry with backoff). Token endpoint can also return 429 `too_many_requests` with `Retry-After`. | error-codes page |
| D8 | Best practice: up to 10 ASINs per GetItems; cache the token and share it across processes using the same Client ID; spread calls evenly; cache Offers and BrowseNodeInfo for at most 1 hour, other fields (ItemInfo, Images, DetailPageURL) at most 1 day; do not alter vended links (loses attribution). | [best-programming-practices](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices) |
| D9 | Offers (V1) is gone; OffersV2 replaces it. | migration guide |

Not found in the pages read: exact PA-API shutdown date (goark's README says 2026-05-15; Amazon's
page gives no date), and whether `x-partner-tag` exists as a header.
