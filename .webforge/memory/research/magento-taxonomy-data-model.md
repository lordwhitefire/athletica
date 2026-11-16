# Magento Taxonomy Data Model

> **Research for Athletica** — football boots e-commerce (Next.js 16, Sanity CMS, Supabase)
> **Date:** 2026-07-18 | **Researcher:** Odin-Reed | **Report to:** Director Odin

---

## 1. Category Tree in EAV Model

### 1.1 How Categories Are Stored in EAV

Categories in Magento use the same EAV (Entity-Attribute-Value) pattern as products. The main entity table is `catalog_category_entity`, with attribute values spread across type-specific tables.

**Source:** [docs.mageforge.io/catalog.php](https://docs.mageforge.io/catalog.php) — Magento 2 Catalog Database Tables Reference Guide  
**Source:** [docs.magento-opensource.com EAV System Architecture](https://docs.magento-opensource.com/developer/guide-explanation-eav-system.html) — "Magento 2 uses EAV extensively for products, customers, categories, and orders"

### 1.2 Key Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `catalog_category_entity` | Base category entity (fixed columns) | `entity_id`, `parent_id`, `path`, `position`, `level`, `children_count`, `created_at`, `updated_at` |
| `catalog_category_entity_varchar` | String attribute values (name, url_key, url_path) | `value_id`, `attribute_id`, `store_id`, `entity_id`, `value` |
| `catalog_category_entity_int` | Integer attribute values (is_active, include_in_menu, is_anchor) | Same structure |
| `catalog_category_entity_text` | Long text attribute values (description) | Same structure |
| `catalog_category_entity_decimal` | Decimal attribute values | Same structure |
| `catalog_category_entity_datetime` | Date/time attribute values | Same structure |

**Source:** [docs.mageforge.io/catalog.php](https://docs.mageforge.io/catalog.php) — "Category Tables" section with full column definitions

### 1.3 The `path` Column for Hierarchy Traversal

The `path` column is a materialized path string encoding the full ancestry:

- **Format:** `1/2/5/12` where each number is an `entity_id`
- Root category (Default) is always `1`
- **Example:** root(1) → Men(2) → Shoes(5) → Football Boots(12) → `path = "1/2/5/12"`
- **Descendant query:** `SELECT * FROM catalog_category_entity WHERE path LIKE '1/2/5/%'`
- **Breadcrumb:** Split path by `/`, load each category by entity_id

**Source:** [emmo.net.co Category Tree Collection](https://emmo.net.co/articles/post/how-to-get-category-tree-collection-in-magento-247.html) — "path: The category's full path in the tree (e.g., 1/2/5 for Root → Electronics → Laptops)"

### 1.4 `level` and `position` Columns

- **`level`** — Depth in hierarchy. Root = 0, first-level = 1, second-level = 2, etc.
- **`position`** — Sort order within parent category. Lower values appear first.
- **Typical query:** `SELECT * FROM catalog_category_entity WHERE parent_id = X ORDER BY position ASC`

**Source:** [docs.mageforge.io/catalog.php](https://docs.mageforge.io/catalog.php) — "position: Position within parent category; level: Depth in category tree (root = 0)"

### 1.5 Category URLs: `url_key` and `url_path`

Category URLs are EAV attributes stored in `catalog_category_entity_varchar`:

- **`url_key`** (varchar) — SEO slug (e.g., `football-boots`)
- **`url_path`** (varchar, **deprecated** in 2.4.x) — Full path like `men/football-boots`

Magento generates URL rewrites in the `url_rewrite` table:

```
url_rewrite_id | request_path          | target_path               | redirect_type | store_id | entity_type
1              | men/football-boots    | catalog/category/view/id/12 | 0 (no redirect) | 1        | category
```

**Source:** [Magento StackExchange — URL Key](https://magento.stackexchange.com/questions/331780/magento-2-change-the-url-key-and-save-the-category-the-value-specified-in-th) references `url_path` in `catalog_category_entity_varchar`  
**Source:** [Magento Merchant Docs — Categories](https://docs.magento-opensource.com/merchant/manage-catalog/tutorial-getting-started-with-manage-product-categories) — "Keep URL Keys readable and stable"

---

## 2. Product-to-Category Relationships

### 2.1 The Junction Table

A simple many-to-many junction table:

```sql
CREATE TABLE catalog_category_product (
    entity_id      INT PRIMARY KEY AUTO_INCREMENT,
    category_id    INT NOT NULL,  -- FK → catalog_category_entity.entity_id
    product_id     INT NOT NULL,  -- FK → catalog_product_entity.entity_id
    position       INT NOT NULL DEFAULT 0
);
```

**Source:** [docs.mageforge.io/catalog.php](https://docs.mageforge.io/catalog.php) — "catalog_category_product: Maps products to categories (many-to-many relationship)"

### 2.2 It's Simple, Not Complex

- Single row per product-category assignment
- No temporal data, no conditions
- The `position` column controls sort order within the category

### 2.3 Position in Product-Category Context

`position` = INT, sort order for products within a category listing. Lower number = higher position. Set via admin drag-and-drop or programmatically.

### 2.4 Multi-Category Products and Canonical URLs

**Yes, a product CAN be in multiple categories.** Magento handles this via:

1. **Multiple `catalog_category_product` rows** — one per category
2. **Canonical URL** — Uses "Use Categories Path for Product URLs" config. Default canonical uses the last assigned or first browsed category path.
3. **`catalog_url_rewrite_product_category`** — maps URL rewrites to specific category views of products
4. **Duplicate content** — Extension developers recommend canonical tags for multi-category products

**Source:** [Amasty SEO URL Rewrite](https://amasty.com/unique-product-url-for-magento-2.html) — canonical URL handling for multi-category products  
**Source:** [Scommerce-Mage Canonical URLs](https://www.scommerce-mage.com/magento-2-canonical-urls-for-category-product-and-cms-pages.html) — "Add primary category path in canonical tag for product pages"

---

## 3. Brand Attributes within EAV

### 3.1 No Native "Brand" Entity

Magento has **no dedicated Brand entity/table**. Brand is implemented as a **product attribute** — typically a dropdown (select) attribute with `backend_type = "int"`.

**Source:** [scandiweb.com EAV Model Guide](https://scandiweb.com/blog/magento-series-the-eav-model) — attribute types  
**Source:** [BelVG How EAV Works](https://belvg.com/blog/how-eav-data-storage-works-in-magento-2.html) — dropdown attribute implementation

### 3.2 Attribute Definition Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `eav_attribute` | Global attribute registry | `attribute_id`, `entity_type_id`, `attribute_code`, `backend_type`, `frontend_input`, `source_model` |
| `catalog_eav_attribute` | Product-specific settings | `attribute_id`, `is_filterable`, `is_visible_on_front`, `used_in_product_listing` |
| `eav_attribute_set` | Attribute set groupings | `attribute_set_id`, `entity_type_id`, `attribute_set_name` |
| `eav_attribute_group` | Groups within attribute sets | `attribute_group_id`, `attribute_set_id`, `attribute_group_name` |

**Source:** [docs.mageforge.io/eav.php](https://docs.mageforge.io/eav.php) — EAV System Database Tables  
**Source:** [amasty.com Product Attributes](https://amasty.com/blog/why-product-attributes-in-magento-2-are-important) — "catalog_eav_attribute extends eav_attribute for product attributes"

### 3.3 Attribute Options Storage (Dropdown Values)

```sql
-- eav_attribute_option: option entries
option_id  | attribute_id  | sort_order
100        | 42 (brand)    | 1     -- "Nike"
101        | 42 (brand)    | 2     -- "Adidas"

-- eav_attribute_option_value: localized labels (store_id=0 is default)
value_id   | option_id     | store_id  | value
501        | 100           | 0         | "Nike"
502        | 101           | 0         | "Adidas"
```

**Source:** [BelVG How EAV Works](https://belvg.com/blog/how-eav-data-storage-works-in-magento-2.html) — full documentation of dropdown attribute storage

### 3.4 Product Brand Value Storage

Dropdown values are stored in `*_entity_int` because `backend_type = "int"`:

```sql
-- catalog_product_entity_int
value_id  | attribute_id  | store_id  | entity_id  | value
999       | 42 (brand)    | 0         | 123        | 100   -- option_id for "Nike"
```

**Source:** [BelVG How EAV Works](https://belvg.com/blog/how-eav-data-storage-works-in-magento-2.html) — "eav_attribute.backend_type = 'int'"  
**Source:** [meghrajtechnosoft.com](https://www.meghrajtechnosoft.com/magento-2-changing-product-attribute-type/) — "Dropdown value stored in catalog_product_entity_int"

---

## 4. Navigation Menu vs Category Tree

### 4.1 Default: Navigation Menu = Category Tree

By default, Magento's top navigation is **generated directly from the category tree**. Controls:

1. **`include_in_menu`** (Yes/No EAV attribute) — category appears in navigation
2. **`is_active`** (Yes/No) — category is active
3. **`position`** — sibling ordering in menu

**Source:** [BelVG Navigation Menu Guide](https://belvg.com/blog/how-to-create-menu-in-magento-2-step-by-step-instruction.html) — "Magento automatically generates the main navigation menu from your category structure"

### 4.2 Anchor Categories

The **`is_anchor`** attribute controls subcategory product inclusion:

- **Anchor = Yes:** Shows products from all subcategories (recursive) + enables layered navigation
- **Anchor = No:** Only directly assigned products; shows subcategory listing instead

**Implementation:** Uses `catalog_category_product_index` — a flattened index table that includes subcategory products for anchor categories.

**Source:** [Amasty Anchor Category](https://amasty.com/knowledge-base/what-is-the-magento-2-anchor-category.html) — "Magento anchored category contains products assigned to it and all subcategories"  
**Source:** [Magefan Layered Navigation](https://magefan.com/blog/configure-layered-navigation-in-magento-2) — "Enable the Anchor option in the category Display Settings"

### 4.3 Custom Navigation (Beyond Category Tree)

Yes, you can build navigation independent of the category tree:

1. **CMS Block in menu** — Override `default.xml` layout, inject CMS block with custom links
2. **Third-party extensions** — Snowdog Menu, Amasty Mega Menu, NavigationPro — provide their own menu tables and admin UI
3. **Programmatic** — Plugins on `Magento\Theme\Block\Html\Topmenu` to inject custom items

**Source:** [BelVG Navigation Menu Guide](https://belvg.com/blog/how-to-create-menu-in-magento-2-step-by-step-instruction.html) — "Create a Magento menu via an additional CMS block"  
**Source:** [Snowdog Menu (GitHub)](https://github.com/SnowdogApps/magento2-menu) — "feature-rich replacement for the category-based top navigation"

---

## SQL: Category Tree with Product Counts

```sql
SELECT
    c.entity_id,
    c.parent_id,
    c.path,
    c.level,
    c.position,
    cv.value AS name,
    COUNT(cp.product_id) AS product_count
FROM catalog_category_entity c
LEFT JOIN catalog_category_entity_varchar cv
    ON c.entity_id = cv.entity_id
    AND cv.attribute_id = (SELECT attribute_id FROM eav_attribute
                           WHERE attribute_code = 'name' AND entity_type_id = 3)
LEFT JOIN catalog_category_product cp ON c.entity_id = cp.category_id
WHERE c.path LIKE '1/2/%'
GROUP BY c.entity_id
ORDER BY c.level, c.position;
```

---

## Source Index

1. https://docs.mageforge.io/catalog.php — Catalog DB Tables
2. https://docs.mageforge.io/eav.php — EAV System Tables
3. https://docs.magento-opensource.com/developer/guide-explanation-eav-system.html — EAV Architecture
4. https://emmo.net.co/articles/post/how-to-get-category-tree-collection-in-magento-247.html — Category Tree
5. https://scandiweb.com/blog/magento-series-the-eav-model — EAV Model Guide
6. https://belvg.com/blog/how-eav-data-storage-works-in-magento-2.html — EAV Data Storage
7. https://amasty.com/knowledge-base/what-is-the-magento-2-anchor-category.html — Anchor Categories
8. https://belvg.com/blog/how-to-create-menu-in-magento-2-step-by-step-instruction.html — Navigation Menu
9. https://docs.magento-opensource.com/merchant/manage-catalog/tutorial-getting-started-with-manage-product-categories — Category Management
10. https://amasty.com/unique-product-url-for-magento-2.html — Multi-category URLs
