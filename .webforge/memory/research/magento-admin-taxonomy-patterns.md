# Magento (Adobe Commerce) Admin Taxonomy Patterns Research

## Overview
Research conducted 2026-07-18 for Athletica project (football boots e-commerce, Next.js 16, Sanity CMS, Supabase).  
Covers **Area A: Cascading Dropdowns** and **Area B: Graceful Taxonomy Creation** in Magento/Adobe Commerce admin panel.

---

## Area A: Cascading Dropdowns

### A1. Category Selection UI Component

**Primary Component:** `Magento_Catalog/js/components/new-category`  
**Template:** `ui/grid/filters/elements/ui-select`  
**Backend Options Provider:** `Magento\Catalog\Ui\Component\Product\Form\Categories\Options`

The category selector on the product edit form uses a **searchable multi-select tree dropdown** rendered with the `ui-select` UI component. Key characteristics:

- **Tree structure with indentation** — categories are displayed in a hierarchical tree using `optgroup` nesting in the options array. Each parent category's children are nested under `optgroup` key.
- **Checkboxes** — when `showCheckbox` is `true`, each category shows a checkbox for multi-selection.
- **Search/filter** — `filterOptions` (boolean) enables typeahead filtering within the dropdown.
- **Chips** — `chipsEnabled` displays selected items as removable chips/tags.
- **N-level depth** — supports unlimited depth via recursive `optgroup` structure.
- **Multi vs Single** — controlled via the `multiple` boolean property.

**Sources:**
- https://magento.stackexchange.com/questions/149148/magento-2-how-to-add-category-selector-on-admin-form
- https://magento.stackexchange.com/questions/299969/magento-2-multi-select-using-ui-component-in-admin-form
- https://magento.stackexchange.com/questions/270657/drop-down-multi-select-category-ui-component
- https://www.rohanhapani.com/how-to-add-multi-select-ui-dropdown-in-ui-form-in-magento-2/

**XML Configuration Example (from product_form.xml):**
```xml
<field name="category_ids" component="Magento_Catalog/js/components/new-category" formElement="select">
    <argument name="data" xsi:type="array">
        <item name="options" xsi:type="object">Magento\Catalog\Ui\Component\Product\Form\Categories\Options</item>
        <item name="config" xsi:type="array">
            <item name="filterOptions" xsi:type="boolean">true</item>
            <item name="multiple" xsi:type="boolean">true</item>
            <item name="showCheckbox" xsi:type="boolean">true</item>
            <item name="disableLabel" xsi:type="boolean">true</item>
            <item name="levelsVisibility" xsi:type="number">1</item>
            <item name="chipsEnabled" xsi:type="boolean">true</item>
            <item name="elementTmpl" xsi:type="string">ui/grid/filters/elements/ui-select</item>
        </item>
    </argument>
</field>
```

### A2. How the Category Tree is Rendered

The options are provided by `Magento\Catalog\Ui\Component\Product\Form\Categories\Options::toOptionArray()`. This class builds a tree by:

1. Loading all categories from the category collection
2. Building an associative array keyed by `category_id`
3. Nesting children under their parent using the `optgroup` key
4. Returning the nested structure

The key PHP class is `Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Categories` which is registered in `Magento\Catalog/etc/adminhtml/di.xml` as a modifier with sort order 60.

