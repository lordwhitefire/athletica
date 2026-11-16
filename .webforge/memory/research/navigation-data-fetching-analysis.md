# Navigation Data Fetching & Model Tree Building — Analysis

## Source Files Analyzed
- `athletica/frontend/src/lib/getNavigation.ts` (261 lines)
- `athletica/frontend/src/lib/rebuild-nav-urls.ts` (35 lines)
- Supporting: `types/navigation.ts`, `lib/api-types.ts`, `lib/model.ts`, `types/product.ts`
- Consumer: `app/api/webhooks/sanity-navigation/route.ts`
- Data: `frontend/data/navigation.json`

---

## Part 1: getNavigation.ts Analysis

### 1.1 Function Signatures (All Exported Functions)

| Function | Signature | Purpose |
|---|---|---|
| `getNavigation` | `() => Promise<ApiResult<NavigationData[]>>` | Main fetch: reads `data/navigation.json`, returns typed nav tree |
| `getNavItemBySlug` | `(slug: string) => Promise<ApiResult<NavigationData \| undefined>>` | Find a nav group by its `_key`/slug |
| `flattenNavigation` | `(items: NavItem[]) => NavItem[]` | Recursive tree flatten (depth-first) |
| `findNavItemByHref` | `(href: string) => Promise<ApiResult<NavItem \| undefined>>` | Find ANY nav item anywhere in tree by href |
| `getBreadcrumbs` | `(href: string) => Promise<ApiResult<NavItem[]>>` | Build breadcrumb trail by walking up tree to match href |
| `getModelNavTree` | `() => Promise<ApiResult<ModelNavNode[]>>` | Extract product model nodes (level ≥ 3) as merged tree |
| `getMainCategoryHref` | `() => Promise<string>` | Returns first non-disabled level-1 item's href |
| `getMainCategoryLabel` | `() => Promise<string>` | Returns first non-disabled level-1 item's label |
| `getBrandCategoryHref` | `(brand: string) => Promise<string \| null>` | Find brand's category href by name match |
| `getProductCategoryHref` | `(product: Product) => Promise<string>` | Build full `/en/id1/id2/id3` path for a product |
| `getTractionCategoryHref` | `(traction: string) => string` | Returns `/en/traction/{slugified-traction}` |

### 1.2 Data Flow: Fetch → Transformation → Rendering

```
Start: fetchNavigationData()
  └─ cache() — React.cache memoization (singleton per request)
  └─ fs.promises.readFile("data/navigation.json", "utf-8")
  └─ JSON.parse(raw)
  │
  ▼
getNavigation()
  └─ Calls fetchNavigationData()
  └─ Maps raw items → NavigationData[]
     - item.id / item._key
     - item.level
     - item.slug = item._key
     - item.label
     - item.href
     - item.children → transformNavItems() recursive pass
  └─ Wraps in ApiResult via ok()/fromCaughtError()
  │
  ▼ (Each consumer calls getNavigation(), which hits the cache)
  │
  ├─ getNavItemBySlug() → filters by slug → single item
  ├─ findNavItemByHref() → flattenNavigation() → linear scan → match by href
  ├─ getBreadcrumbs() → recursive tree search → collect ancestors
  ├─ getModelNavTree() → filter level≥3, merge → ModelNavNode[]
  ├─ getMainCategoryHref/Label → findFirstL1() → returns first active level-1
  ├─ getBrandCategoryHref() → findDescendant() by brand name
  ├─ getProductCategoryHref() → walk: category→brand→model segments
  │
  ▼ (Rendering consumers — from grep results)
  ├─ app/layout.tsx — renders nav in site header
  ├─ app/[...slug]/page.tsx — category/product pages
  ├─ app/not-found.tsx — fallback nav
  ├─ components/ui/Footer.tsx — store link in footer
  ├─ app/search/page.tsx — fallback nav links
  ├─ app/cart/page.tsx — fallback nav links
  ├─ app/checkout/page.tsx — fallback nav links
  ├─ app/account/page.tsx — fallback nav links
  └─ admin pages via getModelNavTreeAction()
```

