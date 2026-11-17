# FM-23 — i18n (22 marketplace locales)

**Phase:** 6 | **Spec:** hardening | **Depends on:** FM-06 | **Status:** ⬜ Pending

## What we're building

Internationalization for the storefront + affiliate dashboard across the 22 Amazon marketplace locales. UI strings localized (JSON catalog per locale). Locale resolved from URL param (`?locale=fr`) → visitor IP → affiliate preference → default English. Falls back to English if a string is missing.

## Why it matters

The marketplace serves 22 Amazon locales. A French visitor should see French UI; a Japanese visitor, Japanese. The URL-param switch makes locale shareable. The English fallback means a missing translation never breaks the page.

## What success looks like (benchmarks)

- After this, a visitor with `?locale=fr` sees French UI strings on the storefront.
- After this, a visitor with no `?locale` gets their locale inferred from IP (e.g. a German IP → German), or English if no match.
- After this, an affiliate's dashboard uses their preferred locale (set in profile), overridable by URL param.
- After this, a missing string for a locale falls back to English (the page renders fully, no broken/empty strings).
- After this, the 22 supported locales are enumerated; switching between them is instant (no reload beyond the locale change).
- After this, the locale switch is available in the storefront footer + the affiliate dashboard settings.

## Context the Builder needs

- The 22 marketplaces (RE-03 §2.1) map to 22 locales.
- `next-intl` (or equivalent) for the i18n machinery.
- String catalog: JSON per locale, English base (`en.json`), others (`fr.json`, `de.json`, etc.).
- Locale resolution priority: URL param → IP → affiliate preference → English.

## Boundaries

- Do not break the page on a missing string (English fallback).
- Do not force a locale (URL param overrides; the visitor can switch).
- Do not auto-translate (English base; other locales need human translation — flagged).
- Do not couple locale to the Amazon marketplace (they're related but independent — a visitor can view `?locale=fr` on the US marketplace).
