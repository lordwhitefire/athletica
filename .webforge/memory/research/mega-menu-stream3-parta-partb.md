# Mega Menu UX Gap Analysis — Stream 3: Recommended Design (Part A: Desktop + Part B: Mobile)

> **Compiled by:** Probe-Beacon (Intelligence Team Member)
> **Task:** stream-3-mega-menu-ux-gap-analysis
> **Date:** 2026-07-19
> **Sources:** mega-menu-ux-research-part1.md through part6.md; current MegaMenu.tsx, navigation.json

---

## PART A: Desktop Design

### A1. 4-Column Layout Recommendation

Per mega-menu-ux-research-part3.md §2.1: "For Athletica's 5-level hierarchy: 4 columns." Backed by NN/g chunking, Baymard (~10 items max), and Boundev multi-column recommendation. Also per mega-menu-ux-research-part5.md §4.1 wireframe.

### Column 1 — Category Edits (Level 1)
- **"All [Category]"** clickable heading → full category page
- **Curated Edits:** New In, Best Sellers, By Surface (FG, AG, TF, SG)
- **By Surface** is Athletica-specific differentiator for football boots
- **Inspiration:** JD Sports' "Edits" column (per mega-menu-ux-research-part2.md §1.5: "Column 1: Edits (curated collections: New In, Summer Edit, Holiday Shop)")
- **Inspiration:** Nike's "New & Featured" column (per mega-menu-ux-research-part1.md §1.1: "Column 1: New & Featured (curated links: New Releases, Best Sellers, Latest Drops)")
- **Source:** mega-menu-ux-research-part5.md §4.1: "Curated 'Edits': New In, Best Sellers, By Surface"

### Column 2 — Brands with 48px Logos (Level 2)
- Each brand with small logo (48×48px) before brand name
- Brands list: Nike, Adidas, Puma, New Balance, Mizuno, Umbro, etc.
- Brand names as clickable links → brand category page
- **Inspiration:** Foot Locker's "Brands" column (per mega-menu-ux-research-part2.md §1.4: "Each mega menu panel includes a dedicated 'Brands' column listing top brands")
- **Logo size:** Per mega-menu-ux-research-part3.md §2.4: "Small brand logos (48×48px)"
- **Source:** mega-menu-ux-research-part5.md §4.1: "Each brand with a small logo (48×48px)"

### Column 3 — Models with 60px Thumbnails (Level 3)
- Each model with small product thumbnail (60×60px)
- Top models grouped by brand (Nike: Mercurial, Phantom, Tiempo, Zoom)
- Model names as clickable links → model PLP
- Vertical scroll if model list exceeds viewport height (no horizontal scroll)
- **Thumbnail size:** Per mega-menu-ux-research-part3.md §2.4: "Small product thumbnails (60×60px)"
- **Scrolling:** Per mega-menu-ux-research-part5.md §4.1: "Vertical scroll if model list exceeds available space"
- **Source:** mega-menu-ux-research-part5.md §4.1 Column 3 wireframe

### Column 4 — Featured/Promotional (Single CTA)
- Single promotional image (latest release spotlight)
- "Shop All [Category]" or "Shop Now" CTA button
- **Single image only** — no carousel, auto-play, or complex widgets
- **Anti-pattern:** Per mega-menu-ux-research-part3.md §2.7: "Avoid carousels, accordions within the menu"
- **Inspiration:** JD Sports' `nav-promotions` (per mega-menu-ux-research-part2.md §1.5); Nike's promo image block (per mega-menu-ux-research-part1.md §1.1)
- **Source:** mega-menu-ux-research-part5.md §4.1: "Single image only — no carousel, auto-play, or complex widgets"

### Bottom Row Design
- "View All [Category]" (left-aligned) | "View All Brands" (right-aligned)
- Full-width row with subtle visual separator (border-top)
- **Inspiration:** Adidas's bold "All" links (per mega-menu-ux-research-part1.md §1.2)
- **Source:** mega-menu-ux-research-part5.md §4.1 bottom row

---

### A2. Top-Level Nav Reduction Strategy

**Current: 11 items in navigation.json:** Boots, Multi-Stud Boots, Indoor Shoes, Shin Guards, Balls, Socks, Jerseys, Kits, Apparel, Clothing, Accessories

**Research says max 6 top-level items** (per mega-menu-ux-research-part3.md §2.1: NN/g chunking guidance). Per mega-menu-ux-research-part2.md §1.8: Nike ~6, Adidas ~5, Foot Locker 7, JD Sports 7.

**Proposed consolidation to 6:**

| Top-Level Item | Includes From Current |
|---|---|
| **Boots** | Boots + Multi-Stud Boots + Indoor Shoes |
| **Jerseys/Kits** | Jerseys + Kits |
| **Clothing** | Clothing + Apparel |
| **Accessories** | Accessories + Shin Guards + Socks + Balls |
| **Brands** | Brand directory (A–Z) |
| **Sale** | Promotional/discounted items |

