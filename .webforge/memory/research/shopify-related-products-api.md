# Shopify Related Products API — Research Report (Part 2/2)

**Date:** 2026-07-18  
**Researcher:** Odin-Sage (Intelligence Team)  
**Context:** Athletica — football boots e-commerce (Next.js 16, Sanity CMS, Supabase)  

---

## Area B: Shopify Related Products API

### 5. Product Recommendations API

#### 5.1 API Surface

**Storefront GraphQL API:**
```graphql
query {
  productRecommendations(
    productId: "gid://shopify/Product/1",
    intent: RELATED      # or COMPLEMENTARY
  ) {
    id
    title
    handle
    priceRange { minVariantPrice { amount currencyCode } }
    featuredImage { url altText }
  }
}
```

**REST Ajax API:**
```
GET /{locale}/recommendations/products.json?product_id={id}&intent={intent}&limit=10
```

**Returns:** Up to 10 `Product` objects.

**Source:** https://shopify.dev/docs/api/storefront/latest/queries/productRecommendations  
**Source:** https://shopify.dev/docs/api/ajax/reference/product-recommendations  
**Source:** https://shopify.dev/docs/api/storefront/latest/enums/ProductRecommendationIntent

#### 5.2 Algorithm vs Manual

**RELATED products (intent: `RELATED`):**
- **AI/ML algorithm** — Shopify auto-generates based on:
  1. **Purchase history:** Products historically bought together (highest priority)
  2. **Product description:** Products with similar descriptions
  3. **Related collections:** Products from same collections (excluding `all` and `frontpage`)
- Criteria used in priority order. If purchase history is available, it's used first.
- **NOT manually configurable at the API level** — you cannot manually define "related products" pairs via the API
- **BUT:** The Shopify Search & Discovery app allows merchants to manually curate related products in the admin UI. These overrides affect API responses.

**COMPLEMENTARY products (intent: `COMPLEMENTARY`):**
- **NOT auto-generated** — requires manual configuration via the Shopify Search & Discovery app
- Merchants manually select which products are complementary ("pair it with")
- Displayed in a "Pair it with" section, typically near the add-to-cart area
- Products must be in stock (inventory > 0) to show as complementary

**Source:** https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations  
**Source:** https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-recommendations

#### 5.3 Can Merchants Manually Define Related Products?

**Yes, via the Shopify Search & Discovery app:**
- Merchant can select up to **10 manual related products** per product
- Settings: `only manual` (show only selected), or `ahead` (show selected products before auto-generated)
- Auto-generated recommendations still run when manual picks are sold out/unpublished

**Relevance for Athletica:** Two options to implement manual "Frequently Bought Together":
1. **Use Shopify's Search & Discovery app** (merchant configures in admin UI, affects API responses)
2. **Build a custom solution** using Sanity CMS and Supabase to store manual pairings, then query them server-side

**Source:** https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-recommendations

#### 5.4 Dawn Theme Implementation (Reference)

The default Dawn theme uses:
- **IntersectionObserver** — recommendations load lazily when section scrolls into view
- **JSON fetch** from `/recommendations/products?section_id=...&product_id=...&limit=4&intent=related`
- **Replace HTML** in `.product-recommendations` container
- Separate sections for "You may also like" (related) and "Pair it with" (complementary)

**Source:** https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations/related-products  
**Source:** https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations/complementary-products

#### 5.5 "Frequently Bought Together"

Shopify does NOT have a native "Frequently Bought Together" feature at the API level. Closest native options:
1. **Complementary Products** (manual pairing via Search & Discovery app)
2. **Related Products** (algorithmic, based on purchase history)
3. **Custom development** — query order data via REST Admin API (`GET /admin/api/2026-07/orders.json`), analyze line items to find co-purchased products, store relationships in Supabase

#### 5.6 Related vs Complementary — Full Comparison

| Aspect | Related Products | Complementary Products |
|---|---|---|
| **Intent** | `RELATED` | `COMPLEMENTARY` |
| **Generation** | Auto-generated (algorithmic) | Manually configured |
| **Logic** | Purchase history → Description → Collections | Merchant-defined pairs |
| **Default heading** | "You may also like" | "Pair it with" |
| **Placement** | Below product details, after description | Near add-to-cart, in product information area |
| **Max count** | 10 | 10 |
| **Out-of-stock items** | Allowed (if "continue selling") | NOT allowed (must have inventory > 0) |
| **Configuration** | Via Search & Discovery app (optional manual overrides) | Via Search & Discovery app (required) |
| **Auto-fallback** | Yes — manual picks + auto suggestions | No — only manually selected products |

**Source:** https://shopify.dev/changelog/display-both-related-and-complementary-product-recommendations-on-storefronts  
**Source:** https://shopify.dev/docs/api/storefront/2026-07/enums/ProductRecommendationIntent

