# Translation request — Futbolmania → English

Generated: 2026-11-22
Products with Spanish text: **6907**
Unique strings: **23625**

## Files

- `translation-request.json` — full request: `meta`, `strings` (unique text + context), `products`
  (the product context for each affected product).
- `translation-request.csv` — one row per unique string, for easy reading.

## What to translate

Every `text` in `strings` (or the `text` column in the CSV). Translate to English.

Rules:

- Keep brand names, model names, SKUs, team/league names and other proper nouns unchanged.
- Keep the meaning, tone and product context.
- Do not translate the `id` values.

## Return format

Return a JSON file:

```json
{"translations": [
  {"id": "s-...", "translation": "..."}
]}
```

or a CSV with columns `id,translation`.

## How it is merged back

The `id` is a stable hash of the source text. The returned translations are matched by `id`
and written into the product files; the Spanish original stays in `source`.
