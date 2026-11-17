# FM-19 — 22-marketplace geo-routing

**Phase:** 5 | **Spec:** amazon-integration | **Depends on:** FM-04 | **Status:** ⬜ Pending

## What we're building

Geo-routing at click time: resolve the visitor's IP → country (6-header priority chain, Cloudflare-trusted first, port stripped) → marketplace → build the Amazon URL with that marketplace's domain + tag. Fallback to the product's default marketplace if geo fails or no tag for the visitor's marketplace.

## Why it matters

An Associates tag is registered to one marketplace — a `amazon.com` tag earns only on `amazon.com`. A UK visitor sent to `amazon.com` with a US tag earns nothing. Geo-routing sends each visitor to their local marketplace with the right tag. Without it, the marketplace earns a fraction of what it should.

## What success looks like (benchmarks)

- After this, a visitor from the UK (resolved via the 6-header chain) is redirected to `https://www.amazon.co.uk/dp/{ASIN}?tag={UK_TAG}`.
- After this, a visitor from the US is redirected to `https://www.amazon.com/dp/{ASIN}?tag={US_TAG}`.
- After this, a visitor from a country with no configured tag falls back to the product's default marketplace (graceful, not an error).
- After this, a spoofed `x-forwarded-for` does NOT override `cf-connecting-ip` when behind Cloudflare.
- After this, the IP is resolved via the 6-header chain (`x-plausible-ip`→`cf-connecting-ip`→`x-forwarded-for`→`b-forwarded-for`→`forwarded`→`conn.remote_ip`), and the port is stripped from IPv4/IPv6.
- After this, the marketplace resolution uses MaxMind GeoIP2 (offline, no third-party dependency) — or Cloudflare `/cdn-cgi/trace` if behind Cloudflare.
- After this, the `marketplaces` table (22 rows, FM-02) is the source of truth for domain + tag + country_code.

## Context the Builder needs

- The 22-marketplace map (RE-03 §2.1): `AE AU BE BR CA CN DE EG ES FR IN IT JP MX NL PL SA SE SG TR UK US`, each with `slug, locale_number, domain, associates_url, country_code` (UK→GB).
- The 6-header IP chain (RE-06 §2.5).
- MaxMind GeoIP2 (offline database) preferred; Cloudflare `/cdn-cgi/trace` if behind CF.
- The per-marketplace tag is config (env or a `marketplaces.tag` column, owner-supplied).
- The fallback: if no tag for the resolved marketplace, use the product's `default_marketplace`.

## Boundaries

- Do not hardcode `amazon.com` or a single tag (RE-03 + the old `athletica-20` placeholder is gone).
- Do not let a spoofed `x-forwarded-for` override Cloudflare's header when behind CF.
- Do not error on a missing marketplace tag — fall back gracefully.
- Do not store the derived Amazon URL (derived at click time only).
- Do not make geo-routing a hard dependency that breaks the redirect if MaxMind is unavailable (fall back to default marketplace).
