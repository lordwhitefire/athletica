# Mega Menu UX Research — Comprehensive Report for Athletica (Part 5: Athletica-Specific Recommendations)

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-ux-001
> **Date:** 2026-07-19
> **Synthesis from ALL input files.** Unresolved items marked `[NOT FOUND — ask CEO]`.

---

## Section 4: Athletica-Specific Recommendations

### 4.1 Recommended Desktop Mega Menu Wireframe

#### Top-Level Nav Bar
- **Level 1 categories** as text links: `Boots | Clothing | Equipment | Accessories | Brands | Sale`
- **Inspiration:** Nike's ~6-item top-level nav (per styles.refero.design); JD Sports' consistent template (per Richard Ilott's redesign)
- **Audience-first split?** `[NOT FOUND — ask CEO]` — decide if splitting by Gender (Men's/Women's) or Category first

#### Mega Menu Panel (4-Column Layout)

Wireframe when hovering/clicking "Boots":

```
┌──────────────────────────────────────────────────────────────────┐
│ [Boots] [Clothing] [Equipment] [Accessories] [Brands] [Sale]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COLUMN 1          │  COLUMN 2       │  COLUMN 3       │ COL 4   │
│  CATEGORY + EDITS  │  BRANDS         │  MODELS         │ FEATURED│
│                    │  (48px logos)   │  (60px thumbs)  │         │
│                    │                 │                 │         │
│  ▶ All Boots       │ [Nike logo]     │ [img]           │ [img]   │
│                    │   Nike          │   Mercurial     │         │
│  Edits:            │                 │   Phantom       │ Latest  │
│  › New In          │ [Adidas logo]   │   Tiempo        │ Release │
│  › Best Sellers    │   Adidas        │   X             │         │
│  › By Surface      │                 │   Predator      │         │
│    - FG            │ [Puma logo]     │                 │ [CTA:   │
│    - AG            │   Puma          │ [img]           │ Shop →] │
│    - TF            │   Ultra         │   Future 7      │         │
│    - SG            │                 │   King          │         │
│                    │                 │                 │         │
│                    │ [New Balance]   │ [img]           │         │
│                    │ [Mizuno]        │   Fresh Foam    │         │
│                    │                 │   Tekela        │         │
├──────────────────────────────────────────────────────────────────┤
│  [View All Boots →]          │  [View All Brands →]              │
└──────────────────────────────────────────────────────────────────┘
```

#### Column Descriptions

**Column 1 — Category links + Edits (Level 1)**
- "All Boots" as clickable heading → full Boots category page
- Curated "Edits": New In, Best Sellers, By Surface (FG, AG, TF, SG)
- Inspired by JD Sports' "Edits" column (per Richard Ilott's redesign) and Nike's "New & Featured" column
- "By Surface" is Athletica-specific — a unique differentiator for football boots

**Column 2 — Brand links with 48px logos (Level 2)**
- Each brand with a small logo (48×48px) before the name
- Brands: Nike, Adidas, Puma, New Balance, Mizuno, Umbro, etc.
- Inspired by Foot Locker's "Brands" column and JD Sports' brand column (per Probe-Wren)
- Logo size per Probe-Sable recommendation (Part A, §A4): "brand thumbs at 48px"
- Source: NN/g "visual cues for long menus" (2024); Baymard: thumbnails reduce hesitation (2025)

**Column 3 — Model links with 60px thumbnails (Level 3)**
- Each model with a small product thumbnail (60×60px)
- Top models per brand (Nike: Mercurial, Phantom, Tiempo, Zoom)
- Thumbnails at 60px per Probe-Sable (Part A, §A4)
- Vertical scroll if model list exceeds available space

**Column 4 — Featured/promotional column**
- Latest release spotlight with product image
- "Shop All [Category]" CTA button
- Single image only — no carousel, auto-play, or complex widgets
- Inspired by JD Sports' `nav-promotions` section and Nike's promo image block
- Source: NN/g warns against "GUI widgets" — keep to single CTA (per "Mega Menus Work Well", 2017)

**Bottom row:**
- "View All Boots" (left) — inspired by Adidas's bold "All" links (per econsultancy.com)
- "View All Brands" (right)
- Full-width, subtle visual separator

