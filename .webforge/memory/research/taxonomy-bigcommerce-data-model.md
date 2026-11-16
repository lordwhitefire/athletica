# BigCommerce Taxonomy Data Model

**Author:** Odin-Birch  
**Date:** 2026-07-18  
**Task:** taxonomy-research-001  
**Part:** 1a of 3 (BigCommerce)

---

## 1. Category Tree Data Model

### Category Object Fields

BigCommerce stores categories as a **flat list with a `parent_id` foreign key**, not as nested documents. The `category_Full` object (source: [BigCommerce Create Category API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/categories/create-category)):

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique ID, increments sequentially (read-only) |
| `parent_id` | integer | Parent category ID. `0` = top-level. |
| `name` | string | Display name. Unique among siblings. Max 50 chars. |
| `description` | string | HTML description |
| `views` | integer | Storefront view count |
| `sort_order` | integer | Menu priority (lower = higher) |
| `page_title` | string | Custom meta title |
| `search_keywords` | string | Comma-separated search keywords |
| `meta_keywords` | array[string] | Custom meta keywords |
| `meta_description` | string | Custom meta description |
| `layout_file` | string | Template file (Blueprint only) |
| `is_visible` | boolean | Displayed on storefront? |
| `default_product_sort` | enum | featured, newest, best_selling, alpha_asc, etc. |
| `image_url` | string | Category image URL |
| `custom_url` | object | `{url, is_customized}` — auto-generated if not set |

### parent_id and 8-Level Nesting

- **`parent_id` = 0** means top-level category.
- **`parent_id` = X** makes this category a child of category X.
- **8-level maximum nesting depth.** (source: [BigCommerce Create Category API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/categories/create-category))
- Limits: **16,000 categories per store** max, **1,000 categories per product** max.

**API Example:**
```json
POST /stores/{store_hash}/v3/catalog/categories
{ "parent_id": 2, "name": "Bath" }
// Response: { "data": { "id": 101, "parent_id": 2, "name": "Bath",
//   "custom_url": { "url": "/bath", "is_customized": true } } }
```

### URL Path Construction

BigCommerce auto-generates URLs from the category name (sluggified). For multi-storefront setups, BigCommerce uses **Category Trees** — a tree entity mapped to a channel. The modern endpoints are under `/v3/catalog/category-trees/` (source: [BigCommerce Category Trees](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/category-trees))

### Product-to-Category Assignment

**Yes, a product can be in multiple categories.** The product object contains:
```json
{ "categories": [21, 22, 33], "brand_id": 50 }
```
(source: [BigCommerce Create Product API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/products/create-product))

The `categories` field is an **array of numeric IDs**. Up to **1,000 categories per product**.

---

## 2. Brands Data Model

### Brand is a First-Class Entity

Brand has its own CRUD endpoints at `/v3/catalog/brands`. (source: [BigCommerce Brands API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/brands))

**Brand object fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique ID |
| `name` | string | **Must be unique.** Required. |
| `page_title` | string | Browser title for brand page |
| `meta_keywords` | array[string] | HTML meta keywords |
| `meta_description` | string | Meta description |
| `search_keywords` | string | Search keywords |
| `image_url` | string | Brand image/logo URL |
| `custom_url` | object | Auto-generated if not provided |

**Create Brand Example:**
```json
POST /stores/{store_hash}/v3/catalog/brands
{ "name": "Common Good" }
// Response: { "data": { "id": 50, "name": "Common Good",
//   "custom_url": { "url": "/brands/Common-Good.html" } } }
```
(source: [BigCommerce Create Brand API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/brands/create-brand))

### Product → Brand Relationship

The product object has **`brand_id`** (integer) and **`brand_name`** (string, write-only):
```json
{ "brand_id": 50, "brand_name": "Common Good" }
```
`brand_name` creates a brand if it doesn't exist. (source: [BigCommerce Create Product API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/products/create-product))

### Brand is Single-Select (Confirmed)

**Confirmed: one brand per product.** The `brand_id` field is a single integer, not an array. Existing Probe research is correct. (source: [BigCommerce Categories and Brands](https://support.bigcommerce.com/s/article/Categories-and-Brands))

---

## 3. Product Types / Taxonomies

### "Product Type" Concept

BigCommerce has a **`type`** field with exactly two values: `physical` or `digital`. (source: [BigCommerce Create Product API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/products/create-product))

This is **not** a flexible taxonomy — simple binary classification. **No attribute-set-per-type exists.**

### Custom Fields, Modifiers, Related Products

- **Custom Fields:** Key-value pairs (max 200 per product, 255 chars per field).
- **Modifiers & Variant Options:** Options (text, select, etc.) at product level.
- **Related Products:** Native array of product IDs:
  ```json
  "related_products": [123, 456, 789]
  ```
  (source: [BigCommerce Create Product API](https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/products/create-product))

---

## Source Reference Index

| # | Source | URL |
|---|--------|-----|
| 1 | BigCommerce Create Category API | https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/categories/create-category |
| 2 | BigCommerce Create Brand API | https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/brands/create-brand |
| 3 | BigCommerce Create Product API | https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/products/create-product |
| 4 | BigCommerce Category Trees | https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/category-trees |
| 5 | BigCommerce Brands API | https://docs.bigcommerce.com/developer/api-reference/rest/admin/catalog/brands |
| 6 | BigCommerce Categories & Brands | https://support.bigcommerce.com/s/article/Categories-and-Brands |
