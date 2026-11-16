# Mega Menu UX Gap Analysis — Stream 4 Part A: What Needs to Change

> **Compiled by:** Probe-Sable | **Task:** task-mega-menu-ux-3level-001 | **Date:** 2026-07-19
> **Sources:** `MegaMenu.tsx` (322 lines), `navigation.ts`, research parts 3 (§2.1-2.6), 4 (§3.1-3.5), 5 (§4.1-4.2)

---

## A.1 Column Interface (lines 15-24)

**Current:** A flat generic interface with only `parentLabel`, `parentHref`, and `items[]` each having `label`, `href`, `level: 2|3|4`, `disabled`. No image fields, no type discrimination.

**Needed changes:**
- Add `type: 'category' | 'brands' | 'models' | 'featured'` discriminator (*Part 3 §2.1*)
- Create `BrandColumnItem` with `logoUrl?: string` (48×48px) (*Part 5 §4.1*)
- Create `ModelColumnItem` with `thumbnailUrl?: string` (60×60px) (*Part 5 §4.1*)
- Create `FeaturedColumnItem` with `promoImageUrl`, `ctaLabel`, `ctaHref` (*Part 5 §4.1*)
- Create `CategoryColumnItem` with `isHeading?`, `isEdit?` (*Part 5 §4.1*)
- Add `bottomLinks` structure for "View All" row (*Part 5 §4.1*)
- Add `imageUrl` to `NavItem` in `navigation.ts` (*Part 5 §4.2*)

**Impact:** Breaking type change. All callers of `buildColumns()` must be updated.

---

## A.2 `buildColumns()` Function (lines 26-161)

**Current:** Auto-packs children into columns using a 5-slot limit (line 37: `slotsUsed()`, line 41: `fits()`). When Level 2 children > 3, starts a new column. Flattens all items into generic `Column.items[]`. No column-priority awareness.

**Needed changes:**
- **Replace with 4 column-specific builders:** `buildCategoryColumn()`, `buildBrandsColumn()`, `buildModelsColumn()`, `buildFeaturedColumn()` (*Part 3 §2.1*)
- Column 1: Extract Level 1 heading "All Boots" + curated edits (New In, Best Sellers, By Surface) (*Part 5 §4.1*)
- Column 2: Extract Level 2 brands with `logoUrl` (*Part 5 §4.1*)
- Column 3: Extract Level 3 models with `thumbnailUrl` grouped by brand (*Part 5 §4.1*)
- Column 4: Extract featured spotlight item with promo image (*Part 5 §4.1*)
- Add `buildBottomLinks()` for "View All" row (*Part 5 §4.1*)
- **Remove the 5-slot limit** — columns are fixed-layout, not auto-packed (*Part 3 §2.1*)

**New signature:**
```typescript
function buildColumns(item: NavItem): {
    category: TypedColumn;  // Column 1
    brands: TypedColumn;    // Column 2
    models: TypedColumn;    // Column 3
    featured: TypedColumn;  // Column 4
    bottomLinks: BottomLink[];
}
```

**Impact:** Complete rewrite of ~135 lines. Core algorithm changes from iterative packing to semantic extraction.

---

## A.3 Rendering — Column JSX (lines 127-250)

**Current:** All columns render with same `<div className="flex flex-col gap-1" style={{ minWidth: "140px" }}>`. Level discrimination via `colItem.level`: Level 2 = uppercase bold with red accent bar; Level 3 = indented bold; Level 4 = more indented gray. No images.

**Needed changes:**
- Add column-type-specific renderers: `renderCategoryColumn()`, `renderBrandsColumn()`, `renderModelsColumn()`, `renderFeaturedColumn()` (*Part 5 §4.1 wireframe*)
- Brands column: each brand as row with 48×48 `<Image>` + name link (*Part 5 §4.1*)
- Models column: each model as row with 60×60 `<Image>` + name link, grouped by brand (*Part 5 §4.1*)
- Featured column: single promo image + heading + "Shop →" CTA (*Part 5 §4.1*)
- Replace `{columns.map(...)}` with fixed 4-column grid:
  `<div className="grid grid-cols-4 gap-6">` (*Part 5 §4.1 wireframe*)
