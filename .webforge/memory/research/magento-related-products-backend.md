# Magento Related/Up-sell/Cross-sell Backend Data Model

> **Research for Athletica** — football boots e-commerce (Next.js 16, Sanity CMS, Supabase)
> **Date:** 2026-07-18 | **Researcher:** Odin-Reed | **Report to:** Director Odin

---

## 5. Related, Up-sell, Cross-sell Data Model

### 5.1 Core Tables

Two tables store product relationship definitions:

**Table 1: `catalog_product_link_type`**

Defines the available link types (this is a lookup/reference table):

```
link_type_id  | code
1             | "relation"       -- Related Products
4             | "upsell"         -- Up-sell Products
5             | "crosssell"      -- Cross-sell Products
```

**Table 2: `catalog_product_link`**

Stores actual product-to-product relationships:

```sql
CREATE TABLE catalog_product_link (
    link_id           INT PRIMARY KEY AUTO_INCREMENT,
    product_id        INT NOT NULL,       -- FK → catalog_product_entity.entity_id (source)
    linked_product_id INT NOT NULL,       -- FK → catalog_product_entity.entity_id (target)
    link_type_id      SMALLINT NOT NULL   -- FK → catalog_product_link_type.link_type_id
);
```

Example data:

```
link_id  | product_id (source)   | linked_product_id (target) | link_type_id
1        | 123 (Football Boot)   | 456 (Shin Guards)          | 1 (related)
2        | 123 (Football Boot)   | 789 (Premium Boot)         | 4 (up-sell)
3        | 123 (Football Boot)   | 101 (Socks)                | 5 (cross-sell)
```

