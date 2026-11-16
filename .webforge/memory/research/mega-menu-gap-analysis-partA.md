# Mega Menu UX Gap Analysis — PART A: How the Current Implementation Works

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-gap-analysis
> **Date:** 2026-07-19

---

## A1. The `buildColumns()` Algorithm — 5-Slot Column Packing Logic

**File:** `MegaMenu.tsx`, lines 26–161.

The `buildColumns()` function takes a single `NavItem` (representing one L1 category like "Boots") and packs its children into columns using a **5-slot-per-column** packing algorithm:

### Core Mechanics

1. **Column object** (lines 15–24): Each column has a `parentLabel` (the L1 category label), an optional `parentHref`, and an `items[]` array. Items have `label`, `href`, `level` (2|3|4), and optional `disabled`.

2. **Slots tracking** (lines 35–42):
   - `startNewColumn(label, href)` — creates a new empty column (line 30)
   - `slotsUsed()` — returns `1 + currentColumn.items.length` (the L2 header counts as 1 slot)
   - `fits(count)` — returns true if `slotsUsed() + count <= 5`

3. **Rule 1: L2 items without children** (lines 50–60):
   - If the L2 has no children, add as a simple L2 item.
   - If no column exists or `slotsUsed() >= 5`, start a new column.

4. **Rule 2: L2 items with children** (lines 61–157):
   - Calculate `totalNeeded = 1 + l2Children.length` (L2 label + all L3 children)
   - If `childrenExceedThree` (L3 count > 3) OR it won't fit → start a new column
   - Add the L2 label as a level-2 item (lines 72-77)
   - Iterate through L3 children:
     - **L3 without children** (lines 84-100): Simple L3 text link. If column full, start new column AND re-add parent L2 label.
     - **L3 with children (L4)** (lines 101-155): Check if L3 + L4 children fit. If not, start new column (re-adding L2 + L3 headers). Batch L4 items into remaining slots.

5. **L4 batching** (lines 124-154):
   - `let l4Batch = [...l3Children]` — copy all L4 children
   - While batch remains: calculate `remaining = 5 - slotsUsed()`, slice that many items, push them
   - If items remain, start a new column and re-add L2 + L3 headers, then continue

**Key observation:** The `parentLabel` is ALWAYS `item.label` (the L1 category name), repeated as a column header on EVERY column. This means ALL columns for a given L1 category show the same parent label.

**Column width:** Each column has `style={{ minWidth: "140px" }}` (line 181) and is rendered with `flex-wrap` inside a flex container (line 179), making columns variable-width with no fixed layout.

#### Visual example (Boots → Nike → Mercurial branch):
```
Column 1:          Column 2:          Column 3:
[Boots]            [Boots]            [Boots]
│ Nike             │ Adidas           │ Puma
│  Mercurial       │  X               │  Future
│  Phantom         │  Predator        │  Ultra
│  Tiempo          │  COPA            │  King
│  Premier III     │  F50             │
                   │                  │
                   │ [Boots]          │ [Boots]
                   │ Mizuno           │ New Balance
                   │                  │  442
                   │ [Boots]          │  Furon
                   │ Lotto            │  Tekela
                   │ Munich           │
```

---

## A2. Levels Shown Now

**Current levels displayed in MegaMenu.tsx:**

| Level | Representation | Styling | Lines |
|-------|---------------|---------|-------|
| **L1** (Category) | Top nav bar in `MainNav.tsx`; column header (repeated) | `text-xs font-black uppercase tracking-widest text-zinc-400` | 183-189 |
| **L2** (Brand) | Text link with red accent bar | `w-0.5 h-4 bg-primary` + `text-sm font-black text-white uppercase` | 193-211 |
| **L3** (Model) | Indented text link | `pl-3` + `text-sm font-bold text-zinc-200` | 214-232 |
| **L4** (Sub-model) | Double-indented text link | `pl-5` + `text-xs text-zinc-400` | 234-252 |
| **L5** (Product Type) | **NOT handled** | N/A | N/A |

**Consequence:** L4 items are rendered inside the mega menu with tiny text (12px), deep indentation (`pl-5`), and muted color (`text-zinc-400`). Per the research (Part 3 §2.2), L4+ should be deferred to PLP filters.

**No L5 handling at all.** navigation.json does contain some level-5 data but MegaMenu.tsx has no code path for it.

---

## A3. How It Handles 11 Categories

**File:** `MainNav.tsx`, lines 37-86; `Header.tsx`, lines 137-153.

