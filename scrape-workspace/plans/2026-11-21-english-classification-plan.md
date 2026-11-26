# Plan — English, proper classification, import-ready products

Date: 2026-11-21
Scope: every extracted Futbolmania product — **10,977 ok, 0 errors**, **9,786 raw files**
(the file count is lower because some SKUs collide and overwrite).
No Sanity image uploads (owner ruling). Price, sizes, stock and ASIN stay empty.

## 1. English

- Every store-facing field is English: `name`, `description.subtitle`, `tagline`, `intro`,
  `collection`, `key_benefits`, `color`, `category`, `brand`, `model`.
- Spanish stays only in `source` (traceability).
- Clean Spanish type words from names (`Botas de fútbol …`, `Zapatillas …`, `Camiseta …`).
- Audit every raw file for Spanish; retranslate anything still Spanish; record the count.
- `source` keeps the Futbolmania URL, the original Spanish text and the menu path.

## 2. Classification — not Futbolmania's menu

Futbolmania's menu is **source metadata only**. It does not decide the store category or the
navigation. Each product is classified from its own data.

Store categories:

- Boots
- Multi-Stud Boots
- Indoor Shoes
- Jerseys
- Kits
- Socks
- Shin Guards
- Balls
- Goalkeeper Gloves
- Apparel
- Clothing
- Accessories

Rules:

- Read the product name and its own attributes (type, surface, brand, model).
- `Futbolmania root` is kept as `source.menu` only.
- Build the model tree from the product name: **brand → root model → submodel → product model**.
- Traction from the sole type; gender from the audience (Kids / Unisex); colour in English.
- Confidence: high / medium / low. Low-confidence products go to `review.md`.

## 3. Prepare

Outputs:

- `deliverables/classification/categories.json`
- `deliverables/classification/models.json`
- `deliverables/products/<sku>.json` — clean, English, source images; Sanity URLs preserved for
  the 606 already uploaded
- `deliverables/classification/summary.md` — counts per category, brand, audience, gender
- `deliverables/classification/review.md` — low-confidence and Spanish flags

Validation:

- Sample 10 products across categories; check the fields and image links.
- No Spanish in store-facing fields.
- Every product has a category, brand, model, images; price/sizes/stock/ASIN empty.
- Record the validation in `scrape-workspace/validations/`.

## 4. Order

1. Build the classifier (name/attribute rules, brand/model parsing).
2. Run it on all 9,786 raw files; write clean products, categories, models.
3. Audit English; retranslate any remaining Spanish.
4. Validate and report.