### 1.3 getModelNavTree() — The level < 3 Filter

**The critical function (lines 112-158):**

```typescript
function buildTree(items: NavItem[]): ModelNavNode[] {
    for (const item of items) {
        if (item.level < 3) {
            // SKIP item — recurse into children only
            nodes.push(...buildTree(item.children));
            continue;
        }
        // level >= 3: COLLECT as model node + recurse
        nodes.push({ label, children: item.children ? buildTree(item.children) : [] });
    }
}
```

**What it does:**

| Level | Role in Nav Tree | In Model Tree? |
|---|---|---|
| 0 | Root navigation groups (e.g., "Shop") | **Skipped** — recurse into children |
| 1 | Categories (e.g., "Boots", "Shoes") | **Skipped** — recurse into children |
| 2 | Brands (e.g., "Adidas", "Puma") | **Skipped** — recurse into children |
| 3 | **Models** (e.g., "Predator", "X", "F50") | **Collected** — included as top-level model nodes |
| 4+ | Sub-models/variants | **Collected** — included as children of model nodes |

**After building, a merge step (lines 143-155) deduplicates by label:**
If two items have the same `label` at the model level (e.g., "Predator" appearing under both "Football Boots" and "Shoes"), their children are merged. This produces a flat, deduplicated list of all model names.

**This reveals:** Level 3 is the boundary between "navigation structure" (levels 0-2) and "product model data" (levels 3+). The nav tree is not just a menu — it's a product data classification system.

### 1.4 Architecture Insight: Navigation Tree = Product Category Tree

The nav tree serves **three simultaneous purposes**:

1. **Mega-menu structure** (levels 0-2): Root groups → Categories → Brands. Rendered as the main site navigation with dropdown menus, featured images, customLinks, sizeLinks, bottomLinks.

2. **Product category hierarchy** (level 3+): Model names like "Predator", "X" are the deepest level of browseable category paths. The `getProductCategoryHref()` function walks through category → brand → model to build the full URL path.

3. **Model/type filter system**: `getModelNavTree()` extracts level 3+ nodes into a standalone model tree used by admin `ProductForm.tsx` and `ModelInput.tsx` for model selection when editing products. The `TRACTION_CODES` array ("FG", "AG", "MG", "SG", "TF", "IC", "HG") on line 160 also hints at another dimension (traction/soleplate type) handled separately via `getTractionCategoryHref()`.

**Evidence of the dual-use pattern:**
```typescript
// line 230-241 in getProductCategoryHref:
// The function walks through nav tree levels:
ids.push(l1.id);      // level 1 = category
ids.push(l2.id);      // level 2 = brand
// level 3+ = model segments
for (const seg of modelSegments) {
    const match = currentItems.find(
        (item) => item.level >= 3 && slugify(item.label) === segSlug
    );
```

This means the product URL structure is: `/en/{categoryId}/{brandId}/{modelSegment1}/{modelSegment2}/...`

And `rebuildNavUrls` reconstructs these paths as `/en/{id}/{id}/{id}...` based on the tree structure.

### 1.5 Dependencies (Imports & Types)

| Import | From | Used For |
|---|---|---|
| `cache` | `react` | Memoize `fetchNavigationData` (single-flight per request) |
| `fs`, `path` | `node:*` | Read `data/navigation.json` at runtime |
| `splitModel` | `@/lib/model` | Split product model strings (e.g., "Predator/FG" → ["Predator", "FG"]) |
| `NavigationData, NavItem, NavLink` | `@/types/navigation` | Core types for nav tree nodes |
| `ApiResult` | `@/lib/api-types` | Result wrapper: `{ data: T, error: null }` or `{ data: null, error: E }` |
| `Product` | `@/types/product` | Product type used by `getProductCategoryHref()` |
| `ok, fromCaughtError` | `@/lib/api-types` | Construct success/failure results |
| `slugify` | `@/lib/rebuild-nav-urls` | Used in `getProductCategoryHref()` for label comparison |

**External data dependency:** `frontend/data/navigation.json` — a local copy fetched from Sanity CMS (populated by Sanity webhook — see below).

---

