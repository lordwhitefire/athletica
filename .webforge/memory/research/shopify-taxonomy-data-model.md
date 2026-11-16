# Shopify Taxonomy Data Model & Related Products Backend — Research Report (Part 1/2)

**Date:** 2026-07-18  
**Researcher:** Odin-Sage (Intelligence Team)  
**Context:** Athletica — football boots e-commerce (Next.js 16, Sanity CMS, Supabase)  
**Purpose:** Data model level understanding of how Shopify stores and relates products, categories, collections, and navigation.

---

## Area A: Shopify Collections Data Model

### 1. Collections (Manual vs Automated) — Data Model

#### 1.1 The `Collection` Object (GraphQL Admin API)

The core entity is the `Collection` object in the GraphQL Admin API. Key fields:

```graphql
type Collection {
  id: ID!
  title: String!
  handle: String!
  description: String!
  descriptionHtml: HTML!
  image: Image
  seo: SEO!
  products: ProductConnection!
  productsCount: Count
  sources: [CollectionSource!]!         # NEW in 2026-07
  sortOrder: CollectionSortOrder!
  templateSuffix: String
  updatedAt: DateTime!
  # Deprecated:
  ruleSet: CollectionRuleSet            # Replaced by sources
}
```

**Source:** https://shopify.dev/docs/api/admin-graphql/latest/objects/Collection

#### 1.2 The NEW Model (2026-07+): Sources Instead of Custom/Smart Split

**Critical update:** As of the `2026-07` GraphQL Admin API version (stable July 2026), the old custom (manual) vs smart (automated) split is **replaced** by a composable, multi-source model.

**Source:** https://shopify.dev/changelog/new-collection-model-and-apis-now-available  
**Source:** https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/use-new-collections-model  
**Source:** https://shopify.dev/docs/apps/build/product-merchandising/products-and-collections/migrate-to-flexible-collections

**How the new model works:**
- A collection has one or more `CollectionSource` objects on the `Collection.sources` field.
- Each source contributes products through **inclusions** (conditions and explicit selections) and can **exclude** products.
- Membership is the **union** of all sources, minus exclusions.
- Shopify **re-evaluates membership automatically** as catalog data changes (not stored permanently).

**Source types (implementing `CollectionSource` interface):**

| Source Type | Description |
|---|---|
| `CollectionConditionsSource` | Typed inclusion conditions + manual product/variant selections + exclusions. Evolution of smart-collection rules. |
| `CollectionSubCollectionsSource` | Pulls membership from one or more referenced collections. |
| Shareable source | App-owned conditions source, linked by reference, reusable across collections. |

**Source:** https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionConditionsSource  
**Source:** https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionSubCollectionsSource

**The old model (legacy, deprecated):**
- **Manual (custom) collection:** Products hand-picked individually. Used `collectionAddProducts`/`collectionRemoveProducts` mutations. No `ruleSet`.
- **Smart (automated) collection:** Products determined by rules in a `ruleSet` (e.g., `column: "tag"`, `relation: "equals"`, `condition: "summer"`). Rules evaluated at query time by Shopify.
- **Structural difference:** Manual collections had no `ruleSet` field; smart collections had `ruleSet`. Products were added manually to custom collections via separate mutations.

**Source:** https://help.shopify.com/en/manual/products/collections/collection-types

#### 1.3 How Membership Is Stored & Evaluated

**Under the new model (2026-07+):**
- Membership is **NOT stored** as a fixed list. Shopify re-evaluates conditions dynamically as products change.
- Manual selections (`selections` on `CollectionSourceInclusion`) ARE stored — these are explicit product IDs.
- For `CollectionConditionsSource`: Shopify evaluates conditions at query time. When the `collection.products` query is fetched, it computes the union of all sources, applies exclusions, and returns the result.
- For `CollectionSubCollectionsSource`: Membership is inherited dynamically — changes to source collections propagate automatically.

