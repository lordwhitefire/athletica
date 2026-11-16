# Athletica Admin UX Improvements — Design Proposal

**Date:** 2026-07-19  
**Author:** Probe-Beacon (Intelligence Team)  
**Status:** Research Complete — Ready for Athena Compilation

---

## Part B: Proposed UX Improvements

Each improvement is keyed to the pain points identified in the current admin system (source: codebase analysis of `NavigationEditor.tsx`, `ModelInput.tsx`, `ProductForm.tsx`, `AutoSuggest.tsx`, `navigation.json`, `BrandForm.tsx`).

### Improvement B1: Dedicated Category Tree Page (`/admin/categories`)

**Pain Point Addressed:** #2 (Navigation = Category Tree confusion) + #3 (Manual level numbers)

**What Changes:**
- Extract all category hierarchy data from `navigation.json` into a new, standalone category tree data structure.
- Create a new admin route at `/admin/categories` with its own dedicated editor page.
- The navigation menu editor at `/admin/navigation` becomes a **thin flat list** — each nav item simply references a category ID or custom URL — it no longer holds the category tree.
- Category tree items no longer store `customLinks`, `sizeLinks`, `bottomLinks`, `featuredImage`, `disabled`, or `slug` — these are navigation-specific fields that don't belong on categories.

**How It Benefits the Admin:**
- **Separation of concerns**: Category editors manage product taxonomy; navigation editors manage site menus. These are different jobs with different interfaces.
- **Level auto-calculation**: The tree structure inherently determines depth — no manual `level` number needed. Move a category, its depth updates automatically.
- **Simpler data model**: Categories become `{ id, name, parentId, order, image }` — 5 fields instead of 12+.
- **Navigation becomes simpler**: Each nav item is just `{ label, categoryRef | customUrl, order }` — 3 fields.

### Improvement B2: Simplified Navigation Menu Editor

**Pain Point Addressed:** #1 (Navigation Editor overload) + #3 (Manual level numbers)

**What Changes:**
- Replace the recursive tree editor (277 lines) with a flat, drag-and-drop list.
- Each nav item shows only: **Label** + **Link** (dropdown of categories, or custom URL input).
- Remove all `customLinks`, `sizeLinks`, `bottomLinks` sub-array editors — these were mega-menu UI elements that should be managed separately or removed entirely.
- Remove `level`, `description`, `slug`, `featuredImage`, `id` (nav items can use auto-generated keys).
- Sub-navigation (dropdown menus) is shown as indented rows below the parent item, not as nested trees.
- Drag handles on the left of each row for reordering.

**How It Benefits the Admin:**
- Drastically fewer fields: from ~8-12 per item down to 3 (label, link, order).
- No recursive tree = no accidental nesting errors.
- Drag-and-drop is familiar from every modern CMS (Shopify, WordPress, Sanity).
- Indentation visually communicates hierarchy without needing a `level` number.
- Admins can focus on **what links go in the nav** rather than **how the tree is structured**.

### Improvement B3: Category Tree Picker in Product Form

**Pain Point Addressed:** #4 (Category as free-text autocomplete) + #7 (No inline category creation)

**What Changes:**
- Replace the `AutoSuggest` category field with a **tree picker component** that shows the full category hierarchy.
- The picker displays a breadcrumb path as the admin navigates the tree: e.g., "Football Boots > Adidas > Predator".
- Selected category shows as a breadcrumb string, not just a flat name.
- Add an **"Add New Category"** button next to the picker that opens a modal/dialog inline (no page navigation).
- The modal has fields: Name, Parent (tree picker), Order, Image — the same fields from B1's edit panel.

**How It Benefits the Admin:**
- **Tree context**: Admins see *where* a category lives in the hierarchy, not just its name.
- **Prevents errors**: No more selecting "Predator" when you meant the Puma one, not Adidas — the breadcrumb disambiguates.
- **Inline creation**: Add a subcategory (e.g., "Mercurial Vapor" under "Nike > Mercurial") without leaving the product form.
- **Consistency**: Same tree picker component used in both `/admin/categories` and the product form.