**Source:** [docs.mageforge.io/catalog.php](https://docs.mageforge.io/catalog.php) — Product Relationship Tables section  
**Source:** [Magento StackExchange #316429](https://magento.stackexchange.com/questions/316429/magento-2-which-tables-is-used-for-related-products-up-sells-and-cross-sells) — "For products the linked products are saved in catalog_product_link. The column catalog_product_link_type stores whether it's a cross/up/down sell"

### 5.2 Link Type ID Details

| Type | `link_type_id` | `code` | Frontend Display Location | Purpose |
|---|---|---|---|---|
| Related Products | 1 | `relation` | Product detail page (below main product) | Suggest complementary items of same category/type |
| Up-sell Products | 4 | `upsell` | Product detail page | Encourage premium upgrade (higher price/quality) |
| Cross-sell Products | 5 | `crosssell` | Shopping cart page | Trigger impulse buys — complementary low-cost add-ons |

**Source:** [Mageworx Wiki](https://www.mageworx.com/wiki/magento-2-upsell-cross-sell) — functional comparison of all three types  
**Source:** [FireBear Related Products Guide](https://firebearstudio.com/blog/the-complete-guide-to-magento-2-related-products-up-sells-and-cross-sells-and-how-to-import-them.html) — comparison table with display locations

### 5.3 Directionality

The relationship is **directional (A→B)**, not bidirectional:
- `product_id` = source product
- `linked_product_id` = target product
- Magento does NOT auto-create reverse relationships
- Bidirectional linking requires two explicit rows

**Source:** [Inchoo Programmatic Relations Guide](https://inchoo.net/magento-1/programmatically-create-upsell-crosssell-related-products-magento) — demonstrates saving relationships programmatically with explicit direction

### 5.4 Manual vs Algorithmic Setup

**Default (Open Source):** All relationships are **manually configured** by the merchant:
1. Admin → Catalog → Products → Edit product
2. Scroll to "Related Products, Up-Sells, and Cross-Sells" section
3. Use the grid to search and select products to link
4. Save

**Adobe Commerce (Enterprise) adds:**
- **Related Product Rules** (Marketing → Promotions → Related Product Rules) — rule-based matching using product attributes, price, category
- **Product Recommendations** — Adobe Sensei AI-driven suggestions

**Source:** [Mirasvit FAQ](https://mirasvit.com/magento2-upsell-cross-sell.html) — "Out-of-box Magento does not have the capability for using rules to connect products"  
**Source:** [FireBear Related Products Guide](https://firebearstudio.com/blog/the-complete-guide-to-magento-2-related-products-up-sells-and-cross-sells-and-how-to-import-them.html) — "Magento allows you to auto-generate related products based on product attributes, cart conditions, customer behavior"

### 5.5 Supporting Tables for Link Attributes

Extra metadata (like sort position) is stored in secondary tables:

```sql
-- catalog_product_link_attribute: defines extra properties per link type
product_link_attribute_id  | link_type_id | product_link_attribute_code | data_type
1                          | 1 (related)  | "position"                  | "int"
2                          | 4 (upsell)   | "position"                  | "int"
3                          | 5 (crosssell)| "position"                  | "int"

-- catalog_product_link_attribute_int: stores actual attribute values
value_id  | product_link_attribute_id | link_id | value
10        | 1 (position for related)  | 1       | 0
```

**Source:** [Webkul Custom Link Type Tutorial](https://webkul.com/blog/create-custom-link-product-type-magento2/) — documents creating entries in `catalog_product_link_attribute`

### 5.6 Frontend Rendering Architecture

Magento renders these links through:

**Layout XML** (in `Magento_Catalog` module, `catalog_product_view.xml`):

| Block Class | Position | Template |
|---|---|---|
| `Magento\Catalog\Block\Product\ProductList\Related` | `content` | `product/list/items.phtml` |
| `Magento\Catalog\Block\Product\ProductList\Upsell` | `content` | `product/list/items.phtml` |
| `Magento\Checkout\Block\Cart\Crosssell` | `cart` | `cart/cross-sell.phtml` |

**Data retrieval in PHP:**
```php
$relatedProducts  = $product->getRelatedProducts();   // link_type_id = 1
$upsellProducts   = $product->getUpSellProducts();    // link_type_id = 4
$crosssellProducts = $product->getCrossSellProducts(); // link_type_id = 5
```

**Indexer:** `catalog_product_link` indexer reindexes product link data for fast frontend retrieval.

### 5.7 Order Tracking

There is **no native table** that tracks whether a sale originated from a related/up-sell/cross-sell link:

- **Related products:** If added to cart via "Add to Cart" on a related product, `related_product` info is stored in the `product_options` JSON column of `sales_order_item`
- **Up-sell/Cross-sell:** No native tracking at all — third-party analytics extensions required

**Source:** [Magento StackExchange #316429](https://magento.stackexchange.com/questions/316429/magento-2-which-tables-is-used-for-related-products-up-sells-and-cross-sells) — "Currently there is no table which saves the data to check if a product was added through cross-sell or up-sell property"

---

## SQL: Full Product Relationship Query

```sql
SELECT
    p1.sku AS product_sku,
    p1.name AS product_name,
    lt.code AS link_type,
    p2.sku AS linked_sku,
    p2.name AS linked_name
FROM catalog_product_link l
JOIN catalog_product_link_type lt ON l.link_type_id = lt.link_type_id
JOIN catalog_product_entity p1 ON l.product_id = p1.entity_id
JOIN catalog_product_entity p2 ON l.linked_product_id = p2.entity_id
WHERE p1.sku = 'FOOTBALL-BOOT-PRO'
ORDER BY lt.code;
```

Output:
```
product_sku       | product_name    | link_type | linked_sku      | linked_name
FOOTBALL-BOOT-PRO | Football Boot   | relation  | SHIN-GUARD-PRO  | Pro Shin Guards
FOOTBALL-BOOT-PRO | Football Boot   | upsell    | BOOT-ELITE      | Elite Football Boot
FOOTBALL-BOOT-PRO | Football Boot   | crosssell | SOCKS-PRO       | Pro Socks
```

---

## Summary for Athletica Architecture

| Magento Concept | Athletica Equivalent (Next.js + Sanity + Supabase) |
|---|---|
| `catalog_category_entity` + EAV | Sanity documents with `path`, `level`, `parent` fields + Supabase for queries |
| `catalog_category_product` (junction) | Supabase join table: `product_categories(product_id, category_id, position)` |
| Brand as dropdown attribute | Sanity document type `brand` with reference from product document |
| `eav_attribute_option` (brand values) | Sanity `brand` documents with name, slug, logo |
| `catalog_product_link` (related/upsell/cross-sell) | Supabase `product_links(product_id, linked_product_id, link_type)` with `link_type ENUM('related','upsell','cross_sell')` |
| `catalog_product_link_attribute` (position) | Add `position INT` column to `product_links` table |
| `url_rewrite` table | Next.js dynamic routing `[category]/[product]` + Supabase slug lookup |
| Anchor categories (recursive) | PostgreSQL recursive CTE: `WITH RECURSIVE category_tree AS (...)` |

---

## Source Index

1. https://docs.mageforge.io/catalog.php — Catalog DB Tables (product link tables)
2. https://magento.stackexchange.com/questions/316429 — Magento 2 Product Link Tables
3. https://www.mageworx.com/wiki/magento-2-upsell-cross-sell — Upsell/Cross-sell Wiki
4. https://mirasvit.com/magento2-upsell-cross-sell.html — Cross-sell/Upsell FAQ
5. https://firebearstudio.com/blog/the-complete-guide-to-magento-2-related-products-up-sells-and-cross-sells.html — Related Products Guide
6. https://webkul.com/blog/create-custom-link-product-type-magento2/ — Custom Link Types
7. https://inchoo.net/magento-1/programmatically-create-upsell-crosssell-related-products-magento — Programmatic Relations
8. https://belvg.com/blog/how-eav-data-storage-works-in-magento-2.html — EAV Data Storage
9. https://docs.magento-opensource.com/merchant/grow-store/howto-how-to-set-up-cross-selling-and-upselling — Merchant Docs