**Conditions evaluation:**
- Each source has `inclusion.matchType`: `ALL` (product must match every condition) or `ANY` (product must match at least one condition).
- Conditions are **strongly typed** — each attribute has its own GraphQL type (e.g., `CollectionSourceInclusionConditionProductTag`, `CollectionSourceInclusionConditionVariantPrice`).
- Up to **60 conditions per source**.

**Source:** https://shopify.dev/docs/api/admin-graphql/2026-07/objects/CollectionSourceInclusion

#### 1.4 Product in Multiple Collections

**Yes, a product can belong to UNLIMITED collections.** There is no documented "max collections per product" limit at the API level. The collections query filter accepts `product_id` to find all collections containing a given product.

The relationship is a **many-to-many pattern** (junction table):
- On the Product object: `Product.collections` (returns a `CollectionConnection`)
- On the Collection object: `Collection.products` (returns a `ProductConnection`)
- The Storefront API `Product` object also exposes `collections`

```graphql
# From Product, get all collections
query {
  product(id: "gid://shopify/Product/1") {
    collections(first: 50) {
      nodes { id title handle }
    }
  }
}

# From Collection, get all products
query {
  collection(id: "gid://shopify/Collection/1") {
    products(first: 50) {
      nodes { id title }
    }
  }
}
```

**Source:** https://shopify.dev/docs/api/admin-graphql/latest/objects/Product#field-Product.fields.collections  
**Source:** https://shopify.dev/docs/api/storefront/2026-07/objects/Product#field-Product.fields.collections

There is **no built-in cap** on how many collections a product can belong to, though performance considerations apply at scale.

---

### 2. Product Categories vs Collections vs Product Type

#### 2.1 Product Category (Standard Product Taxonomy)

**Product Category is a STANDARDIZED field** from Shopify's Standard Product Taxonomy (open-source, 10K+ categories, 25+ verticals). It is a **first-class entity represented by `TaxonomyCategory`** in the GraphQL Storefront API, **not** just a string field.

```graphql
type Product {
  category: TaxonomyCategory   # Storefront API
}

type TaxonomyCategory {
  id: ID!
  name: String!
  fullName: String       # e.g., "Apparel & Accessories > Clothing > Activewear"
  isLeaf: Boolean!
  parent: TaxonomyCategory
  children: [TaxonomyCategory!]
}
```

**Source:** https://help.shopify.com/en/manual/products/details/product-category  
**Source:** https://shopify.dev/docs/api/storefront/2026-07/objects/TaxonomyCategory  
**Source:** https://github.com/Shopify/product-taxonomy

Key facts:
- Each product can have **only one** product category.
- Product category is used for: tax calculations, channel integrations (Google/Facebook), category-specific metafields (product attributes).
- Open source at https://github.com/Shopify/product-taxonomy
- If not assigned, product is `uncategorized`.

#### 2.2 Product Type

**Product Type is a custom string field** (`String!`) on the product. It is:
- Freely defined by the merchant (not from a controlled taxonomy)
- Each product has **only one** product type
- Optional (can be blank)
- Used for internal organization, filtering, and smart collection rules

```graphql
type Product {
  productType: String!   # Storefront API — custom, merchant-defined
}
```

**Source:** https://help.shopify.com/en/manual/products/details/product-type  
**Source:** https://shopify.dev/docs/api/storefront/2026-07/objects/Product#field-Product.fields.productType

#### 2.3 How Shopify Knows Which to Use for Navigation

**They serve different purposes:**

| Entity | Scope | Navigation Use | Cardinality per Product |
|---|---|---|---|
| **Product Category** | Standard taxonomy, external channel compliance | Backend classification, channel feeds, SEO breadcrumbs | Exactly 1 |
| **Product Type** | Custom string, merchant-defined | Smart collection rules, filtering, admin reporting | Exactly 1 |
| **Collections** | Customer-facing product groups | Navigation menus, landing pages, marketing campaigns | Unlimited (many-to-many) |
| **Tags** | Flexible labels | Smart collection rules, filtering, internal search | Unlimited |

