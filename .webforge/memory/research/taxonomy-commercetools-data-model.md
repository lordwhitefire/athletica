# CommerceTools Taxonomy Data Model

**Author:** Odin-Birch  
**Date:** 2026-07-18  
**Task:** taxonomy-research-001  
**Part:** 1b of 3 (CommerceTools)

---

## 1. Product Types Model

### Product Types Define Attribute Schema

CommerceTools has a **first-class ProductType concept** that defines the attribute schema for products. (source: [CommerceTools ProductTypes API](https://docs.commercetools.com/api/projects/productTypes))

**ProductType fields:**
```json
{
  "id": "uuid",
  "version": 1,
  "key": "football-boot",
  "name": "Football Boot",
  "attributes": [
    {
      "name": "stud_type",
      "label": { "en": "Stud Type" },
      "isRequired": true,
      "type": { "name": "enum", "values": [...] },
      "attributeConstraint": "SameForAll",
      "isSearchable": true
    }
  ]
}
```

**Key points:**
- ProductType defines a **reusable schema of attributes**.
- Each Product references **exactly one ProductType**.
- Attributes at **Product level** (common to all variants) or **variant level**.
- **Max 1,000 ProductTypes per project** (soft limit). (source: [CommerceTools ProductTypes API](https://docs.commercetools.com/api/projects/productTypes))

### ProductType → Product → Variant Relationship

```
ProductType (defines attribute schema)
    └── Product (references 1 ProductType)
            ├── masterVariant
            └── variants[] (up to 100 Classic / 10,000 Modular)
```

**ProductDraft example:**
```json
{
  "productType": { "typeId": "product-type", "id": "football-boot-pt" },
  "name": { "en": "Predator Edge.1 FG" },
  "slug": { "en": "predator-edge-1-fg" },
  "masterVariant": {
    "sku": "PEDGE1-FG-UK9",
    "attributes": [
      { "name": "stud_type", "value": "FG" },
      { "name": "colorway", "value": "Black/White/Red" }
    ]
  }
}
```
(source: [CommerceTools Products API](https://docs.commercetools.com/api/projects/products))

### Attribute Constraints

- `SameForAll` — same across all variants (product-level)
- `Unique` — varies per variant (variant-level)
- `CombinationUnique` — combination is unique per variant

Types include: `boolean`, `text`, `number`, `enum`, `lenum`, `money`, `date`, `reference`, `set`, `nested`.

---

## 2. Categories Model

### Category Object Fields

CommerceTools categories are **full document entities** with UUID identifiers and versioning. (source: [CommerceTools Categories API](https://docs.commercetools.com/api/projects/categories))

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `key` | string | User-defined key for API reference |
| `version` | integer | Optimistic concurrency version |
| `name` | LocalizedString | Multi-locale name |
| `slug` | LocalizedString | URL segment (unique per locale) |
| `parent` | Reference | Reference to parent (null for root) |
| `ancestors` | array[Reference] | **Pre-computed list of all ancestor references** |
| `orderHint` | string | Sibling ordering (e.g. "0.5") |
| `externalId` | string | External system ID |
| `metaTitle` | LocalizedString | SEO meta title |
| `metaDescription` | LocalizedString | SEO meta description |
| `assets` | array[Asset] | Category images/media |

### Category Hierarchies

- **`parent`**: `{typeId: "category", id: "uuid"}`. `null` for root categories.
- **`ancestors` array**: Pre-computed array of all ancestor references. Avoids recursive traversal.
- **`orderHint`**: Controls sibling sort. String between 0 and 1.
- **Max 10,000 categories per project** (soft limit). (source: [CommerceTools Categories API](https://docs.commercetools.com/api/projects/categories))
- **Deleting root deletes entire subtree.**

**Example:**
```json
{
  "id": "child-uuid",
  "name": { "en": "FG Boots" },
  "parent": { "typeId": "category", "id": "parent-uuid" },
  "ancestors": [
    { "typeId": "category", "id": "root-uuid" },
    { "typeId": "category", "id": "parent-uuid" }
  ],
  "orderHint": "0.5"
}
```

### Product-to-Category

**Yes, multi-category.** The product's `categories` is an array of CategoryReferences:
```json
{
  "categories": [{ "typeId": "category", "id": "cat-1-uuid" }],
  "categoryOrderHints": { "cat-1-uuid": "0.5" }
}
```

---

## 3. Taxonomy Approach

### Navigation vs Category Tree

- **Categories** — for classification and filtering.
- **Navigation** — typically derived from a subset of the category tree.

### Product Relationships

CommerceTools models product groupings via **Product Selections**:
- Define sets of products (e.g., "Summer Collection 2026").
- For cross-sell/upsell, use:
  - **Custom attributes** on ProductType (e.g., `relatedProducts: set of references`)
  - **Product Selections** for curated groupings
  - **Product Projections query** — products sharing the same category

### GraphQL — "Products in Same Category"

```graphql
{
  product(id: "product-id") {
    categories { id, name(locale: "en") }
  }
  products(where: "categories(id=\"category-id\")", limit: 20) {
    results { id, name(locale: "en"), masterVariant { sku } }
  }
}
```
(source: [CommerceTools Product Projection Search](https://docs.commercetools.com/api/projects/product-projection-search))

---

## Source Reference Index

| # | Source | URL |
|---|--------|-----|
| 1 | CommerceTools Categories API | https://docs.commercetools.com/api/projects/categories |
| 2 | CommerceTools ProductTypes API | https://docs.commercetools.com/api/projects/productTypes |
| 3 | CommerceTools Products API | https://docs.commercetools.com/api/projects/products |
| 4 | CommerceTools Product Projection Search | https://docs.commercetools.com/api/projects/product-projection-search |
