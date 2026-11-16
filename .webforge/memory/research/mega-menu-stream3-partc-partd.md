# Mega Menu UX Gap Analysis — Stream 3: Recommended Design (Part C: Accessibility + Part D: Unresolved Items)

> **Compiled by:** Probe-Beacon (Intelligence Team Member)
> **Task:** stream-3-mega-menu-ux-gap-analysis
> **Date:** 2026-07-19
> **Sources:** mega-menu-ux-research-part3.md §2.8, part4.md §3.7, part6.md §4.5

---

## PART C: Accessibility & Edge Cases

### C1. Keyboard Navigation (Full WCAG 2.1 AA)

Per mega-menu-ux-research-part3.md §2.8 and mega-menu-ux-research-part4.md §3.7:

| Key | Desktop Behavior | Mobile Behavior |
|---|---|---|
| **Tab / Shift+Tab** | Navigate between top-level nav items; move into panel | Navigate through overlay items |
| **Enter / Space** | Open submenu or activate link | Open accordion or drill-down |
| **Up/Down Arrow** | Navigate within submenu items | Navigate within current level list |
| **Left/Right Arrow** | Switch between columns | N/A (mobile is single-column) |
| **Escape** | Close menu, return focus to trigger | Close overlay, return focus to hamburger |

**Source:** mega-menu-ux-research-part3.md §2.8: "Full WCAG 2.1 AA compliance required. Tab/Shift+Tab between top-level items, Enter/Space to open submenus, Arrow keys within submenus, Escape to close."

### C2. ARIA Attributes

| Attribute | Applied To | Purpose |
|---|---|---|
| `aria-expanded="true/false"` | Top-level nav items, accordion parents | Indicates menu/open state |
| `aria-haspopup="menu"` | Menu triggers | Announces presence of submenu to screen readers |
| `role="navigation"` | Main nav `<nav>` element | Landmark identification |
| `aria-current="page"` | Active link | Indicates current category |
| `aria-controls="panel-id"` | Trigger element | Links trigger to its panel |

**Source:** mega-menu-ux-research-part3.md §2.8: Boundev (2026) recommendation; NN/g "Mega Menus Work Well" (2017)

### C3. Focus Management

- **Desktop:** When mega menu opens, move focus to first link in Column 1. When closes, return focus to the top-level trigger.
- **Mobile drill-down:** On push transition, move focus to the new panel heading (e.g., `<h2>Nike Models</h2>`). On back/close, return focus to the item that was activated.
- **Visible focus indicators** on all navigable elements — minimum 2px outline with sufficient contrast.
- **Skip link** before navigation for keyboard users to bypass the menu entirely.

**Source:** mega-menu-ux-research-part4.md §3.7: "On drill-down push, move focus to panel heading. On close, return focus to trigger." (WCAG 2.1 — 2.4.3)

### C4. Touch Targets

- **Minimum:** 44×44px for all clickable items (per mega-menu-ux-research-part3.md §2.8)
- **Ideal:** 48×48dp (Material Design 3 standard, per mega-menu-ux-research-part4.md §3.7)
- **Hierarchy indentation:** 16–20px per level on mobile (per mega-menu-ux-research-part4.md §3.5)
- **Spacing between items:** Minimum 8px gap to prevent accidental taps

### C5. prefers-reduced-motion Support

When user has `prefers-reduced-motion: reduce` preference:

- **Accordion animations:** Disable staggered fade. Items appear instantly (no transition).
- **Drill-down transitions:** Disable slide animation. New panel appears instantly (CSS transform disabled).
- **Hover effects:** Disable transition timing — instant visual change instead.
- **Implementation:** Use `@media (prefers-reduced-motion: reduce)` in CSS to override animation durations to 0ms.

Per mega-menu-ux-research-part4.md §3.7: "Provide `prefers-reduced-motion` support — disable slide animations." (WCAG 2.1 — 2.3.3)