**Strategy rationale:** Per mega-menu-ux-research-part5.md §4.1: "Level 1 categories as text links: Boots | Clothing | Equipment | Accessories | Brands | Sale". Per mega-menu-ux-research-part5.md §4.1: "Nike's ~6-item top-level nav (per styles.refero.design); JD Sports' consistent template"

**Source:** mega-menu-ux-research-part3.md §2.1, mega-menu-ux-research-part5.md §4.1

---

### A3. Hover/Click Behavior Design

**Primary: Click-to-open** — consistent across devices.
- Per mega-menu-ux-research-part3.md §2.3: "Use Click-Activated (Rather Than Hover-Activated) Submenus" (NN/g guideline #13, 2024)
- Per mega-menu-ux-research-part3.md §2.3: Boundev (2026): "Click activation is more precise"

**Secondary: Hover with 400ms delay** for mouse users.
- Per mega-menu-ux-research-part3.md §2.3: "Hover with 400ms delay + Amazon triangle technique"
- Per mega-menu-ux-research-part5.md §4.1: "Secondary: Hover with 400ms delay"

**Amazon triangle technique** — trajectory triangle prevents accidental closes during diagonal movement toward submenu items.
- Per mega-menu-ux-research-part3.md §2.3: Source: bjk5.com

**Exit delay: 500ms minimum** before menu closes on mouse leave.
- Per mega-menu-ux-research-part3.md §2.3: Source: NN/g, "Mega Menus Work Well", 2017

**Close behaviors:** Click outside panel, Escape key, or clicking a nav link

**Source:** mega-menu-ux-research-part3.md §2.3, mega-menu-ux-research-part5.md §4.1

---

### A4. Level Cutoff Design

**Mega menu shows Levels 1-3 only.** Levels 4-5 deferred to PLP.

| Mega Menu | Level | Example | Handled By |
|---|---|---|---|
| Top-level nav bar | L1: Category | "Boots" | Menu text link |
| Column 2 | L2: Brand | "Nike" | Menu with 48px logos |
| Column 3 | L3: Model | "Mercurial" | Menu with 60px thumbs |
| PLP Filters | L4: Sub-model | "Vapor 16 Elite" | PLP faceted filters |
| PLP Filters | L5: Product Type | "FG, AG, TF" | PLP filter chips |

**Cutoff rationale:** Per mega-menu-ux-research-part3.md §2.5: NN/g: mega menus "can support 2–3 tiers" and recommends routing pages for deeper levels. Per mega-menu-ux-research-part5.md §4.2: "Levels 1-3 in mega menu — NN/g: 'can support 2–3 tiers'"

**PLP handling for L4-L5:**
- L4 sub-models as filterable category groups with thumbnails
- L5 Product Type as filter facets (checkbox/button group)
- Breadcrumbs on PLP: `Boots > Nike > Mercurial > Vapor 16 Elite > FG`
- Left sidebar on PLP showing sibling sub-models (inspired by Nike's nested sidebar per mega-menu-ux-research-part1.md §1.1; Decathlon's "Activities" sidebar per mega-menu-ux-research-part1.md §1.3)

**Source:** mega-menu-ux-research-part3.md §2.5, mega-menu-ux-research-part5.md §4.2

---

### A5. Bottom Row Design Details
- Full-width row at bottom of mega menu panel
- Subtle visual separator (1px border-top)
- Left: "View All [Category] →" link
- Right: "View All Brands →" link
- Bold, uppercase, with arrow indicator
- Hover state: accent color change

**Source:** mega-menu-ux-research-part1.md §1.2 (Adidas); mega-menu-ux-research-part5.md §4.1

---

## PART B: Mobile Design

### B1. Hybrid Accordion + Drill-Down Design

**Pattern:** Hybrid accordion (L1→L2) + drill-down/push navigation (L2→L3+).

Per mega-menu-ux-research-part4.md §3.1:
- **Level 1 → Level 2:** Accordion inside full-screen overlay. Tapping L1 expands inline to show L2 brands
- **Level 2 → Level 3+:** Push transition to new full-screen panel. Each tap pushes a new screen.

**Switch point at Level 2** per NN/g decision algorithm (mega-menu-ux-research-part4.md §3.1):
- <6 subcategories → accordion/submenu
- 6–15 → section menu
- 15+ → category landing page

**Why hybrid works:**
- Levels 1–2 (Accordion): Users see all top-level categories at once, supports "sideways browsing"
- Levels 3–5 (Drill-down): Full-screen focus on branch. Avoids "nested doll navigation" (NN/g term)
- Per mega-menu-ux-research-part4.md §3.2: Accordions fail at depth because expanded ancestors push content too far down

**Source:** mega-menu-ux-research-part4.md §3.1-3.2, mega-menu-ux-research-part5.md §4.3

---

### B2. Full-Screen Overlay Design

**Overlay:** Hamburger icon → full-screen overlay (left-side slide-in drawer). Nike-style per mega-menu-ux-research-part1.md §1.1.

**Persistent search bar** at top of overlay (Decathlon's search-first per mega-menu-ux-research-part1.md §1.3).

**"View All" links at every level** — per mega-menu-ux-research-part4.md §3.5: Baymard: "only 24% get it right", high-impact low-effort.

**Touch targets:** 44×44px minimum (per mega-menu-ux-research-part4.md §3.7, NN/g; Material Design 3).

**Animations:**
- **Accordion:** Staggered fade-in ~50ms per item (Nike-style per muffingroup.com, mega-menu-ux-research-part4.md §3.5)
- **Drill-down:** CSS transform slide, 200–300ms (SGS case study per mega-menu-ux-research-part4.md §3.5)

**Icons:** Chevron-right (→) for drill-down items (L3+), chevron-down (▼) for accordion expand (L1→L2)

**Performance:** Load L1–L3 in HTML by default, lazy-load deeper branches via JS on intent (SGS case study per mega-menu-ux-research-part4.md §3.5)

**Source:** mega-menu-ux-research-part4.md §3.5, §3.7

---

### B3. Wireframes for Mobile

#### Wireframe 1: Initial State (Full-Screen Overlay with Search)
```
┌─────────────────────────────┐
│ ✕  Menu                  🔍 │
├─────────────────────────────┤
│ ▶ Boots                     │
│ ▶ Jerseys/Kits              │
│ ▶ Clothing                  │
│ ▶ Accessories               │
│ ▶ Brands                    │
│ ▶ Sale                      │
├─────────────────────────────┤
│ [Help] [Track Order] [Sign In]
└─────────────────────────────┘
```
_Per mega-menu-ux-research-part5.md §4.3 — adapted with consolidated nav_

#### Wireframe 2: Expanded Accordion (L1→L2 with Drill-Down Arrows)
```
┌─────────────────────────────┐
│ ✕  Menu                  🔍 │
├─────────────────────────────┤
│ ▼ Boots                     │
│   ▶ All Boots               │
│   ▶ New In                  │
│   ▶ Best Sellers            │
│   ▶ By Surface  ▶           │
│   ▶ Nike  →                 │
│   ▶ Adidas →                │
│   ▶ Puma  →                 │
│   ▶ View All Brands →       │
│ ▶ Jerseys/Kits              │
│ ▶ Clothing                  │
│ ▶ Accessories               │
└─────────────────────────────┘
```
_Per mega-menu-ux-research-part5.md §4.3_

#### Wireframe 3: Drill-Down L3 (Models)
```
┌─────────────────────────────┐
│ ← Back    Boots > Nike   🔍 │
├─────────────────────────────┤
│ ⚽ Nike Mercurial       →   │
│ ⚽ Nike Phantom         →   │
│ ⚽ Nike Tiempo          →   │
│ ⚽ Nike Zoom            →   │
│                             │
│ [View All Nike Boots →]     │
└─────────────────────────────┘
```
_Per mega-menu-ux-research-part5.md §4.3_

#### Wireframe 4: Drill-Down L4 (Sub-models)
```
┌─────────────────────────────┐
│ ← Back    Nike > Mercurial  │
├─────────────────────────────┤
│ Superfly 9 Elite       →   │
│ Superfly 9 Pro         →   │
│ Superfly 9 Academy     →   │
│ Vapor 16 Elite         →   │
│ Vapor 16 Pro           →   │
│                             │
│ [View All Mercurial →]      │
└─────────────────────────────┘
```
_Per mega-menu-ux-research-part5.md §4.3_

**Source:** mega-menu-ux-research-part5.md §4.3 wireframes, mega-menu-ux-research-part4.md §3.4 diagrams

---

## Current Implementation Analysis (MegaMenu.tsx)

**Gaps between current code and recommended design:**

1. **Column structure is algorithmic** — current `buildColumns()` creates dynamic columns based on L2/L3/L4 counts. Recommended design proposes fixed 4-column layout with specific roles.

2. **Missing Column 1 (Edits)** — current shows L2-L4 items only. No curated "Edits" column.

3. **No bottom row** — no "View All [Category]" or "View All Brands" links.

4. **No brand logos or product thumbnails** — text-only. Recommended has 48px logos (C2) and 60px thumbs (C3).

5. **No hover/click differentiation** — no 400ms delay, Amazon triangle, or 500ms exit delay.

6. **Right sidebar is "Quick Links"** — current has Track Order/Authenticity/Pro Support. Recommended replaces with Column 4 featured promotional content.

7. **No level cutoff** — current attempts L2-L4 in menu with complex batching. Recommended shows L1-L3 only.