## Part 2: rebuild-nav-urls.ts Analysis

### 2.1 What URLs Are Being Rebuilt?

The `rebuildNavUrls()` function (lines 11-24) takes a nav tree and reconstructs every `href` using the **ID-based pattern**:

```
href = /en/{id1}/{id2}/{id3}/...
```

Where each segment is a nav item's `id` (or a generated random 6-char ID if missing).

**Example:** Given this tree structure:
```
Level 0: { id: "k-64" }
Level 1: { id: "k-65", label: "Boots" }
Level 2: { id: "2-286", label: "Adidas" }
Level 3: { id: "3-2897", label: "Predator" }
```

Result: `/en/k-64/k-65/2-286/3-2897`

The function:
1. Walks the tree recursively
2. Collects `parentIds` array (ancestor IDs)
3. Builds `href` as `/en/{segments.join("/")}`
4. Assigns a generated ID (via `Math.random().toString(36).substring(2, 8)`) if `item.id` is missing

The `hasCorrectUrls()` function (lines 26-34) validates that all existing hrefs match this pattern.

### 2.2 Why Is URL Rebuilding Needed? (Fragility Analysis)

The Sanity webhook at `app/api/webhooks/sanity-navigation/route.ts` reveals **why**:

```typescript
// 1. Sanity publishes navigation changes
// 2. Webhook receives "navigation" document type
// 3. Fetches the live doc from Sanity: adminClient.fetch(`*[_type == "navigation"][0]{_id, items}`)
// 4. Checks: hasCorrectUrls(doc.items)?
// 5. If URLs are stale: rebuildNavUrls(doc.items)
// 6. Patches the Sanity document: adminClient.patch(doc._id).set({ items: rebuilt }).commit()
```

**Root cause of fragility:** The nav items in Sanity can have their `href` set to `null` or stale values. The navigation tree's canonical URL form depends on the hierarchical ID structure — not on editor-set paths. After any structural change (adding, removing, reordering items), the URLs need to be recalculated.

**Specific fragility points:**

1. **ID generation instability**: If an item lacks an `id`, a random ID is generated via `Math.random()`. This means the same item could get different IDs on different runs, producing different URLs.

2. **Post-publish fixup**: The webhook patches the Sanity document AFTER publish. This means there's a brief window where the published nav has incorrect/empty URLs until the webhook completes.

3. **No URL persistence in primary data source**: URLs are computed from tree structure, not stored as first-class data. Every rebuild re-derives them.

4. **Dual-write risk**: The webhook updates Sanity, but the frontend reads from a local `data/navigation.json` file. If the local file lags behind the Sanity webhook update, the frontend uses stale URLs.

5. **Random ID on missing id**: Line 13: `const itemId = item.id || generateId()` — if a Sanity editor adds a new nav item without an ID (possible in older documents or import scripts), it gets an ephemeral random ID that won't match the next rebuild.

6. **Brittle slug-based matching**: The `getProductCategoryHref()` function uses `slugify(item.label)` to match nav items by label text. If a label changes, the match fails silently, returning `"/"`.

---

## Summary: Architecture Implications

The current architecture embeds product classification data inside the navigation tree. This creates a tight coupling between:
- **Site navigation UI** (mega menus, headers, footers)
- **Product categorization** (category → brand → model hierarchy)
- **URL routing** (path segments are nav item IDs)

Any change to the navigation structure (reordering, renaming, adding/removing items) can potentially break product URLs, breadcrumbs, model selection in admin forms, and brand-to-category mappings. The URL rebuild webhook is a band-aid that partially mitigates this, but the fundamental coupling remains.

**Evidence of the coupling pattern throughout the codebase:**
- `app/[...slug]/page.tsx` imports 5 functions from `getNavigation.ts`
- `components/admin/ProductForm.tsx` imports `getModelNavTreeAction()` for model dropdowns
- `components/admin/ModelInput.tsx` imports `ModelNavNode` type
- `lib/actions/navigation.ts` wraps `getModelNavTree()` as a server action
- `app/admin/navigation/page.tsx` uses `getNavigationDoc()` which calls `rebuildNavUrls()`