### C6. Screen Reader Support

Per mega-menu-ux-research-part3.md §2.8, NN/g recommends two approaches:

**Simple approach:** Make each top-level menu choice clickable → regular category page with full accessible HTML. Users can navigate without the mega menu JavaScript.

**Advanced approach:** Full ARIA implementation with:
- Proper `role="menu"` / `role="menuitem"` roles
- Keyboard event handlers for all interactions
- `aria-live="polite"` for dynamic content updates
- Focus trapping within open menus

**Recommendation:** Implement both. "If you're a rich company and/or especially concerned with accessibility, you should implement both." — NN/g

### C7. Color Contrast

- **Normal text:** WCAG AA 4.5:1 minimum contrast ratio
- **Large text (18px+ or 14px+ bold):** 3:1 minimum
- **Focus indicators:** 3:1 against adjacent background
- **Hover states:** Maintain sufficient contrast — color-only changes must be supplemented with another indicator (underline, weight change)

**Source:** mega-menu-ux-research-part3.md §2.8

### C8. Edge Cases

**Very long brand lists (Column 2):**
- Maximum height: cap at viewport height minus nav bar height minus bottom row (approximately 60vh)
- Vertical scroll if content exceeds max height
- With "View All Brands" at bottom to see complete list

**Very long model lists (Column 3):**
- Same vertical scroll treatment
- Sort by popularity/sales — most relevant models first

**No JavaScript fallback:**
- If JS fails to load, top-level nav items should link directly to category pages
- Mega menu enhancement: progressive enhancement
- Per NN/g recommendation: simple clickable links as baseline

**Orientation change (mobile):**
- Support both portrait and landscape
- In landscape, consider showing two levels (breadcrumb + current level) side-by-side
- Per mega-menu-ux-research-part4.md §3.7: Smashing Magazine (2022)

**Back button behavior:**
- Use breadcrumb-style "← Back to [Parent]" labels, not generic "Back"
- Navigation back stack independent of browser history
- Per mega-menu-ux-research-part4.md §3.7: NN/g "Mobile Subnavigation" (2017)

---

## PART D: Unresolved Items [NOT FOUND — ask CEO]

The following 7 items require CEO/Product Owner input. Source: mega-menu-ux-research-part6.md §4.5.

### D1. Audience Segmentation (Gender-first or Category-first?)
**[NOT FOUND — ask CEO]**