The `navigation.json` has **11 L1 categories** (confirmed by `"level": 1` occurring 11 times):

1. Boots (line 633)
2. Multi-Stud Boots (line 975)
3. Indoor Shoes (line 1508)
4. Shin Guards (line 1793)
5. Balls (line 2117)
6. Socks (line 2353)
7. Jerseys (line 2975)
8. Kits (line 3469)
9. Apparel (line 3679)
10. Clothing (line 4219)
11. Accessories (line 4724)

**How they're rendered:**

1. `Header.tsx` (lines 137-153): Desktop nav hidden until `xl:` breakpoint. Renders `<MainNav navigation={navigation} />`.

2. `MainNav.tsx` (lines 39-75): Maps over `navigation` (a `NavigationData[]` containing one root node with 11 children). Loops over `navigation[0].children` → renders all 11 L1 items as `<li>` with `onMouseEnter`/`onMouseLeave`.

3. **MegaMenu instances** (MainNav.tsx line 83): Only ONE MegaMenu rendered at a time:
   ```jsx
   {activeItem && <MegaMenu item={activeItem} onClose={handleClose} />}
   ```
   - `activeItem` is the hovered L1 item
   - MegaMenu receives that single L1 item, calls `buildColumns(item)` on it
   - Each L1 gets its own dynamic MegaMenu panel

---

## A4. Current Mobile Behavior

**File:** `MobileNav.tsx` (401 lines); `Header.tsx` lines 109-134.

The mobile navigation uses a **mixed pattern**:

1. **Trigger:** Hamburger icon in `Header.tsx` (line 124) — visible below `xl:` breakpoint.

2. **Drawer:** Left-side slide-in drawer, `max-w-[400px]` (line 297).

3. **Screen 1 — Main menu** (lines 301-381): Lists all L1 items as buttons with "+" symbol. Tapping an L1 triggers slide to Screen 2.

4. **Screen 2 — SubMenuPanel** (lines 139-268):
   - `L2Item` (lines 90-137): Accordion expandable
   - `L3Item` (lines 41-88): Accordion expandable
   - `L4Item` (lines 15-39): Terminal text links

5. **Pattern: Drill-down for L1→L2, then pure accordion for L2→L4.** This is the OPPOSITE of the recommendation (Part 4 §3.1: accordion for L1-L2, drill-down for L3+).

**Missing mobile features (per Part 4 §3.5):**
- No breadcrumb trail (Part 4 §3.5 #3)
- No persistent search bar in overlay (Part 4 §3.5 #9)
- No "View All" links at each level (Part 4 §3.5 #4)
- No minimum touch target enforcement (44×44px per Part 4 §3.5 #5)
- No staggered fade-in animations (Part 4 §3.5 #10)

---

## A5. Current Hover/Click Behavior

**File:** `MainNav.tsx`, lines 13-35.

Current behavior is **hover-only with 150ms close delay**:

1. **Open on hover** (lines 18-23):
   ```typescript
   function handleMouseEnter(item: NavItem) {
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       if (item.children && item.children.length > 0) setActiveItem(item);
   }
   ```
   - **NO intent delay — opens instantly (0ms)**
   - Only opens if item has children

2. **Close on mouse leave** (lines 25-27):
   ```typescript
   function handleMouseLeave() {
       timeoutRef.current = setTimeout(() => setActiveItem(null), 150);
   }
   ```
   - 150ms exit delay (research says 500ms minimum — Part 3 §2.3 line 68)

3. **Mega menu hover** (lines 29-31): Hovering into the panel cancels the close timeout.

4. **No click-to-open** — No click handler on nav items. `<Link>` navigates on click but doesn't open the menu.

5. **No keyboard support** — No `onKeyDown`, no Escape handler, no arrow keys.

6. **No Amazon triangle technique** — No trajectory triangle, no SVG path exit areas.

7. **No 400ms open delay** — Opens instantly.

**Comparison to research (Part 3 §2.3):**

| Feature | Research Says | Current | Gap |
|---------|--------------|---------|-----|
| Primary open | Click/tap to open | Hover-only (no click) | ❌ |
| Hover delay | 400ms intent delay | 0ms (instant) | ❌ |
| Exit delay | 500ms minimum | 150ms | ❌ |
| Amazon triangle | Yes | No | ❌ |
| Keyboard | Full WCAG 2.1 AA | None | ❌ |
| Escape close | Yes | No | ❌ |
| Click outside closes | Yes | No (mobile only) | ❌ |

---

*End of Part A — continues in Part B (Gap Analysis: Current vs Best Practices)*
