# ARCH-11 — Product-model hierarchy implementation (Excel import FIRST)

You are rebuilding the catalog's backbone so every branch ends in exactly one buyable product, and upgrading the Import Center to accept Excel — in that order. This is the biggest structural change since the original import; treat it with corresponding care. **Rounds 2–3 (admin pages become server components + storefront nav/logo/menu redesign) follow Parts 1–2 in the same build sprint — see bottom of this file.**

## Execution order (OWNER RULING 2026-08-24 — read carefully)

1. **Build ARCH-REC-007 Fix Round 4 first** (see `openspec/tasks/ARCH-REC-007/task.md` → Fix Round 4).
2. **Then start THIS task**: Part 1 (Excel import) → Part 2 (product-model hierarchy).
3. **Then ROUND 2 of this task** (bottom of this file): all admin data pages become server components.
4. **Then ROUND 3 of this task** (bottom of this file): homepage navigation redesign — category-only top nav, cascading flyout menu, site logo fix.
5. **NO testing in between.** After ALL of the above is built, ONE tester session runs REC-007's `§T15` checks plus this task's tests in a single combined pass. Do not wait for or request interim test rounds.

> **STATUS (2026-08-24):** Steps 1–2 DONE. **Round 2 ⏳ CURRENT WORK.** Round 3 specs (this file, bottom) written 2026-08-24 — includes FR3-H (categories-only top nav), FR3-J (cascading flyout menu replacing mega-panel dump), FR3-I (logo fix). Resume with Round 2; then Round 3.

## Standing rules (bind every agent — no exceptions)

- **Tooling ban:** never install Playwright/Lighthouse; never download browser bundles. Test automation: Python Playwright from `/home/lordwhitefire/playwright/` + system Chrome (`executable_path="/usr/bin/google-chrome"`).
- **Dependencies:** adding ANY new package requires OWNER approval of exact package + version BEFORE installing.
- **Database:** every schema change goes through migration FILES. Owner applies personally and regenerates types afterward.
- **Archive, never delete** source files; historical JSON seeds stay put.
- `npx tsc --noEmit` must pass after your work.
- **Report:** APPEND sections to `openspec/tasks/ARCH-11/implementation-report.md`.

---

## Part 1 — WP-A: Import Center accepts Excel (change task 10.0) ✅ DELIVERED

### Benchmarks
1. `.xlsx` upload produces identical validation report as equivalent CSV; confirming creates exactly those products.
2. Invalid rows held before save; nothing written until confirmed.
3. Rapid multi-click on confirm yields ZERO duplicates.

---

## Part 2 — Product-model hierarchy (D13-amended) ✅ DELIVERED

### Benchmarks
4. SQL: zero nodes with 2+ direct products; every product references one product model; every chain reaches a category.
5. Auto-restructure on second variant.
6. Delete product → product model disappears.
7. Brandless product saves and anchors to category.
8. Deep nesting: breadcrumb + filter both work.
9. Models admin: tree, counts, rename, blocked delete, empty-branch delete.
10. Storefront: breadcrumbs, root-model filter, submodel filter, color variants.
11. Import respects invariant (xlsx + csv).
12. Terminology: "product model" everywhere; tsc passes.
13. Backup exists; migration applied by owner; types committed.

---

# ROUND 2 — Admin data pages become server components ← CURRENT WORK

*(Full spec as previously written — 22 pages to convert; benchmarks 14–18.)*

---

# ROUND 3 — Storefront homepage: navigation, cascading menu, and logo (owner-reported 2026-08-24)

Three fixes to the customer-facing storefront header. The root layout (`frontend/src/app/layout.tsx`) fetches navigation + logo via `getNavigation()` and `getSiteLogoUrl()` from `frontend/src/lib/content/content-service.ts`, then passes them to `StorefrontHeader` → `Header` → `MainNav` + `MegaMenu` + `MobileNav`.

## FR3-H: Homepage nav shows only categories (max 10)

**Root cause:** `MainNav.tsx` line 40–41 iterates `navigation.map(topLevel => topLevel.children?.map(child => ...))` and renders every child of every root node indiscriminately.

**Rule (owner):** the homepage main navigation shows **ALL categories** (not limited to 10 — corrected by owner), and **only categories** at the top level. No brands, no models, no other node types. Each category is a top-level menu item.

**Fix (recommended — Option A, presentation-layer only):** inside the `navigation.map` loop in `MainNav.tsx`, skip any `topLevel` node whose children are not category-typed items. Apply the same filter in `MobileNav.tsx`. Zero data-layer changes — breadcrumbs, slug resolution, and storefront page queries are unaffected.

## FR3-J: Cascading flyout menu replaces the full-width mega-panel dump

**The problem (owner, 2026-08-24):** the current `MegaMenu.tsx` takes the hovered category and dumps ALL descendants (levels 2, 3, 4) into a single full-width panel with columns. Everything shows at once. The screen is cluttered and scattering.

**The desired interaction (owner, verbatim):**

> "All the categories will be shown. If I hover on a category, only the level 2 items will show. Only the items under that particular category directly will show. So when I hover on the level 2, whatever the particular level 2 item, level 3 items will show. I don't want everything to just drop down like that. It's scattering the whole screen."