---

## Key Architecture Implications for Athletica

### Data Model Mapping (Shopify → Athletica Stack)

| Shopify Concept | Athletica Implementation | Notes |
|---|---|---|
| Collection (manual) | Sanity "Collection" document type + Supabase junction table for product membership | 2026-07 sources model supports unions of conditions + manual picks |
| Collection (automated) | Implement custom rule evaluation in Sanity/Supabase — Shopify's dynamic re-evaluation won't carry over | Pre-compute membership on product updates |
| Product Category (taxonomy) | Supabase `products.category` field → use Shopify's open taxonomy | One per product; useful for Google Shopping feeds |
| Product Type | Sanity string field | One per product; useful for category filtering |
| Navigation Menu | Custom Sanity navigation schema → rendered in Next.js | Not coupled to collections; can link to any route |
| Related Products | Custom Supabase table if manually curated; or call Shopify Storefront API at runtime if using algorithmic recommendations | For headless, algorithm runs on Shopify's side |
| Complementary Products | Supabase `product_relationships` table with `type: 'complementary'` | Manual curation by Athletica admin |

### Recommended Approach for Athletica

Since Athletica uses **Next.js (headless) + Sanity CMS + Supabase**:

1. **Collections:** Store collection structure in Sanity (hybrid) or Supabase. Do NOT rely on Shopify's dynamic evaluation since you're not using Liquid themes.

2. **Product-Category relationship:** Use a junction table in Supabase (`product_collections`).

3. **Category taxonomy:** Store as a single field on the product in Supabase. Consider using Shopify's open taxonomy for Google Shopping compliance.

4. **Related products:** Either call Shopify's Storefront API at request time (if you want algorithmic recommendations) OR build a custom `product_relationships` table in Supabase for manual curation.

5. **Navigation:** Build a dedicated navigation schema in Sanity — keep it separate from collections for maximum flexibility. Navigation items can link to collection pages, custom pages, or category filter pages.

6. **Multi-collection products:** Fully supported. Each product can appear in unlimited collections with no canonical URL issues.

7. **"Frequently Bought Together":** Requires custom development — analyze order data stored in Supabase to compute co-purchase frequency.

---

## Source Index

| # | Source | URL |
|---|---|---|
| 1 | Collection object (Admin API) | https://shopify.dev/docs/api/admin-graphql/latest/objects/Collection |
| 2 | New Collections Model (2026-07) | https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/use-new-collections-model |
| 3 | Migrate to new collections model | https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/migrate-to-flexible-collections |
| 4 | New Collection changelog | https://shopify.dev/changelog/new-collection-model-and-apis-now-available |
| 5 | Collection help doc (types) | https://help.shopify.com/en/manual/products/collections/collection-types |
| 6 | CollectionSourceInclusion | https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionSourceInclusion |
| 7 | CollectionConditionsSource | https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionConditionsSource |
| 8 | CollectionSubCollectionsSource | https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionSubCollectionsSource |
| 9 | Product Taxonomy help | https://help.shopify.com/en/manual/products/details/product-category |
| 10 | Product Types help | https://help.shopify.com/en/manual/products/details/product-type |
| 11 | Product Taxonomy (GitHub) | https://github.com/Shopify/product-taxonomy |
| 12 | Menu (Storefront API) | https://shopify.dev/docs/api/storefront/latest/objects/Menu |
| 13 | MenuItem (Storefront API) | https://shopify.dev/docs/api/storefront/latest/objects/MenuItem |
| 14 | menuCreate mutation | https://shopify.dev/docs/api/admin-graphql/latest/mutations/menuCreate |
| 15 | Menu reads: Admin API limitation | https://community.shopify.dev/t/issue-with-fetching-main-menu-with-nested-collections-using-shopify-admin-api/18106 |
| 16 | Navigation help doc | https://help.shopify.com/en/manual/online-store/menus-and-links/understanding-navigation |
| 17 | Product Recommendations (Storefront API) | https://shopify.dev/docs/api/storefront/latest/queries/productRecommendations |
| 18 | Recommendations intent enum | https://shopify.dev/docs/api/storefront/latest/enums/ProductRecommendationIntent |
| 19 | Product Recommendations Ajax API | https://shopify.dev/docs/api/ajax/reference/product-recommendations |
| 20 | Related products guide | https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations/related-products |
| 21 | Complementary products guide | https://shopify.dev/docs/storefronts/themes/product-merchandising/recommendations/complementary-products |
| 22 | Search & Discovery recommendations | https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-recommendations |
| 23 | Related vs Complementary changelog | https://shopify.dev/changelog/display-both-related-and-complementary-product-recommendations-on-storefronts |
| 24 | Product object (Storefront API) | https://shopify.dev/docs/api/storefront/latest/objects/Product |