### Improvement B4: Inline Brand Creation Modal

**Pain Point Addressed:** #6 (Brand as separate admin page)

**What Changes:**
- Keep the brand dropdown in the product form, but add an **"+ Add New"** button to the right of the dropdown.
- Clicking "+ Add New" opens a **modal overlay** with two fields: Brand Name + Logo Upload.
- On submit, the modal calls the brand creation API, closes, and the new brand is selected in the dropdown automatically.
- No page navigation required — the admin stays on the product form.

**How It Benefits the Admin:**
- No context switching: create a brand in seconds without leaving the product form.
- Immediate feedback: new brand appears in the dropdown and is auto-selected.
- Reduces the number of open browser tabs / navigation steps from 5 (current) to 1.

### Improvement B5: Simplified Model Picker

**Pain Point Addressed:** #5 (C/T segment builder)

**What Changes:**
- Replace the `ModelInput` component (252 lines, cryptic C/T builder) with a simpler two-level picker.
- **Level 1: Category** — a tree picker (same component from B3) to select the product's category (e.g., "Football Boots > Adidas > Predator").
- **Level 2: Subcategory / Variant** — a dropdown of sub-items within the selected category (e.g., "Pro FG", "League MG", "Elite FT FG").
- The model string is auto-generated from the two selections: `"{Category} / {Variant}"`.
- No C/T badges, no color-coded segments, no cryptic path syntax.
- The picker validates that a variant is selected (can't leave the category empty).

**How It Benefits the Admin:**
- **No learning curve**: Anyone who understands "pick a category, then pick a variant" can use it.
- **Eliminates the C/T confusion**: No need to understand the Classification vs Type distinction.
- **Shorter code**: ~50 lines instead of 252 for the same functionality.
- **Reuses the tree picker**: Consistent UI component across the admin.

---

## Part C: Wireframe Descriptions

### C1: Category Tree Page (`/admin/categories`)

**Layout:** Two-panel split (70/30 or 60/40), left panel = tree, right panel = edit form.

#### Left Panel — Category Tree
- **Top toolbar**: full-width bar with:
  - Page title "Categories" (left-aligned)
  - "Add Root Category" button (right-aligned, solid primary color)
- **Tree view**: collapsible tree with the following visual treatment:
  - Each row shows: expand/collapse chevron (if has children) → folder icon → category name → item count badge (number of products)
  - Indentation increases 24px per level
  - Maximum depth visually indicated by diminishing font weight (level 1 bold, level 4 regular)
  - Selected row has a highlighted background (accent color with 20% opacity)
  - Drag handle on the left edge of each row (6 dots icon) for reordering siblings
  - Right-click context menu: "Add Child", "Rename", "Delete", "Move Up/Down"
- **Search bar** (optional, below toolbar): filters tree in real-time as admin types, showing matching nodes with their breadcrumb paths

#### Right Panel — Edit Form
- Shown when a category is selected in the tree. If no category selected, shows a placeholder: "Select a category to edit".
- Form fields:
  - **Name** (text input, required) — the category display name
  - **Parent** (tree dropdown) — shows full tree hierarchy, allows reparenting. Root categories show "(No parent)"
  - **Order** (number input) — sort position among siblings
  - **Image** (image selector, optional) — category hero/thumbnail image
  - **URL Slug** (auto-generated from name, editable) — SEO-friendly path
- **Action toolbar** at bottom of form:
  - "Save Changes" button (primary)
  - "Delete Category" button (red, with confirmation dialog: "Are you sure? This will also delete X child categories and reassign Y products.")
  - "Cancel" button (secondary)

#### User Flow
1. Admin navigates to `/admin/categories`
2. Tree loads with all root categories collapsed (or remembers last state)
3. Admin clicks a category → right panel shows edit form pre-populated
4. Admin edits fields → "Save Changes" button becomes active (dirty state)
5. Admin clicks "Save" → tree updates in real-time, success toast appears
6. Admin clicks "Add Root Category" → new blank edit form appears, name field focused
7. Admin drags a row to reorder → order numbers auto-update, save button appears

### C2: Simplified Navigation Menu Editor

**Layout:** Single-column flat list with drag handles, link picker per item.

#### Page Header
- Title: "Navigation Menu"
- "Save Changes" button (top right) — only active when changes are pending
- "Preview" button — opens the frontend navigation in a new tab
- Unsaved changes indicator: amber dot next to "Navigation Menu" title

#### Item List
- Each row = one navigation item, displayed as a horizontal card
- Row layout (left to right):
  - **Drag handle** (6 dots, `≡`) — on hover shows `grab` cursor
  - **Expand chevron** (if item has sub-items) — toggles visibility of indented children below
  - **Label** (text input, auto-grows with content) — the nav link text
  - **Link type toggle** — small pill button: "Category" | "Custom URL"
  - **Link value** (conditional):
    - If "Category": dropdown select showing the full category tree (hierarchical with indentation: "Boots > Adidas > Predator")
    - If "Custom URL": text input with `/` prefix, with AutoSuggest for existing routes
  - **Delete button** (trash icon, red on hover)
- **Row hover**: subtle background highlight, drag handle becomes visible if hidden
- **Indentation**: sub-items are indented 32px from parent, with a thin vertical line connecting parent → child on the left edge
- **Drop zone**: when dragging, a horizontal line appears where the item will land; items smoothly animate to new positions

#### Bottom Toolbar
- "Add Menu Item" button (outline style) — appends a new row to the end of the list
- "Add Dropdown Item" button — adds a new child to the currently selected/hovered item

#### Link Picker (Category dropdown)
- Dropdown shows full category tree with indentation and folder icons
- Item format: `📁 Boots > 📁 Adidas > 👟 Predator`
- Search bar at top of dropdown for filtering
- "No category selected" = placeholder text: "Select a category..."
- Selected category shows full breadcrumb, e.g., "Boots > Adidas > Predator"

#### User Flow
1. Admin opens `/admin/navigation`
2. Sees a flat list of 3-10 items (Boots, Multi-Stud Boots, Indoor)
3. Clicks a row's link picker → selects "Boots > Adidas > Predator" from the category tree dropdown
4. Admin drags "Indoor" above "Multi-Stud Boots" → positions swap with animation
5. Admin clicks "+" on "Boots" → new child row appears indented below
6. Admin submits "Save Changes" → app validates that all links resolve to valid categories or URLs

### C3: Updated Product Form

**Layout:** Same form structure as current `ProductForm.tsx` but with three key field replacements.

#### Category Field — Tree Picker with Breadcrumb

**Before:** Free-text input with AutoSuggest (prone to ambiguity and errors).

**After:** 
- A text box that looks like a read-only input with a dropdown arrow, showing the selected category's full breadcrumb:
  - `[📁 Football Boots > Adidas > Predator] ▼`
- Clicking the box opens a **tree picker popover**:
  - Left panel: collapsible tree (same as C1 left panel, but compact — no edit form)
  - Right panel: category path display (read-only breadcrumb trail)
  - Bottom: "Select" button (disabled until a leaf category is chosen)
- Selected category displays as a breadcrumb in the product form, e.g.:
  `🏷️ Football Boots > Adidas > Predator`
- **"Add New Category" button**: small "+" button to the right of the picker
  - Clicking opens a **modal dialog** with:
    - Name (text input)
    - Parent (tree picker dropdown, pre-filled with the currently selected category if any)
    - Order (number input, pre-filled with next available)
    - Image (optional, image selector)
  - On submit: modal API call → new category created → tree picker refreshes → new category is auto-selected
  - The admin never leaves the product form

#### Brand Field — Dropdown with Inline Add

**Before:** Plain `<select>` with options fetched on mount, no "Add New" capability.

**After:**
- Enhanced dropdown with two sections:
  - **Select a brand** (scrollable list of existing brands, each with tiny logo thumbnail)
  - **Separator line**
  - **"+ Add New Brand"** (highlighted row, always at bottom)
- When "+ Add New Brand" is clicked:
  - **Modal appears** (centered overlay, 400px max-width)
  - Fields: Brand Name (text, required), Logo Upload (image selector)
  - "Create" button + "Cancel" button
  - On success: modal closes → new brand appears in dropdown → auto-selected
  - On failure: error message in modal, form stays open
- Brand logo thumbnail (32x32) shown next to selected brand name in the closed dropdown

#### Model Field — Simplified Category + Subcategory Picker

**Before:** The C/T builder (`ModelInput.tsx`, 252 lines) with cryptic segment chips.

**After:**
- Two linked dropdowns:
  - **Category** (tree picker, same component from Category field above) — selects the product's parent category
  - **Subcategory/Variant** (dropdown) — populated based on the selected category
    - Shows sub-items from the category tree at the next level
    - Initially disabled until a category is selected
- Storage format: auto-generates model string as `"{Category} > {Subcategory}"` or `"{Category}/{Subcategory}"` depending on the URL schema
- **Visual feedback**:
  - When category is selected, the subcategory dropdown animates in with the available options
  - Selected combo shows as: `📁 Football Boots > Adidas > Predator / Pro FG`
  - Clear "(X)" button to reset the selection
- **Validation**: both category and subcategory must be selected before the product can be saved
- The model string (e.g., "Football Boots/FG/Mercurial Vapor/FG-Elite/FG") is auto-generated internally — the admin never sees or edits raw path segments

#### User Flow (Creating a New Product)
1. Admin navigates to `/admin/products/new`
2. Fills in images, pricing, description as before (these don't change)
3. Reaches **Category** field → clicks tree picker → navigates "Football Boots > Adidas > Predator" → clicks "Select"
4. Notices the brand they need doesn't exist → clicks "+ Add New Brand" → modal opens → enters "Umbro" + uploads logo → submits → modal closes → "Umbro" auto-selected in dropdown
5. Reaches **Model** field → Category dropdown already populated → selects subcategory "Pro FG" from second dropdown → model auto-generates
6. Submits form → all related data saved (product + new brand, no redirects needed)

---

## Implementation Notes for Build Team

### New Components Required
| Component | Description | Refs |
|-----------|-------------|------|
| `TreePicker` | Reusable tree hierarchy picker with search | Used in C1, C2, C3 |
| `CategoryTreePage` | Full admin page with tree + edit panel | C1 |
| `NavMenuEditor` | Flat drag-and-drop nav list | C2 |
| `InlineBrandModal` | Modal for quick brand creation | C3 |
| `ModelPicker` | Category + subcategory two-level picker | C3 replaces ModelInput |
| `BreadcrumbDisplay` | Renders "Parent > Child > Item" path | Used across all proposals |

### Components to Deprecate
- `ModelInput.tsx` — replaced by `ModelPicker`
- `AutoSuggest.tsx` (for category field) — replaced by `TreePicker`

### Components to Modify
- `ProductForm.tsx` — replace Category AutoSuggest and ModelInput
- `NavigationEditor.tsx` — rewrite as `NavMenuEditor` (simplified)
- `BrandForm.tsx` — keep for full brand management, but add modal entry point

### Data Model Changes
- **Categories** become a separate collection (currently embedded in navigation.json)
- **Nav Menu Items** reference categories by ID instead of containing full tree
- **Products** store `category_ref` (ID) instead of free-text `category` string
- **Brands** — no structural change, just UI improvement
