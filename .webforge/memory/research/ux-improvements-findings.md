# UX Improvements Research Findings — Athletica Navigation Admin

## Current Codebase Analysis

### Source Files Examined

| File | Path | Lines | Key Observations |
|------|------|-------|-----------------|
| NavigationEditor.tsx | `src/components/admin/NavigationEditor.tsx` | 277 | Tree-based editor with nested children, customLinks, sizeLinks, bottomLinks, manual `level` field |
| ModelInput.tsx | `src/components/admin/ModelInput.tsx` | 252 | C/T builder requiring Classification vs Type understanding |
| ProductForm.tsx | `src/components/admin/ProductForm.tsx` | 698 | Category = free-text AutoSuggest, Brand = dropdown with no inline creation |
| AutoSuggest.tsx | `src/components/admin/AutoSuggest.tsx` | 125 | Generic autocomplete with debounced fetch |
| BrandForm.tsx | `src/app/admin/brands/new/BrandForm.tsx` | 118 | Separate form at `/admin/brands/new`, no inline modal |
| navigation.json | `frontend/data/navigation.json` | ~2000+ | Single document mixing nav menu items with category tree (levels 1-4) |
| nav-seed.json | `frontend/scripts/nav-seed.json` | ~2000+ | Sanity CMS seed data — same structure as navigation.json |
| brands.json | `frontend/data/brands.json` | 38 | 6 brands (Adidas, Joma, Mizuno, New Balance, Nike, Puma) with logos |
| admin navigation page | `src/app/admin/navigation/page.tsx` | 7 | Thin wrapper loading NavigationEditor |

### Pain Point 1: Navigation Editor Overload

**Evidence** (NavigationEditor.tsx lines 106-277):
- Each `NavTreeItem` component renders: label, href (AutoSuggest), description, children (recursive), customLinks[], sizeLinks[], bottomLinks[]
- `addChild()` (line 132) creates items with `{ id, level, label, href, children }` — 5 fields minimum
- `addLinkTo()` (line 147) creates links with `{ label, href, description }` — 3 fields
- Three separate sub-link arrays: customLinks, sizeLinks, bottomLinks — each with their own add/update/remove logic
- Total surface area: ~277 lines for what should be a simple list editor

**Data structure** (navigation.json):
```
items[].children[].children[].children[]  (4 levels deep)
items[].customLinks[]    (promo links)
items[].sizeLinks[]      (size navigation)
items[].bottomLinks[]    (footer-adjacent links)
```

### Pain Point 2: Navigation = Category Tree Confusion

**Evidence** (navigation.json lines 5-715):
- Top level: "Boots" (id: 1-285), "Multi-Stud Boots" (id: 1-1442), "Indoor" (id: 1-196)
- Level 1 items (Boots) contain level 2 items (Adidas, Nike, Puma) which contain level 3 items (Predator, Mercurial) which contain level 4 items (Superfly, Vapor)
- This is a **product category hierarchy** being used as the site navigation menu
- The same items have both `children` (category tree) and `customLinks`/`sizeLinks`/`bottomLinks` (navigation-specific UI elements)
- Items like "Cleated", "Surface", "Range", "Upper" have `"disabled": true` — they exist as categories but shouldn't be nav items
- The `level` field (1-4) is manually set and must be numerically correct or the tree display breaks

### Pain Point 3: Manual Level Numbers

**Evidence** (NavigationEditor.tsx line 133):
```typescript
const newChild = { id: generateId(), level: (item.level as number || 0) + 1, label: "", href: "/", children: [] };
```
- Level is manually incremented by adding +1 to parent level
- If an item is moved, its level must be manually updated
- No auto-calculation of level from tree position
- No validation that levels form a valid tree (no gaps, no cycles)

### Pain Point 4: Category as Free-Text Autocomplete

**Evidence** (ProductForm.tsx lines 382-398):
```typescript
<AutoSuggest name="category" label="Category" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestCategories} />
```
- Admin types text → API fetches matching suggestions → they select one
- No tree view — no way to see that "Football Boots > Adidas > Predator" is the full path
- No parent context — admin might type "Predator" and get it without knowing which brand's Predator
- No visual breadcrumb of the category hierarchy
- No validation that the category exists in the tree

### Pain Point 5: C/T Segment Builder (ModelInput)

**Evidence** (ModelInput.tsx lines 162-251):
- Forces admin to understand "C=Classification" vs "T=Type" distinction
- Color-coded chips: blue for C, amber for T
- Tooltip explains: "C=Classification (category), T=Type (specific product). Build your model by selecting classifications first, then end with a product type."
- Example: "Football Boots/FG/Mercurial Vapor/FG-Elite/FG" — this is cryptic
- Validation: model must end with a T (type) segment or it shows error
- Backspace deletes last segment — discoverable but not intuitive
- Suggestion dropdown shows C/T badges — adds cognitive load
- 252 lines of complexity for what should be a category+subcategory picker

### Pain Point 6: Brand as Separate Admin Page

**Evidence**:
- BrandForm.tsx at `src/app/admin/brands/new/BrandForm.tsx` — separate route
- `src/app/admin/brands/[id]/edit/page.tsx` — separate edit route  
- `src/app/admin/brands/page.tsx` — separate listing page
- In ProductForm.tsx (lines 281-304), the brand field is a simple `<select>` dropdown with no "Add New" button
- To add a brand: admin must navigate away from product form → /admin/brands/new → fill form → submit → navigate back to product form
- Brand options are fetched once on mount (`getAllBrandsAdmin`, line 151)

### Pain Point 7: No Inline Category Creation

**Evidence**:
- Category uses AutoSuggest (line 391) — only picks from existing suggestions
- No "Add New Category" button in the product form
- No modal/dialog for inline category creation
- To add a category: must use the navigation editor (which is overloaded with nav data) or direct data manipulation
- Categories are implicitly created by adding nav tree items — there's no dedicated category creation flow

## Summary of Findings

The current admin system has a single `navigation.json` document serving dual purpose: (1) site navigation menu and (2) product category hierarchy. This creates confusion because:

1. The navigation editor is forced to show all category tree fields PLUS all navigation-specific fields
2. The product form's category picker (AutoSuggest) has no tree context
3. The model builder (ModelInput) duplicates category hierarchy logic in a cryptic C/T format
4. Brands and categories have no inline creation flow

**Key metrics**:
- NavigationEditor.tsx: 277 lines — the most complex admin component
- ModelInput.tsx: 252 lines — second most complex, with confusing UX
- navigation.json: ~2000+ lines as a single document
- Level field must be manually maintained across 100+ items