**Navigation menus explicitly link to Collections, NOT to categories or product types.** Categories and product types are used indirectly — they feed into smart collection rules (e.g., a smart collection "Football Boots" can include products where `productType == "Football Boots"`).

**Source:** https://ouiteo.com/blog/shopify-collections-vs-categories-whats-the-difference/  
**Source:** https://bulkflow.io/blog/shopify-product-type-vs-collection/

---

### 3. Navigation Menu vs Category Tree

#### 3.1 Separate Concepts

**Navigation menus and the category/collection tree are SEPARATE in Shopify.** They are NOT the same.

- **Navigation Menus** are explicit structures stored as `Menu` objects (created/updated via `menuCreate`/`menuUpdate` mutations, read via Storefront API).
- **Collections** are product groupings stored as `Collection` objects.
- **Product Categories** are taxonomy classifications on the `Product` object.

**Admin API:** `menuCreate` / `menuUpdate` mutations exist.  
**Storefront API:** `menu(handle: "main-menu")` query reads menus.  
**Note:** The Admin API does NOT expose a `menu` query for reading menus — only mutations for creating/updating. Reading menus requires the Storefront API.

**Source:** https://shopify.dev/docs/api/admin-graphql/latest/mutations/menuCreate  
**Source:** https://shopify.dev/docs/api/storefront/latest/objects/Menu  
**Source:** https://community.shopify.dev/t/issue-with-fetching-main-menu-with-nested-collections-using-shopify-admin-api/18106 (Admin API doesn't expose menu reads — confirmed by Shopify staff)

#### 3.2 How Admin Builds Navigation Menus

Menu items can link to:
- **Collections** (type: `COLLECTION`)
- **Products** (type: `PRODUCT`)
- **Pages** (type: `PAGE`)
- **Blogs** (type: `BLOG`)
- **Custom URLs** (type: `HTTP` or `EXTERNAL`)
- **Catalog** (type: `CATALOG` — link to /collections/all)
- **Home** (type: `FRONT_PAGE`)

Menus support nesting **up to 3 levels deep**.

```graphql
type MenuItem {
  id: ID!
  title: String!
  type: MenuItemType!
  url: URL!
  resource: MenuItemResource  # Union: Collection | Product | Page | Blog
  items: [MenuItem!]!         # Nested sub-items
}
```

**Source:** https://shopify.dev/docs/api/storefront/latest/objects/Menu  
**Source:** https://shopify.dev/docs/api/storefront/latest/objects/MenuItem

#### 3.3 What Happens When a Collection is Deleted?

**The navigation menu can break.** If a menu item links to a deleted collection:
- The menu item remains in the menu structure
- The `url` field may return null or a broken link
- The `resource` field returns null
- Shopify does NOT automatically remove orphaned menu items
- The storefront displays a dead link unless the merchant manually removes it

**Source:** https://help.shopify.com/en/manual/online-store/menus-and-links/understanding-navigation

---

### 4. Multi-category Products

#### 4.1 How Shopify Handles Products in Multiple Collections

**Fully supported** — a product can belong to many collections simultaneously via a many-to-many relationship pattern. For example, a Nike Mercurial boot can be in "Football Boots", "Nike", "Sale Items", and "New Arrivals" collections simultaneously.

**No special handling needed** — collections are independent groupings with no hierarchy enforced.

#### 4.2 Canonical URLs and Sitemaps

**Canonical URLs:** Each product has ONE canonical URL (its product page, e.g., `/products/mercurial-superfly-9`). Being in multiple collections does NOT create multiple canonical URLs. The product page URL is independent of collection context.

**Sitemaps:** The product appears once in the sitemap with its canonical URL. Collection membership does NOT create duplicate entries.

**Potential concern:** The same product can appear on multiple collection pages (`/collections/football-boots` and `/collections/sale`). However, since canonical tags on collection product cards typically point to the product's own URL, this is handled correctly by canonical tags in standard Shopify themes.

**Source:** No explicit Shopify documentation found on multi-collection SEO issues. Standard practice in Shopify themes (including Dawn) is that canonical tags on product pages point to the product's own URL regardless of collection context.
