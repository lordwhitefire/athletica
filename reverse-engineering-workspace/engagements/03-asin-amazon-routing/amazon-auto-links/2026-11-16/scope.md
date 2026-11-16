# Scope — Engagement 03, Sample: Amazon Auto Links

**Date:** 2026-11-16
**Engagement:** 03 — ASIN → Amazon URL derivation + marketplace routing + dead-link detection
**Sample slug:** amazon-auto-links
**Mode:** A — open-source RE under licence, static only

## 1. The target

Amazon Auto Links (michaeluno/amazon-auto-links) — a WordPress plugin that generates
Amazon Associates affiliate links. 15+ years of development (v5.4.3, last commit
2024-10-02). 37 MB, 1,723 files. The most Amazon-edge-case-tested code we will study.

Local path: `reverse-engineering-workspace/samples/amazon-auto-links/`

## 2. The question

The previous engagements gave us the redirect spine (YOURLS + Dub) and the affiliate
commission model (Raider + Weferral). This engagement answers the Amazon-specific
questions:

1. **ASIN → Amazon URL derivation** — given an ASIN like `B0CHX1W1XY`, how is the
   canonical Amazon product URL constructed? What path format? What query params?
2. **Marketplace routing** — Amazon has 22 marketplaces (.com, .co.uk, .de, .co.jp,
   etc.). How are they modelled? How does the plugin pick one?
3. **Associate tag injection** — where does `?tag=associate-id-20` get appended?
   Is it URL param, path segment, or both? Are there multiple link styles?
4. **Geo-routing** — does the plugin route a visitor to their local marketplace
   based on IP? If so, how?
5. **Dead-link / out-of-stock detection** — does the plugin detect when an Amazon
   product is no longer available? PAAPI `availability` field? Scheduled HEAD probe?
   Re-fetch on click?

## 3. Ownership basis (mode A — GPL v2 or later)

| Field | Value |
|---|---|
| Repository owner | Michael Uno (miunosoft) |
| Licence | **GPL v2 or later** (plugin header `const LICENSE = 'GPL v2 or later'`; `readme.txt` confirms) |
| Permission basis for RE | GPL permits use, study, modification, distribution. We exercise *study*. |
| What we extract | Rules, URL patterns, marketplace host map, schema, edge-case handling. |
| GPL-2.0 copyleft scope | **Strong, viral.** If we copy Amazon Auto Links source into our build and distribute (or SaaS-deploy in some interpretations), our whole app must become GPL-2.0. We avoid this entirely by extracting rules and re-implementing in fresh TypeScript. |
| What we will NOT do | Copy PHP source into our build. Run WordPress. Activate the plugin. `composer install`. |

## 4. Mode

**A** — open source under a strong copyleft licence. Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on PHP source.
- **Dynamic analysis:** no. No WordPress, no plugin activation, no PAAPI calls.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- WordPress-specific integration (hooks, shortcodes, widgets).
- The plugin's UI / admin pages (separate engagement for storefront/admin UX).
- PAAPI5.0 client implementation details (we'll use Amazon's PA-API 5 SDK directly).
- Image / review / customer-review scraping logic (not relevant to our model).

## 7. Tools present

`rg`, `find`, `file`, `xxd`, `strings`, `python3`, `node`. Sufficient for PHP source.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if the sample is a non-official
fork; if copying code would be required (then stop — re-implement, don't copy, per
GPL-2.0).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