**Question:** Should top-level nav split by Gender (Men's/Women's/Kids') or by Category (Boots/Clothing/Accessories)?

**Context:**
- Nike: audience-first (Men/Women/Kids) — mega-menu-ux-research-part1.md §1.1
- JD Sports: category-first — mega-menu-ux-research-part2.md §1.5
- Zalando: stores gender in cookie `ncx` — mega-menu-ux-research-part2.md §1.7
- Current navigation.json uses "Adultos" as Level 0 (category-first approach)

**Options for CEO:**
- A: Category-first (Boots | Jerseys/Kits | Clothing | Accessories | Brands | Sale) — simpler, fewer clicks
- B: Gender-first (Men | Women | Kids) then categories — deeper but audience-specific
- C: Hybrid (category-first with audience filter on PLP)

### D2. Exact Category Taxonomy
**[NOT FOUND — ask CEO]**

**Question:** Confirm exact Level 1 categories for final taxonomy.

**Current 11 items:** Boots, Multi-Stud Boots, Indoor Shoes, Shin Guards, Balls, Socks, Jerseys, Kits, Apparel, Clothing, Accessories

**Research proposes 6:** Boots | Jerseys/Kits | Clothing | Accessories | Brands | Sale

**CEO needs to decide:**
- Whether Boots + Multi-Stud Boots + Indoor Shoes merge into "Boots"
- Whether Jerseys + Kits merge into "Kits" (or "Jerseys")
- Whether Clothing + Apparel merge into "Clothing"
- Whether Accessories + Shin Guards + Socks + Balls merge into "Accessories"
- Whether "Equipment" should be a separate category (per mega-menu-ux-research-part5.md §4.1)
- Whether "Sale" should be top-level or within a "More" dropdown

### D3. Surface Types
**[NOT FOUND — ask CEO]**

**Question:** Is "By Surface" (FG/AG/TF/SG) the correct second-dimension filter?

**Context:**
- "By Surface" proposed as Athletica differentiator — mega-menu-ux-research-part5.md §4.1
- Current nav has "Surface" as L2 under Boots: Natural Grass, Artificial Turf, Hard Ground/Dirt
- Adidas uses "Sport" as second dimension — mega-menu-ux-research-part1.md §1.2

**CEO needs to decide:**
- Surface options: FG, AG, TF, SG — correct four?
- Should "By Player Position" or "By Skill Level" be additional dimensions?
- "By Surface" or "By Sport" as second dimension?

### D4. Brand List
**[NOT FOUND — ask CEO]**

**Question:** Which brands does Athletica carry? Affects Column 2 brand listing.

**Current brands observed in nav data:** Nike, Adidas, Puma, New Balance, Mizuno, Joma, Kelme, Lotto, Munich, Diadora

**CEO needs to provide:**
- Complete brand list for Column 2
- Priority ordering (which brands at top)
- Whether all brands have 48px logo assets

### D5. Mobile Search Persistence
**[NOT FOUND — ask CEO]**

**Question:** Should search bar remain visible in header after hamburger menu opens?

**Options:**
- A: Search in header (visible above menu icon) — Nike pattern
- B: Search at top of overlay (inside menu) — Decathlon pattern
- C: Both

### D6. Cookie-Based Personalization
**[NOT FOUND — ask CEO]**

**Question:** Implement cookie-based preference to skip re-selection for returning visitors?

**Context:** Zalando stores gender in `ncx` cookie per mega-menu-ux-research-part2.md §1.7. Applies Hick's Law.

**CEO needs to decide:**
- Whether to implement cookie personalization
- GDPR/compliance implications
- What preferences to store (gender? surface? favorite brand?)

### D7. Promotional Column Ownership
**[NOT FOUND — ask CEO]**

**Question:** Who manages Column 4 promotional content?

**Context:** Column 4 requires fresh content to stay relevant. If no resources, column risks becoming stale.

**CEO needs to decide:**
- Owning team (Marketing? Operations? Product?)
- Update frequency (weekly? per launch?)
- Fallback content when no promo available
- CMS-managed dynamic content or static?

---

## Summary: Key Design Decisions

| Decision | Recommendation | Primary Source |
|---|---|---|
| **Column layout** | 4 columns (Edits, Brands, Models, Promo) | Part 3 §2.1, Part 5 §4.1 |
| **Top-level items** | 6 max (consolidate from 11) | Part 3 §2.1, Part 5 §4.1 |
| **Hover/Click** | Click primary, hover secondary (400ms delay) | Part 3 §2.3, Part 5 §4.1 |
| **Exit delay** | 500ms minimum | Part 3 §2.3 |
| **Levels shown** | L1-L3 in menu, L4-L5 on PLP | Part 3 §2.5, Part 5 §4.2 |
| **Images** | 48px brand logos + 60px product thumbs | Part 3 §2.4 |
| **Bottom row** | View All [Category] + View All Brands | Part 1 §1.2, Part 5 §4.1 |
| **Mobile pattern** | Hybrid accordion (L1-L2) + drill-down (L3+) | Part 4 §3.1, Part 5 §4.3 |
| **Touch targets** | 44×44px minimum | Part 3 §2.8, Part 4 §3.7 |
| **Animations** | Staggered fade 50ms/item (accordion), 200-300ms slide (push) | Part 4 §3.5 |
| **Unresolved** | 7 items — need CEO input | Part 6 §4.5 |
