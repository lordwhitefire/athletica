# Area 35 — Product Catalog

## Status
✅ Decided

## Decisions Made
- **Products at launch**: ~28 product JSON files in `data/products/`
- **Categories**: Dynamic — defined in Sanity navigation tree (4 levels: Group → Category → Subcategory → Items)
- **Product variants**: Size (`sizes[]`) and color (`color_variants[]`)
- **Product images**: Main image + image gallery + thumbnail; hosted on Sanity
- **Product descriptions**: Structured — subtitle, tagline, intro, collection, key_benefits[], technical_details
- **Featured products**: Determined by homepage editor (product carousel sections with filters)
- **Related products**: By model, brand, traction (3 carousels on product detail page)
- **Schema**: Sanity product document with brand reference, price, sizes, color_variants, description
- **Frontend type**: `Product` interface in `src/types/product.ts`

*Source: data-flow.md lines 48-82, architecture.md lines 68-75, data-flow.md lines 85-104*

## Next Steps
- None — product catalog is fully functional

## References
- `data-flow.md` lines 48-82 — Product data schema
- `src/types/product.ts` — Frontend Product type
- `src/lib/getProducts.ts` — Product data fetching
- `data/products/` — Product JSON files (~28)