Concretely:

```
HOVER "Boots" (level 1 — category)
  └─ DROPDOWN appears showing only direct children:
       adidas    ← hover this
       Nike
       Puma

  HOVER "adidas" (level 2 — brand)
    └─ FLYOUT appears to the RIGHT showing only adidas's direct children:
         Predator   ← hover this
         Copa
         X

    HOVER "Predator" (level 3 — root model)
      └─ FLYOUT appears to the RIGHT showing only Predator's direct children:
           Elite FG   ← (if any level 4 exists)
           Pro FG

      HOVER "Elite FG" (level 4 — submodel)
        └─ FLYOUT appears to the RIGHT showing product models (level 5 — terminal):
             Predator Elite FT FG Black
             Predator Elite FT FG White
```

**Key design rules:**
1. Each level shows ONLY the direct children of the hovered item — never the full subtree.
2. Flyouts open to the RIGHT of the parent item, vertically aligned to the top of the parent.
3. Only ONE flyout path is open at a time (hovering a different item at any level closes all descendant flyouts).
4. A small delay (100–150ms) on mouse-leave prevents accidental close when the cursor travels diagonally between items.
5. Terminal nodes (items with no children, i.e., product models) render as plain links — no flyout arrow.
6. Items with children show a subtle right-arrow indicator (▸ or `›`) to signal that hovering will open a submenu.
7. The menu closes entirely when the cursor leaves the nav bar area and all open flyouts.
8. Clicking any link closes the entire menu (existing `onClose` behavior).

**What gets replaced:**
- `MegaMenu.tsx` (the full-width mega-panel with `buildColumns` logic) is RETIRED from the storefront nav. Archive it or move it to `_archive/` — do not delete.
- `MainNav.tsx` is restructured: hovering a top-level category opens a first-level flyout (not the old mega-panel). Each flyout item with children opens the next level on hover.
- A new component (e.g. `CascadingMenuItem.tsx` or inline in the reworked `MainNav`) handles the recursive flyout rendering.

**Desktop (`MainNav.tsx`):** the horizontal category bar stays. Hover opens the first flyout below the category. Subsequent flyouts cascade to the right.

**Mobile (`MobileNav.tsx`):** the hamburger menu uses accordion-style expand instead of flyout (touch devices don't hover). Tap a category → expands to show level 2 items. Tap a level 2 item → expands to show level 3. Tap again → level 4. Only one branch open at a time. This is a separate mobile implementation — do not force the desktop flyout onto mobile.

**Visual style to preserve:**
- Dark background (`bg-black` / `bg-zinc-900`).
- Level 2 items: bold white uppercase (`text-sm font-black text-white uppercase`).
- Level 3 items: slightly smaller, lighter (`text-sm font-bold text-zinc-200`).
- Level 4 items: smaller, muted (`text-xs text-zinc-400`).
- Level 5 (product models, terminal): smallest, muted (`text-xs text-zinc-500`).
- Active/hovered item gets the orange accent (`text-primary-container`).
- Arrow indicators for items with children: `›` character or small chevron, right-aligned.

### Benchmark (FR3-J)
21. Hover on a category in the desktop nav → a compact dropdown appears showing ONLY that category's direct children (brands or whatever level-2 items exist). No level-3+ items visible.
22. Hover on a level-2 item in that dropdown → a flyout appears to its right showing ONLY that item's direct children (level 3). The original dropdown stays open. No level-4+ items visible.
23. Hover deeper → each level shows only its direct children. Terminal items (no children) render as plain links with no arrow.
24. Hover a DIFFERENT item at any level → all previous descendant flyouts close; new flyout path opens.
25. Move the cursor off the menu entirely (with 150ms grace period) → all flyouts close.
26. The old full-width mega-panel (`MegaMenu.tsx` buildColumns layout) is no longer rendered anywhere in the storefront.
27. Mobile hamburger: tap category → accordion expands level 2. Tap level 2 → accordion expands level 3. Only one branch open at a time.

## FR3-I: Site logo not rendering

**Root cause:** `getSiteLogoUrl()` at content-service.ts:569–573 reads `row.social_links.site_logo` and passes it to `toContentImageUrl()` — but if the stored value is a Sanity asset object `{ asset: { _ref } }`, the string check fails → returns `null`. The sibling function `normalizeStoredImage()` already handles both formats.

**Fix:** change line 542 from `site_logo: typeof logoRaw === "string" && logoRaw ? toContentImageUrl(logoRaw) : null` to `site_logo: normalizeStoredImage(logoRaw)`.

### Benchmark (FR3-I)
28. Save a logo in admin → hard-refresh homepage → logo renders in header (mobile + desktop). No logo saved → fallback text mark displays.

## Constraints (Round 3)

- `MainNav` desktop flyout and `MobileNav` accordion are separate implementations — do not force one pattern onto the other.
- Zero behavior regressions: FR3-C immediate-data walks, FR4-A/B/C/D all still hold.
- `npx tsc --noEmit` passes.
- The old `MegaMenu.tsx` is archived, not deleted.
- Implementation report: APPEND an "ARCH-11 Round 3" section listing every file changed and deviations.
