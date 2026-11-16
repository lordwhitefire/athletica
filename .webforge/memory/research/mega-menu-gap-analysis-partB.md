# Mega Menu UX Gap Analysis — PART B: Current vs Best Practices

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-gap-analysis
> **Date:** 2026-07-19

---

## B1. Column Structure Gap

| Aspect | Research Says (Part 3 §2.1, Part 5 §4.1) | Current Code | Severity |
|--------|------------------------------------------|-------------|----------|
| **Column count** | 4 columns: Edits \| Brands (48px) \| Models (60px) \| Featured | Variable columns (5-slot packing), min-width 140px | ❌ CRITICAL |
| **Column 1** | Category links + "Edits" (New In, Best Sellers, By Surface) | L1 label repeated as ALL column headers. No Edits. | ❌ CRITICAL |
| **Column 2** | Brand links with 48×48px logos | L2 items with red accent bar (`w-0.5 h-4 bg-primary`). No logos. | ❌ CRITICAL |
| **Column 3** | Model links with 60×60px thumbnails | L3 items with `pl-3` indent only. No thumbnails. | ❌ CRITICAL |
| **Column 4** | Featured image + CTA | Exists as element outside column grid (lines 261-289) | ⚠️ PARTIAL |
| **Bottom row** | "View All [Category]" + "View All Brands" | No bottom row exists | ❌ MISSING |
| **Consistency** | Same template for ALL L1 categories | Algorithmically packed — differs per category | ❌ CRITICAL |

**Research citations:**
- Part 3 §2.1 lines 22-27: "4-column mega menu layout"
- Part 5 §4.1 lines 28-48: ASCII wireframe showing 4-column layout
- Part 5 §4.1 lines 53-81: Column descriptions (Edits, Brands with 48px logos, Models with 60px thumbs, Featured)

**Current code (MegaMenu.tsx lines 26-161):** `buildColumns()` packs items into variable-width columns. NO semantic column purposes. Pure space-packing.

**Quantification:** Complete architectural gap. The algorithm has NO concept of brand columns vs model columns vs edit columns.

---

## B2. Level Depth Gap

| Aspect | Research Says (Part 3 §2.2) | Current Code | Severity |
|--------|------------------------------|-------------|----------|
| **Max levels** | 3 levels max (L1-L3). L4-L5 → PLP filters. | Handles L4 explicitly (lines 123-154). L5 not handled. | ❌ CRITICAL |
| **L4 items** | Deferred to PLP as filterable groups | Rendered as `pl-5` text links in `text-xs text-zinc-400` | ❌ CRITICAL |
| **L5 items** | Deferred to PLP as filter facets | Not handled at all | ⚠️ PARTIAL |
| **PLP integration** | Each L3 link → PLP with filters | L3 links exist, but no PLP filter component | ⚠️ Not built |

**Research citations:**
- Part 3 §2.2 lines 32-33: "Show 3 levels in the mega menu... Cut off Levels 4-5"
- Part 3 §2.2 lines 42-49: Mapping table — L4→PLP, L5→filter facets
- Part 3 §2.5 lines 98-110: "Cut off after Level 3. Level 4+ navigated via PLP filters."

**Consequences of L4 in menu:**
1. **Cognitive overload:** 12px muted text deep in menu. Baymard: users overwhelmed beyond ~10 options (Part 3 §2.2 line 38).
2. **Column overflow:** L4 items trigger column wrapping mid-stream (lines 124-154), creating unpredictable layouts.
3. **Header repetition:** L4 overflow re-adds L2+L3 headers (lines 139-153), creating visual redundancy.
4. **Touch target violations:** `text-xs` (12px) — violates NN/g 44×44px guideline (Part 3 §2.8 line 148).

---

## B3. Brand Presentation Gap

