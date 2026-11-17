# FM-23 — Testing (i18n)

**Task:** FM-23 | **Verify behavior, not UI.**

## What behavior to verify

1. Does `?locale=fr` show French UI?
2. Does IP infer the locale when no param?
3. Does a missing string fall back to English (no broken page)?
4. Are all 22 locales switchable?
5. Does the affiliate dashboard use the affiliate's preferred locale?

## How to verify (behavioral)

- **URL param:** open `/?locale=fr` → UI strings are French. Open `/?locale=de` → German.
- **IP inference:** with no `?locale`, simulate a German IP → UI is German. Simulate a Japanese IP → Japanese. Simulate an IP with no locale match → English.
- **Fallback:** pick a locale with an incomplete string catalog (e.g. a missing translation key) → the page renders fully, the missing key shows the English string (not empty, not a key name like `header.title`).
- **22 locales:** cycle through all 22 locale codes in the URL param → each switches the UI (or falls back to English for untranslated strings, but the switch is recognized).
- **Affiliate dashboard:** an affiliate with `preferred_locale=fr` → their dashboard renders in French (overridable by `?locale=...`).

## What "working" means

- Locale switching works via URL + IP + preference.
- Missing translations never break the page.
- All 22 locales are recognized.

## What to report

- The UI language for `?locale=fr` + `?locale=de`.
- The IP-inferred locale for a German + Japanese IP.
- The fallback behavior for a missing string (English shown).
- Whether all 22 locale codes were recognized.
- The affiliate dashboard locale with + without a URL override.
