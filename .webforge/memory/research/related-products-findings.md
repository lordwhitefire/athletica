# Related Products Research — Athletica

## Context
- Athletica: football boots e-commerce (Next.js 16, Sanity CMS, Supabase)
- Current catalog: ~29 products (scaling to 50-500)
- Currently has category-based related products: by model prefix, brand, and traction
- Products loaded from individual JSON files at build time (`data/products/*.json`)

## Existing Implementation
The project already has a working category-based related products system:
- `getProductsByModelPrefix()` — same model line (hierarchical model field)
- `getProductsByBrand()` — same brand
- `getProductsByTraction()` — same surface type
- All filtered through `getCachedProducts()` which reads JSON files
- 3 product carousels on `ProductPage.tsx` (lines 71-100)

## Approach Analysis

### 1. Manual Relationship Tables (Junction Table)
**Source:** Multiple SO, DBA.StackExchange, and e-commerce schema references
- Standard junction table: `product_relations(product_id, related_product_id, type, created_at)`
- For 50-500 products: ~n*3-5 = 150-2,500 rows — trivially small
- Directional vs bidirectional: Directional is more flexible (A→B independent of B→A)
- Type column: `related`, `upsell`, `cross_sell` as an enum

**Pros:** Referential integrity, queryable, standard pattern
**Cons:** Requires schema changes, manual maintenance, another table

### 2. Category-Based "Same Category" (Already Implemented)
**Source:** WooCommerce core logic (wc_get_related_products), Shopify collection approach
- WooCommerce related products are AUTOMATICALLY generated based on shared categories and tags (WooCommerce docs)
- Shopify "fastest approach" uses `product.collections.first.products` (learnshopify.dev)
- GROQ pattern for same-category: `*[_type == "product" && category == $category && _id != $currentId]`
- Sorting: random (WooCommerce default), newest, price, manual position

**Pros:** Zero maintenance, works from day one, trivially fast at 50-500 products
**Cons:** Less curated, may show irrelevant products

### 3. Tag-Based Approach
**Source:** Sanity docs, WooCommerce tag system
- GROQ pattern: `count(tags[@._ref in ^.^.tags[]._ref]) > 0` (Sanity docs)
- Can weight by match count: `| order(matchCount desc)`
- WooCommerce uses tags as secondary signal for related products

**Pros:** Flexible, automated matching
**Cons:** Requires tagging all products, over-tagging leads to noise

### 4. JSON/CSV Manual Approach
**Source:** Microsoft SQL Server team blog, PostgreSQL JSON docs, SO discussion
- Store `relatedProductIds` as JSON array on product document
- **At 50-500 rows**: JSON approach works fine for small catalogs
- PostgreSQL/MySQL JSON with GIN index: ~5ms for lookups
- Junction table with JOINs: ~50ms (10x slower) — but more features
- **Breakdown point**: JSON approach degrades when you need to query relationships from "both sides" or update individual relations frequently

**Sanity-specific JSON approach:** Add an array of references to the product schema:
```typescript
defineField({
  name: 'relatedProducts',
  title: 'Related Products',
  type: 'array',
  of: [{ type: 'reference', to: [{ type: 'product' }], weak: true }],
})
```

### 5. Hybrid Approach (Recommended)
**Source:** GrowthSuite AI vs Manual comparison, Sanity docs, WooCommerce docs

The **recommended approach** for 50-500 products:

1. **Keep existing category-based system** (model prefix + brand + traction) — works from day one, zero maintenance
2. **Add manual overrides** for key products (top 20%) via a simple Sanity reference array on the product document
3. **Fallback logic**: If manual overrides exist → show those; else → fall back to category-based

**Sanity implementation:**
- Add `relatedProducts` array of references (weak refs) to product schema
- In Sanity Studio, editor picks related products visually
- GROQ query: `*[_type == "product" && _id in $relatedIds]` for manual, fallback to category query

**Why this works for Athletica:**
- 50-500 products is small enough that editors can manually curate key relationships
- Category-based fallback is already built and working
- No junction table needed — Sanity references handle the many-to-many
- Build-time resolution from JSON files makes this trivially fast
- Scales without schema changes to Supabase

### Key Source Citations
- WooCommerce related products: "automatically generated based on shared tags or categories" (woocommerce.com)
- Shopify same-collection approach: "fastest approach shows other products from the same collection" (learnshopify.dev)
- Sanity GROQ references: bidirectional indexing, `references()` function (sanity.io/docs)
- Hybrid 80/20 rule: "let AI handle the long tail, manually curate top 20%" (growthsuite.net)
- Junction table vs JSON: "JSON with GIN index: 5ms, Junction with JOINs: 50ms" (SQL-Practice)