#### Hover/Click Behavior
- **Primary: Click to open** — consistent across devices (per NN/g guideline #13, 2024)
- **Secondary: Hover with 400ms delay** — for mouse users (per Baymard 300-500ms recommendation)
- **Amazon triangle technique** — trajectory triangle prevents accidental closes during diagonal movement (per bjk5.com)
- **Exit delay:** 500ms minimum before menu closes (per NN/g, "Mega Menus Work Well", 2017)
- **Close:** Click outside panel or Escape key

#### Scrolling
- Mega menu panel scrolls vertically if content exceeds viewport height
- No horizontal scroll within mega menu
- Source: Boundev (2026)

#### Cutoff
- Mega menu shows Levels 1-3
- Levels 4-5 handled via PLP filters + breadcrumbs
- Each Level 3 link → intermediary PLP: `/boots/nike/mercurial/`
- On PLP: Level 4 sub-models as filterable groups, Level 5 as filter facets
- Source: NN/g guideline #14 (2024); SGS case study (2016)

---

### 4.2 Athletica's 5-Level Hierarchy Mapping

| Mega Menu Location | Level | Example | Handled By |
|---|---|---|---|
| **Top-level nav bar** | Level 1: Category | "Boots" | Mega menu (text link) |
| **Column 2** | Level 2: Brand | "Nike", "Adidas", "Puma" | Mega menu (48px logos) |
| **Column 3** | Level 3: Model | "Mercurial", "Phantom" | Mega menu (60px thumbs) |
| **PLP Filters** | Level 4: Sub-model | "Vapor 16 Elite" | PLP faceted filters |
| **PLP Filters** | Level 5: Product Type | "FG", "AG", "TF", "SG" | PLP filter chips |

**Key design decisions:**

1. **Levels 1-3 in mega menu** — NN/g: mega menus "can support 2–3 tiers" (per "Menu-Design Checklist", 2024)

2. **Level 4-5 on PLP** — Decathlon's "Activities" sidebar pattern applies here (per aureatelabs.com)

3. **Breadcrumbs on PLP** — show full path: `Boots > Nike > Mercurial > Vapor 16 Elite > FG`

4. **Left sidebar on PLP** — sibling sub-models and parent categories (inspired by Nike's nested sidebar, per econsultancy.com)

5. **PLP URL structure** — `/boots/nike/mercurial/?stud=fg` or similar

---

### 4.3 Recommended Mobile Navigation

#### Structure
- **Hamburger icon** → opens **full-screen overlay**
- **Accordion for Level 1→2:** Tapping "Boots" expands inline to show brands
- **Push/drill-down for Level 2→3+:** Tapping "Nike" pushes a new screen showing models
- **Breadcrumb trail** at top of each drill-down screen (e.g., "Boots > Nike")
- **"View All" link** at every level
- **Search bar** persistent at top of nav overlay

#### Inspiration
- **Full-screen overlay:** Nike (per muffingroup.com)
- **Drill-down for deeper levels:** Foot Locker (Top 1% Baymard performer) + ASOS
- **Hybrid accordion + drill-down switch at Level 2:** Probe-Sable per NN/g + Boundev
- **Search-first approach:** Decathlon (per hmmh.de — "significantly more conversions")
- **"View All" links:** "Baymard: only 24% get it right" — high-impact, low-effort

#### Wireframe — Initial State

```
┌─────────────────────────────┐
│ ✕  Menu                  🔍 │
├─────────────────────────────┤
│ ▶ Boots                     │  ← Tap to expand accordion
│ ▶ Clothing                  │
│ ▶ Equipment                 │
│ ▶ Accessories               │
│ ▶ Sale                      │
├─────────────────────────────┤
│ [Brands] [Sports] [Help]    │
└─────────────────────────────┘
```

#### Wireframe — Accordion Expanded (Level 1→2)

```
┌─────────────────────────────┐
│ ✕  Menu                  🔍 │
├─────────────────────────────┤
│ ▼ Boots                     │  ← Expanded
│   ▶ All Boots               │     (→ = PLP link)
│   ▶ New In                  │
│   ▶ Best Sellers            │
│   ▶ Nike  →                 │     (→ = drill-down)
│   ▶ Adidas →                │
│   ▶ Puma  →                 │
│   ▶ View All Brands →       │
│ ▶ Clothing                  │  ← Collapsed below
│ ▶ Equipment                 │
│ ▶ Accessories               │
│ ▶ Sale                      │
└─────────────────────────────┘
```

#### Wireframe — Drill-Down (Level 3: Models)

```
┌─────────────────────────────┐
│ ← Back    Boots > Nike   🔍 │
├─────────────────────────────┤
│ ⚽ Nike Mercurial       →   │
│ ⚽ Nike Phantom         →   │
│ ⚽ Nike Tiempo          →   │
│ ⚽ Nike Zoom            →   │
│ [View All Nike Boots →]     │
└─────────────────────────────┘
```

#### Wireframe — Further Drill-Down (Level 4: Sub-models)

```
┌─────────────────────────────┐
│ ← Back    Nike > Mercurial  │
├─────────────────────────────┤
│ Superfly 9 Elite       →   │
│ Superfly 9 Pro         →   │
│ Superfly 9 Academy     →   │
│ Vapor 16 Elite         →   │
│ Vapor 16 Pro           →   │
│ Vapor 16 Academy       →   │
│ [View All Mercurial →]      │
└─────────────────────────────┘
```

---

### 4.4 Why This Layout Works for 5 Levels

1. **NN/g finding:** Mega menus "can support 2–3 tiers" (per "Menu-Design Checklist", 2024). Athletica shows Levels 1-3.

2. **Baymard finding:** Users overwhelmed beyond ~10 options per level (2025). 4-column layout chunks into manageable groups.

3. **Decathlon's search-nav hybrid:** "Significantly more conversions" (per hmmh.de). Integrate search with menu.

4. **Nike's audience-first approach:** Segments massive catalog (per exclusiveaddons.com, wpmet.com). Consider gender-first if applicable.

5. **Adidas's dual-dimension navigation:** Browse by Product Type AND by Sport (per wpmet.com). "By Surface" column adapts this for football boots.

6. **JD Sports' consistent template:** Same structure across all categories (per Richard Ilott). Apply 4-column template consistently.

7. **SGS 7-level case study:** Load L1-L3 in HTML, lazy-load deeper via JS (per Smashing Magazine, 2016). Apply this performance pattern.

8. **Foot Locker's Brand-as-column:** Validated by a Top 1% Baymard performer. Directly applicable since Level 2 = Brand.

9. **Nike + Foot Locker (Top 1% Baymard):** Both use hybrid accordion + drill-down on mobile (per Probe-Sable Part B). Validates the mobile pattern.

10. **Zalando's early segmentation:** Cookie-based preference skips re-selection (per happycoding). Apply Hick's Law — store user preferences.

---

*Continues in Part 6 (Unresolved Items + Sources Cited)*
