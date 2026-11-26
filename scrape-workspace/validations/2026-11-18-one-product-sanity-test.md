# One-product test — Futbolmania → Sanity

Date: 2026-11-18
Product: Nike Mercurial Zoom Superfly 11 Elite AG-PRO (SKU IM2513-102)
Source: https://www.futbolmania.com/es/im2513-102

## Result

- **10 images downloaded** from Futbolmania and **10 uploaded to Sanity** (project cuiis46d,
  dataset production), all 1500×1500 JPEG.
- **Main image:** https://cdn.sanity.io/images/cuiis46d/production/fce5d3d5a9e6882683dad2e781e4a4f20728a670-1500x1500.jpg
  (verified HTTP 200, image/jpeg).
- **Gallery:** 9 more Sanity URLs.
- **Product JSON:** `scrape-workspace/deliverables/test-product-im2513-102.json`
  — name, brand, category, colour, description (subtitle, tagline, intro, collection,
  key benefits, technical details), colour variants, images (main + gallery + Sanity asset IDs).
- **Skipped as agreed:** price (set to 0), sizes (empty), stock.

## Issues found in the test — and fixed

1. **Colour variants included the current product and duplicate colours.** Fixed: current product
   removed, duplicates removed.
2. **Some variant colours were Spanish** ("Blanco Rosa", "Azul Verde", "Oro"). Fixed: complete
   colour map, all colours English.
3. **"Otras opciones" mixed sole types** (AG-PRO vs FG). Fixed: only exact same model/sole kept.
   Result: one true variant — Black, IM2513-001.
4. **Variant SKUs were lowercase.** Fixed: uppercase, plus `product_id` set to the storefront slug
   the app actually uses.
5. **Variant thumbnails were null.** Fixed: the Black variant thumbnail was downloaded and
   uploaded to Sanity (`image-5cf5ec2f...-450x450-jpg`, verified HTTP 200).
6. **Collection was empty** (parse bug). Fixed: `NIKE BRIGHT LIGHTS PACK`.
7. **Description was Spanish.** Fixed: subtitle, tagline, intro and key benefits translated to
   English; original Spanish kept in `_source`.
8. **Image fields were nested.** Fixed: `main_image`, `thumbnail`, `image_gallery` and
   `image_links` now sit at the top level, matching the app.

## Left empty for now (owner ruling 2026-11-18)

- **Price, sizes, stock, ASIN** — left empty in the product file; not fetched, not filled from
  another source. Owner enters them later if needed.

## Still open

- **Frontend Sanity token is invalid** (401). The rollout token works. Admin media uploads
  through the frontend will fail until the frontend token is refreshed.

## Verdict

The image and product pipeline works end-to-end: one product, 10 images in Sanity, one variant
thumbnail in Sanity, live URLs, clean English product JSON. The product file is ready to be used
as the template for the full pull; the four empty fields are deliberate and do not block the
import.