# Simple plan: rewrite every product, one by one

## What we have now

- 9,786 products are in English after the local translation.
- Some of that text is machine-written. It is understandable, but sometimes awkward or wrong.
- Price, sizes, stock and ASIN stay empty for every product. They are never filled in this step.
- The Spanish original stays in the `source` field.
- 606 products already have Sanity images. We do not touch those images.

## What we want

Every product should read like a normal shop wrote it, without changing its structure:

- Keep every field the product already has: name, subtitle, tagline, intro, collection, key benefits, colour and source.
- Use simple language in every field. Do not merge, split, remove or add fields.
- Keep the same number of key benefits as the source.
- Leave category and model empty for now. We will do them later.
- Keep the colour as the source has it.
- No Spanish prose.
- No invented facts.

## Hard rules for this step

1. I write every product myself, in my own words. No functions, scripts or tools may generate the product text.
2. This step is not automated. No batch rewriting.
3. Research may be done in batches, but each product is written one by one.

## Structure rule

- The product data structure stays exactly as Futbolmania provides it: same fields, same sections, same order.
- Simplify the language only. Do not merge, split, remove or add fields.
- Keep the exact number of key benefits. If the source has four, the rewrite has four. If it has six, the rewrite has six. Never decide a number.
- Translate the slug to English. Keep it lowercase, hyphenated, no accents and URL-safe.
- Category and model stay empty for now. We will fill them later.

## The rule for every product

Do one product at a time. Never batch them.

For each product:

1. Open the product file.
2. Open its Futbolmania source link.
3. Read the page and note only the facts:
   - brand and model
   - product type (boots, jersey, socks, ball, gloves, shin guards, etc.)
   - surface or use (FG, AG, TF, indoor, training, match)
   - colour
   - material and main features
   - who it is for (adult, kids, women, men)
4. Simplify the name in English and translate the slug to English: lowercase, hyphenated, no accents.
5. Simplify the subtitle, tagline and intro in place. Keep each field separate.
6. Simplify each key benefit in place. Keep the same number as the source.
7. Keep category and model empty for now. Keep the colour as the source has it.
8. Check the product (see the checklist below).
9. Save the file.
10. Mark it done and move to the next product.

## Where to research

- First choice: the product's own Futbolmania page.
- If the page is thin: the brand's own site (Nike, adidas, Puma, New Balance, Umbro, etc.).
- If still missing: another retailer that sells the same product.
- Never copy another shop's description. Use the facts only.
- If a fact cannot be found, leave it out. Write less, not invented.

## How to write it

- Use short sentences and common words.
- Keep the same meaning as the source.
- Simplify the language; do not change the structure.
- Turn features into benefits only where the source already does.
- No marketing fluff. No "best ever", no "revolutionary".
- No Spanish words. Proper names are fine (Atlético, MBAPPÉ, Barça).
- Keep it easy to scan.

## Checklist for each product

- [ ] No Spanish prose.
- [ ] No machine errors (for example "Doorman" for goalkeeper, "price" for pride, "cheese" for enjoy).
- [ ] Name is clear and simple.
- [ ] Slug is English, lowercase and hyphenated.
- [ ] Subtitle, tagline and intro are separate and simplified.
- [ ] Same number of key benefits as the source.
- [ ] Category and model left empty for now.
- [ ] Colour kept as the source has it.
- [ ] Price, sizes, stock and ASIN are empty.
- [ ] `source` still holds the Spanish original.
- [ ] File saved.

## Order of work

Work by category, one product at a time:

1. Boots
2. Jerseys
3. Apparel
4. Accessories
5. Socks
6. Balls
7. Goalkeeper Gloves
8. Kits
9. Clothing
10. Shin Guards
11. Indoor Shoes

Start with 10 products from different categories. Agree on the style. Then continue through all 9,786.

## Progress tracker

Every product starts as not done. Update this table after each product.

| Category | Total | Done | Left |
|---|---:|---:|---:|
| Boots | 2,903 | 28 | 2,875 |
| Jerseys | 2,341 | 0 | 2,341 |
| Apparel | 1,634 | 0 | 1,634 |
| Accessories | 1,389 | 0 | 1,389 |
| Socks | 375 | 0 | 375 |
| Balls | 323 | 0 | 323 |
| Goalkeeper Gloves | 322 | 0 | 322 |
| Kits | 145 | 0 | 145 |
| Clothing | 132 | 0 | 132 |
| Shin Guards | 114 | 0 | 114 |
| Indoor Shoes | 108 | 0 | 108 |
| **Total** | **9,786** | **28** | **9,758** |

Done-list: `scrape-workspace/plans/product-rewrite-done.txt` — one product file per line.

## Progress and stopping

- A product is done only when its file is saved and marked done.
- Add the file name to the done-list and add 1 to the tracker.
- If the PC shuts down, we restart from the done-list.
- Report counts: how many done, how many left.

## What this plan does not do

- No code in this step.
- No Supabase import.
- No Sanity image uploads.
- No price, sizes, stock or ASIN.
- No category or model changes yet.
- No touching the 606 existing Sanity image deliverables.

## Why this will take time

9,786 products, one by one, with research, is a large job. The plan is made to be resumable. We prove the style on 10 products first, then keep going until every product is done.