| Aspect | Research Says (Part 5 §4.1, Column 2) | Current Code | Severity |
|--------|---------------------------------------|-------------|----------|
| **Brand display** | Dedicated Column 2 with 48×48px logos | L2 text items with red accent bar only | ❌ CRITICAL |
| **Logo size** | 48×48px | No logos | ❌ CRITICAL |
| **Grouping** | Dedicated brand column | Brands mixed with all L2 items | ❌ CRITICAL |
| **Brand-as-column** | Foot Locker pattern (Part 2 §1.4 #1) | Not implemented | ❌ CRITICAL |

**Research citations:**
- Part 5 §4.1 lines 59-64: "Column 2 — Brand links with 48px logos"
- Part 3 §2.4 lines 82-83: "Small brand logos (48×48px) next to Level 2 brand names"
- Part 2 §1.4 #1 (Foot Locker): "Brand-as-column"
- Part 3 §2.4 line 79: "Baymard: 55% of sites missing thumbnails. Users hesitate with text-only."

**Current code (MegaMenu.tsx lines 193-211):** Red accent bar (`w-0.5 h-4 bg-primary`) is the ONLY visual differentiation for brands/L2. No images.

---

## B4. Model Thumbnails Gap

| Aspect | Research Says (Part 5 §4.1, Column 3) | Current Code | Severity |
|--------|---------------------------------------|-------------|----------|
| **Model display** | 60×60px thumbnails | Indented text (`pl-3`, `text-sm font-bold`) | ❌ CRITICAL |
| **Thumbnail size** | 60×60px | No thumbnails | ❌ CRITICAL |
| **Grouping** | Models per brand in dedicated column | Inline under L2 headers | ❌ CRITICAL |
| **Information scent** | Thumbnails reduce hesitation (Baymard) | Text-only — low information scent | ❌ CRITICAL |

**Research citations:**
- Part 5 §4.1 lines 66-70: "Column 3 — Model links with 60px thumbnails"
- Part 3 §2.4 lines 74-86: "Small product thumbnails (60×60px) next to Level 3 model names"

**Current code (MegaMenu.tsx lines 214-232):** Pure text with `pl-3`. No Image component.

---

## B5. Hover/Click Gap

| Feature | Research Says (Part 3 §2.3) | Current Code | Severity |
|---------|-----------------------------|-------------|----------|
| **Primary open** | Click/tap to open (NN/g #13) | Hover-only. No click-to-open. | ❌ CRITICAL |
| **Hover delay** | 400ms intent delay | 0ms (instant open) | ❌ CRITICAL |
| **Exit delay** | 500ms minimum | 150ms | ❌ CRITICAL |
| **Amazon triangle** | Trajectory triangle | Not implemented | ❌ MISSING |
| **SVG exit areas** | Hakim el Hattab technique | Not implemented | ❌ MISSING |
| **Keyboard support** | Full WCAG 2.1 AA | None in MegaMenu; partial `aria-expanded` in MainNav | ❌ CRITICAL |
| **Escape key close** | Yes | Not implemented | ❌ MISSING |
| **Click outside** | Yes | Not implemented | ❌ MISSING |

**Research citations:**
- Part 3 §2.3 lines 55-68: "Click/tap activation... hover secondary with 400ms delay + triangle"
- Part 3 §2.3 line 58: NN/g: "Use Click-Activated (Rather Than Hover-Activated) Submenus"
- Part 3 §2.3 line 68: "Exit delay: 500ms minimum before menu closes" (NN/g, 2017)
- Part 3 §2.8 lines 145-151: Accessibility requirements

**Current MainNav.tsx lines 18-27:** Opens instantly (0ms), 150ms exit. No click, no keyboard, no triangle.

---

## B6. Mobile Gap

| Aspect | Research Says (Part 4 §3.1) | Current Code (MobileNav.tsx) | Severity |
|--------|----------------------------|----------------------------|----------|
| **Pattern** | Accordion (L1-L2) + drill-down (L3+) | Push (L1→L2) + accordion (L2→L4) — INVERTED | ❌ CRITICAL |
| **Full-screen overlay** | Yes | Yes (left drawer, max-w 400px) | ✅ PRESENT |
| **Breadcrumbs** | Always show path (Part 4 §3.5 #3) | None | ❌ MISSING |
| **Search in nav** | Persistent at top (Part 4 §3.5 #9) | None | ❌ MISSING |
| **"View All" links** | At every level (Part 4 §3.5 #4) | None | ❌ MISSING |
| **Touch targets** | 44×44px minimum (Part 4 §3.5 #5) | Not enforced; L4 uses `text-[10px]` | ⚠️ POTENTIAL |
| **Animations** | Staggered fade (50ms/item); slide 200-300ms | CSS `duration-300` for push only | ⚠️ PARTIAL |
| **Indentation** | 16-20px per level (Part 4 §3.5 #5) | L2: `pl-12`, L3: `pl-16`, L4: `pl-4` — inconsistent | ⚠️ INCONSISTENT |
| **Chevron icons** | → for drill-down, ▼ for accordion (Part 4 §3.5 #6) | `expand_more` for accordion | ⚠️ PARTIAL |
| **Depth on mobile** | L1-L3 in menu, L4-L5 on PLP | Shows L1-L4 in accordion | ❌ TOO DEEP |

**Research citations:**
- Part 4 §3.1 lines 14-20: "Hybrid accordion + drill-down. L1→L2: accordion; L2→L3+: push"
- Part 4 §3.5 line 126: "Breadcrumb trail: Always show current path at the top"
- Part 4 §3.5 line 128: "View All links at each level" (Baymard: only 24%)
- Part 4 §3.5 line 138: "Search bar: Persistent at the top"

**Current pattern:** L1→L2 = push (correct for drill-down). L2→L3 = accordion (should be push). L3→L4 = accordion (should be push). Result: nested accordion hell — violates NN/g "nested doll" warning.

---

## B7. 11 Categories Gap

| Aspect | Research Says (Part 3 §2.1) | Current Code | Severity |
|--------|----------------------------|-------------|----------|
| **Max items** | Max 6. Group rest under "More." | 11 items in top bar | ❌ CRITICAL |
| **Density** | ~6 for scannability (Baymard: ~10 max) | 11 — exceeds limit | ❌ CRITICAL |
| **"More" flyout** | Group remaining 5 categories | Not implemented | ❌ MISSING |
| **Overflow** | Should be contained | `flex-nowrap` with 11 items → overflows viewport | ❌ CRITICAL |

**Research citations:**
- Part 3 §2.1 lines 22-23: Assumes ~6 top-level items
- Part 2 §1.8 line 236: Nike ~6, Adidas ~5, JD Sports 7
- Part 3 §2.1 line 18: "Baymard: users overwhelmed with more than ~10 subcategory options"

**11 categories (from navigation.json):** Boots, Multi-Stud Boots, Indoor Shoes, Shin Guards, Balls, Socks, Jerseys, Kits, Apparel, Clothing, Accessories.

**Overflow:** Each item `px-4 py-3` with `whitespace-nowrap`. At ~80px each, 11 items = 880px minimum. `flex-nowrap` on `<ul>` (MainNav.tsx line 39) means they WILL overflow. No scroll behavior.

---

## B8. Summary: All Gaps at a Glance

| Gap Area | Research Source | Current State | Impact | Priority |
|----------|---------------|--------------|--------|----------|
| Column structure | Part 3 §2.1, Part 5 §4.1 | 5-slot packing, no semantic columns | Can't scan by brand/model/edits | P0 |
| Level depth | Part 3 §2.2 | Shows L4 in menu, L5 unimplemented | Cognitive overload, clutter | P0 |
| Brand presentation | Part 5 §4.1 (Col 2) | Text-only with red accent bar | Low information scent | P1 |
| Model thumbnails | Part 5 §4.1 (Col 3) | Text-only with `pl-3` indent | Low information scent | P1 |
| Hover/click | Part 3 §2.3 | Hover-only, 0ms delay, 150ms exit | Accessibility failure, flickering | P0 |
| Mobile pattern | Part 4 §3.1 | Inverted: push→accordion instead of accordion→push | Deep nesting, disorientation | P0 |
| Mobile features | Part 4 §3.5 | Missing breadcrumbs, search, View All | Reduced usability | P1 |
| 11 categories | Part 3 §2.1 | 11 items, no "More" | Overflow, cognitive overload | P0 |
| Accessibility | Part 3 §2.8 | No keyboard, sparse ARIA | WCAG non-compliance | P0 |
| L4 items in menu | Part 3 §2.2, §2.5 | `text-xs` (12px) tiny links | Touch target violation | P1 |

---

## B9. Contradictions: Research vs Current Code

1. **Column layout (Part 5 §4.1) vs packing algorithm:** Research says 4 semantic columns. Code has NO semantic column concept.

2. **Depth cutoff (Part 3 §2.2) vs current depth:** Research says "3 levels max." Code handles 4 levels. DIRECT CONTRADICTION.

3. **Mobile pattern (Part 4 §3.1) vs current:** Research says "accordion L1-L2, drill-down L3+." Code does the INVERSE: drill-down L1→L2, accordion L2→L4.

4. **Click activation (Part 3 §2.3) vs hover-only:** NN/g says click primary. Code has NO click-to-open.

5. **Max items (Part 3 §2.1) vs 11:** Research says ~6 max. Code has 11. No "More" menu.

---

## B10. Unresolved Items (from Part 6 §4.5)

These require CEO input before rebuild. They don't block the gap analysis:

1. **Audience segmentation:** Gender-first vs category-first? (Part 6 §4.5 #1)
2. **Exact category taxonomy:** Final L1 list? (Part 6 §4.5 #2)
3. **Surface types:** Is "By Surface" correct? (Part 6 §4.5 #3)
4. **Brand list:** Which brands? (Part 6 §4.5 #4)
5. **Mobile search persistence** (Part 6 §4.5 #5)
6. **Cookie-based personalization** (Part 6 §4.5 #6)
7. **Promotional column ownership** (Part 6 §4.5 #7)

---

## Appendix: Key File References

| File | Key Lines | Content |
|------|-----------|---------|
| `MegaMenu.tsx` | 26-161 | `buildColumns()` — 5-slot packing algorithm |
| `MegaMenu.tsx` | 163-321 | MegaMenu rendering |
| `MegaMenu.tsx` | 183-189 | Column header (repeated L1 label) |
| `MegaMenu.tsx` | 193-211 | L2 rendering (red accent bar) |
| `MegaMenu.tsx` | 214-232 | L3 rendering (indented text) |
| `MegaMenu.tsx` | 234-252 | L4 rendering (double-indented text) |
| `MegaMenu.tsx` | 261-289 | Featured image/banner |
| `MainNav.tsx` | 13-35 | Hover/click state management |
| `MainNav.tsx` | 37-86 | Nav bar + MegaMenu placement |
| `MobileNav.tsx` | 15-39 | L4 mobile item |
| `MobileNav.tsx` | 41-88 | L3 mobile item |
| `MobileNav.tsx` | 90-137 | L2 mobile item |
| `MobileNav.tsx` | 139-268 | SubMenuPanel (Screen 2) |
| `MobileNav.tsx` | 271-401 | MobileNav drawer shell |
| `Header.tsx` | 109-134 | Mobile hamburger |
| `Header.tsx` | 137-153 | Desktop MainNav |
| `navigation.json` | multiple | 11 L1 categories |
| `navigation.ts` | 1-20 | NavItem types |

---

*End of Part B — compiled by Probe-Orion on 2026-07-19*