**Category sorting** within the product edit form was historically unsorted (MySQL default order). A fix (PR #36104, merged) added `addAttributeToSort('position')` to respect the category management ordering.

**Source:**
- https://magento.stackexchange.com/questions/183169/how-does-magento-sort-categories-within-the-product-edit-admin-section
- https://github.com/magento/magento2/pull/36104
- https://mage2.pro/t/topic/791

### A3. Category Management Tree (Catalog → Categories)

The category management page uses a **dedicated tree widget** (`jquery/jstree/jquery.jstree`) rendered in `catalog/category/tree.phtml`. Features:
- Expand/collapse all
- Drag-and-drop rearrangement
- Add root/sub category buttons
- Right-click action menu (edit, delete, move up/down)
- "Add to Tree" opens a slide-out panel

**Source:**
- https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Catalog/view/adminhtml/templates/catalog/category/tree.phtml
- https://developer.adobe.com/commerce/admin-developer/pattern-library/displaying-data/tree (Tree Pattern doc)

### A4. Brand/Attribute Selection — Dropdown Attributes

Magento handles attribute dropdowns differently from the category tree:

- **Product attributes** (brand, color, size, etc.) use the standard EAV attribute system.
- The `Catalog Input Type for Store Owner` determines the UI: `Dropdown` (single select), `Multiple Select` (multi-select), `Visual Swatch`, `Text Swatch`.
- **These are NOT cascading/filtering** by default. Magento does NOT implement a "select Category → Brand dropdown filters" pattern natively in the admin product form.
- Attributes are displayed as flat dropdowns populated from the attribute's source model.
- For the frontend layered navigation, attributes can be set as `Filterable (with results)` or `Filterable (no results)` but this affects storefront filtering, not admin forms.

**Source:**
- https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/product-attributes/create/attribute-product-create
- https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/catalog/navigation/navigation-layered

### A5. Cascading Pattern: "Select Category → Brand filters" — [NOT FOUND]

**Finding:** Magento does NOT implement a native cascading dropdown pattern where selecting a category filters the brand dropdown options in the admin product edit form. Each attribute dropdown is independent.

For the **frontend**, the "layered navigation" system supports filtering by multiple attributes simultaneously, but the admin product form shows all attributes statically based on the attribute set, not dynamically filtered by category.

For **frontend cascading product finders**, third-party modules exist (e.g., TonyMerlin/M2-ProductFinder) that implement AJAX-driven intersection filtering for attribute dropdowns on the storefront — but this is not a built-in admin pattern.

**Source:**
- https://github.com/TonyMerlin/M2-ProductFinder (third-party module, not core Magento)

### A6. Admin UI Select Component Summary

| Property | Category Selector | Attribute Dropdown |
|---|---|---|
| Component JS | `Magento_Catalog/js/components/new-category` | `Magento_Ui/js/form/element/ui-select` |
| Template | `ui/grid/filters/elements/ui-select` | `ui/grid/filters/elements/ui-select` |
| Options source | `Magento\Catalog\Ui\Component\Product\Form\Categories\Options` | EAV attribute source model |
| Tree support | Yes (via `optgroup`) | No (flat list) |
| Search/typeahead | Yes (`filterOptions: true`) | Yes (`filterOptions: true`) |
| Multi-select | Yes (`multiple: true`) | Yes (`multiple: true`) |
| Chips | Yes (`chipsEnabled: true`) | Yes (`chipsEnabled: true`) |
| Levels visibility | Configurable (default: 1) | N/A |
| Inline creation | Yes ("New Category" button) | No (uses modal grid) |

**Source:** Multiple Magento StackExchange answers and official devdocs.

---

## Area B: Graceful Taxonomy Creation

### B1. Create New Category On-the-Fly While Creating a Product

**YES — Magento supports inline category creation from the product form.**

The mechanism is:
1. On the product edit form, the category selector has a **"New Category"** button/link.
2. Clicking it opens a **slide-out modal** (`mage.new-category-dialog`) rendered by `Magento_Catalog/js/new-category-dialog.js`.
3. The dialog uses `Magento_Ui/js/modal/modal` with `type: 'slide'`.
4. Fields: Category Name, Parent Category (another tree select).
5. On submit, an AJAX POST request is sent to the category save controller (`Magento\Catalog\Controller\Adminhtml\Category\Save`).
6. On success, the new category is immediately added to the selector and selected.
7. The form stays on the product edit page — no redirect.

**JavaScript source:** `app/code/Magento/Catalog/view/adminhtml/web/js/new-category-dialog.js`

**Key code from new-category-dialog.js:**
```javascript
this.element.modal({
    type: 'slide',
    modalClass: 'mage-new-category-dialog form-inline',
    title: $.mage.__('Create Category'),
    buttons: [{
        text: $.mage.__('Create Category'),
        class: 'action-primary',
        click: function (e) {
            // Validates form, sends AJAX POST to save category
            // On success, triggers 'selectItem' event to add the category
            // to the product's category selector
        }
    }]
});
```

**Sources:**
- https://mage2.pro/t/topic/5527
- https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Catalog/view/adminhtml/web/js/new-category-dialog.js
- https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Catalog/Controller/Adminhtml/Category/Save.php

### B2. Create New Attribute Value Inline

**YES — Magento supports creating attributes while working on a product.**

From the product edit page:
1. Click **"Add Attribute"** button in upper-right corner.
2. A modal/grid appears showing existing attributes with checkboxes.
3. To add a **new attribute (not just a new value)**, click **"Create New Attribute"** within this modal.
4. The attribute creation form opens (same fields as Stores → Attributes → Product).
5. Fill in: Label, Input Type, Values (for dropdown), Properties, Storefront Properties.
6. Click **Save Attribute** — the attribute is created and automatically assigned to the product's attribute set.
7. The new attribute appears on the product form without leaving the page.

**However:** Creating a **new option/value for an existing dropdown attribute** (e.g., adding a new brand name to the "Brand" dropdown) is NOT supported inline during product creation in core Magento. You must go to **Stores → Attributes → Product**, open the attribute, add the new value, and save. Third-party modules (e.g., Best4Mage Easy Inline Attribute Values) fill this gap.

**Sources:**
- https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/product-attributes/product-attributes-add
- https://www.best4mage.com/best4mage-easy-inline-atttribute-values-for-magento-2.html
- https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/product-attributes/create/attribute-product-create

### B3. Duplicate Prevention

**Categories:** Magento does NOT prevent duplicate category names at the database level. The category name is not unique. However, the admin UI shows the full path in the tree, making duplicates visible. When creating a category via the inline "New Category" dialog, the name is validated for required entry but not for uniqueness.

**Attributes:** Magento enforces a **unique Attribute Code** constraint. The attribute code (e.g., `brand`, `color`) must be unique across all product attributes. Attempting to create an attribute with an existing code will throw an error. For attribute **values** (options), there is no enforced uniqueness — the same label can appear multiple times for different option IDs.

**Sources:**
- Magento EAV attribute architecture (attribute_code is unique)
- https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/product-attributes/create/attribute-product-create

### B4. Separate vs Inline Workflows

| Operation | Inline (from product form) | Separate (dedicated page) |
|---|---|---|
| Create category | ✅ Yes — "New Category" slide-out modal | Catalog → Categories |
| Create attribute | ✅ Yes — "Add Attribute" → "Create New Attribute" | Stores → Attributes → Product |
| Add attribute value/option | ❌ No — must go to attribute edit page | Stores → Attributes → Product → [Attribute] → Manage Options |
| Assign attribute to set | ✅ Yes — inline creation auto-assigns | Stores → Attributes → Attribute Set |
| Manage category tree structure | ❌ No — inline only creates leaf categories | Catalog → Categories (full tree with drag-drop) |

### B5. "Create New Category" UX Flow (Step-by-Step)

1. User is on product edit/create page
2. User clicks the category field (or "New Category" link)
3. A **slide-out panel** opens from the right side of the screen
4. Panel shows:
   - "Create Category" title
   - "Name" text input
   - "Parent Category" tree selector (same ui-select component)
   - "Create Category" button (primary action)
5. User fills in name, optionally changes parent
6. Form validates (name is required)
7. AJAX POST to `Magento\Catalog\Controller\Adminhtml\Category\Save`
8. On success:
   - The modal closes
   - The new category appears selected in the product's category list
   - The category is immediately saved to the database
9. On error: Error messages display within the modal

### B6. UI Components Reference Table

| Component | Path/Class | Usage |
|---|---|---|
| ui-select | `Magento_Ui/js/form/element/ui-select` | Base select with search, chips, tree |
| new-category | `Magento_Catalog/js/components/new-category` | Category-specific selector with "New Category" button |
| new-category-dialog | `Magento_Catalog/js/new-category-dialog.js` | Slide-out modal for creating categories inline |
| Categories Options | `Magento\Catalog\Ui\Component\Product\Form\Categories\Options` | PHP options provider for category tree |
| Categories Modifier | `Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Categories` | PHP modifier injecting category field into product form |
| Tree Pattern | Adobe Commerce Admin Pattern Library | Category management page tree (jstree-based) |
| Modal | `Magento_Ui/js/modal/modal` | Slide/ popup modal for inline forms |

**Source:**
- https://developer.adobe.com/commerce/admin-developer/pattern-library/displaying-data/tree
- https://commerce-docs.github.io/devdocs-archive/2.0/guides/v2.0/pattern-library/displaying-data/tree/tree.html

---

## Key Findings Summary

### For Athletica Design Decisions

1. **Category selector should be a searchable tree** with checkboxes for multi-select (like Magento's `ui-select` with `optgroup` nesting).
2. **Category → Brand → Model cascading dropdowns are NOT a Magento admin pattern.** Magento treats each attribute independently. If Athletica wants cascading, it's a custom feature.
3. **Inline taxonomy creation IS supported** for categories (via slide-out modal + AJAX) and attributes (via modal grid). Adding new values to existing attributes is NOT supported inline.
4. **Duplicate prevention** is weak in Magento — enforced only for `attribute_code`, not for category names or option labels.
5. **The key JS components** are `Magento_Ui/js/form/element/ui-select` (general) and `Magento_Catalog/js/components/new-category` (category-specific with inline creation).
6. **Magento's architecture** uses a **Pool of Modifiers** (`Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Pool`) to inject fields into the product form via `modifyMeta()` and `modifyData()` methods.