- Remove hardcoded featured banner (lines 260-289) — Column 4 replaces it (*Part 5 §4.1*)
- Remove right sidebar (lines 293-318) — Quick Links not part of mega menu (*Part 3 §2.1*)
- Add bottom "View All" row: full-width with left/right links (*Part 5 §4.1*)

**Impact:** Rewrite of ~130 lines of JSX. New Image imports needed.

---

## A.4 Top-Level Nav Bar

**Current:** Component receives single `item: NavItem` — only renders dropdown panel for one category. No top-level bar.

**Needed changes:**
- Accept `items: NavItem[]` and `activeItem: NavItem | null` in props (*Part 5 §4.1 wireframe*)
- Render horizontal row of all 11 categories as text links (*Part 3 §2.3*)
- Highlight active category (`className` conditional on `activeItem?.id`) (*Part 5 §4.1*)
- Coordinate hover/click with parent component or add state internally (*Part 3 §2.5*)

**Impact:** Prop interface change. Parent component must pass all items and manage active state.

---

## A.5 Hover/Click Behavior

**Current:** No delay logic. Receives `onClose` but no close mechanism. No Escape key. No click-outside.

**Needed changes:**
- **400ms hover delay** using `setTimeout` + cleanup (*Part 3 §2.5 — Baymard 300-500ms*)
- **Click-to-open** as primary mechanism (*Part 3 §2.5 — NN/g guideline #13*)
- **Amazon triangle** — invisible SVG between nav bar and panel preventing accidental close (*Part 3 §2.5*)
- **Escape key listener** via `useEffect` + `keydown` event (*Part 3 §2.5*)
- **Click-outside detection** via backdrop or `useRef` (*Part 3 §2.5*)
- **500ms exit delay** on mouse leaving panel (*Part 3 §2.5 — NN/g 2017*)

**Impact:** Add ~80 lines of interaction logic plus state management.

---

## A.6 Mobile Navigation

**Current:** Zero mobile support. Desktop-only component.

**Needed changes** (detailed in Part C):
- Hamburger → full-screen overlay (*Part 4 §3.2*)
- Accordion for L1→L2 (*Part 4 §3.1*)
- Drill-down/push for L2→L3+ (*Part 4 §3.1*)
- Breadcrumb trail (*Part 4 §3.1*)
- Persistent search bar (*Part 4 §3.3*)
- "View All" at every level (*Part 4 §3.1*)
- Animated transitions 200-300ms (*Part 4 §3.5*)

**Impact:** New `MobileNav` component, ~200-300 lines.

---

## A.7 Footer Links

**Current:** `bottomLinks` in data/JSON but not rendered as "View All" row. QuickLinks shown in sidebar instead.

**Needed changes:**
- Render `bottomLinks` as full-width row: "View All Boots" left, "View All Brands" right (*Part 5 §4.1*)
- Remove Quick Links sidebar — these belong in a separate utility bar (*Part 3 §2.1*)

**Impact:** Minor (~20 lines to add, ~30 lines to remove).

---

## Quick Reference: Code Lines vs Changes

| Lines | Function | Change |
|-------|----------|--------|
| 1-8 | Imports | Add React hooks imports, keep existing |
| 10-13 | `MegaMenuProps` | Expand to include `items[]`, `activeItem`, handlers |
| 15-24 | `Column` interface | Replace with typed discriminator union |
| 26-161 | `buildColumns()` | Full rewrite to 4 column-specific builders |
| 163-165 | Component start | Update prop destructuring |
| 166-172 | Data setup | Remove quickLinks, add column destructuring |
| 174-320 | JSX return | Full rewrite: 4-column grid + bottom row + interactions |

---

**Source references:** Part 3 = `mega-menu-ux-research-part3.md`, Part 4 = `mega-menu-ux-research-part4.md`, Part 5 = `mega-menu-ux-research-part5.md`.
