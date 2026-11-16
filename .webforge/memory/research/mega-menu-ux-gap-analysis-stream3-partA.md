# Mega Menu UX Gap Analysis — Stream 3, Part A: Desktop Design (4-Column Mega Menu)

> **Compiled by:** Probe-Beacon (Intelligence Team)
> **Task:** stream-3-mega-menu-ux-gap-analysis
> **Date:** 2026-07-19
> **Primary sources:** Part 5 §4.1, Part 3 §2.1-2.8
> **Reports to:** Probe (Director of Intelligence)

---

## A.1 Top-Level Nav Bar

**Design:** 6 text-link items: `Boots | Clothing | Equipment | Accessories | Brands | Sale`

- **Count:** ~6 items, matching Nike's pattern of ~6 primary links per Part 1 §1.1: "New & Featured", "Men", "Women", "Kids", "Jordan", "Sale"
- **Style:** Pure text links — no icons, no dropdown arrows visible until interaction. Consistent with Nike's text-only minimalist nav bar per Part 1 §1.1
- **Inspiration:** Nike's ~6-item top-level nav (per Part 5 §4.1, citing styles.refero.design); JD Sports' consistent template (per Part 2 §1.5, citing Richard Ilott's redesign)
- **Unresolved:** `[NOT FOUND — ask CEO]` whether to split by Gender (Men's/Women's/Kids') or Category first. Both validated: Nike = audience-first (Part 1 §1.1), JD Sports = category-first (Part 2 §1.5). See Part 6 §4.5 item #1.

---

## A.2 Mega Menu Panel — 4-Column Layout

**Recommendation:** 4-column layout, per Part 3 §2.1: "3–5 columns maximum. For Athletica's 5-level hierarchy: 4 columns."

Research backing:
- NN/g: chunk options into "related sets" (Part 3 §2.1, citing nngroup.com/articles/mega-menus-work-well/)
- Baymard: users overwhelmed with >10 subcategory options (Part 3 §2.1, citing baymard.com)
- Boundev: mega menus outperform nested dropdowns for 50+ pages (Part 3 §2.1)
- Smashing Magazine: real-world examples use 4–5 columns (Part 3 §2.1)

### Column Breakdown

| Column | Content | Level | Size | Inspiration |
|---|---|---|---|---|
| **Column 1** | Category links + curated Edits | Level 1 | Text links | JD Sports "Edits" (Part 2 §1.5), Nike "New & Featured" (Part 1 §1.1) |
| **Column 2** | Brand logos (48px) + brand name | Level 2 | 48px logo + text | Foot Locker "Brands" column (Part 2 §1.4) |
| **Column 3** | Model thumbnails (60px) + model name | Level 3 | 60px thumbnail + text | Probe-Sable Part A §A4 (Part 5 §4.1) |
| **Column 4** | Featured/promotional image + CTA | Promo | Image + button | JD Sports `nav-promotions` (Part 2 §1.5) |

### A.2.1 Column 1 — Category + Edits

- **"View All [Category]"** as clickable heading → full category page (e.g., `/boots/`)
- **Curated "Edits" links:** New In, Best Sellers, By Surface (FG, AG, TF, SG)
- **Inspiration:** JD Sports' "Edits" as first column in every panel (Part 2 §1.5). Nike's Column 1 = "New & Featured" (Part 1 §1.1)
- **Athletica-specific:** "By Surface" is unique differentiator — adapts Adidas' dual-dimension nav (Part 1 §1.2, Part 5 §4.4)

### A.2.2 Column 2 — Brands (Level 2)

- Each brand: **[48×48px logo] + Brand Name**
- Brands: Nike, Adidas, Puma, New Balance, Mizuno, Umbro, etc. (per Part 5 §4.1)
- **Inspiration:** Foot Locker's "Brands" column (Part 2 §1.4), JD Sports' brand column (Part 2 §1.5)
- **Logo size:** 48px per Probe-Sable (Part 5 §4.1 citing Part A §A4)
- **Source:** NN/g "visual cues for long menus" (Part 3 §2.4); Baymard: thumbnails reduce hesitation 55% (2025)

### A.2.3 Column 3 — Models (Level 3)

- Each model: **[60×60px thumbnail] + Model Name**
- Top models per brand (Nike: Mercurial, Phantom, Tiempo)
- **Thumbnail size:** 60px per Probe-Sable (Part 5 §4.1 citing Part A §A4)
- **Scrolling:** Vertical scroll if model list exceeds viewport height (Part 5 §4.1, citing Boundev 2026)
- **No horizontal scrolling** within mega menu
- **Source:** NN/g "Images help select right option" (Part 3 §2.4, 2017); Baymard: thumbnails easy to interpret (2025)

### A.2.4 Column 4 — Featured/Promotional

- Single promotional image + "Shop All [Category]" CTA button
- **No carousel, auto-play, or complex widgets** — NN/g warns against "GUI widgets" (Part 3 §2.7, 2017)
- **Inspiration:** JD Sports' `nav-promotions` right-side column (Part 2 §1.5). Nike's optional promo block (Part 1 §1.1)
- **Ownership:** `[NOT FOUND — ask CEO]` who manages content? (Part 6 §4.5 item #7)

### A.2.5 Bottom Row

- Full-width row at bottom: Left — **[View All [Category] →]** | Right — **[View All Brands →]**
- **Inspiration:** Adidas's bold "All" links (Part 1 §1.2, citing econsultancy.com)
- **Visual:** Subtle horizontal separator above

---

## A.3 Hover/Click Behavior

| Aspect | Recommendation | Source |
|---|---|---|
| **Primary activation** | Click/tap to open — consistent across all devices | Part 3 §2.3, NN/g guideline #13 (2024) |
| **Secondary (mouse)** | Hover with 400ms intent delay | Part 3 §2.3, Baymard: 300-500ms required |
| **Diagonal movement** | Amazon triangle technique — trajectory triangle | Part 3 §2.3, bjk5.com (2012) |
| **Exit delay** | 500ms minimum before menu closes | Part 3 §2.3, NN/g (2017) |
| **Close methods** | Click outside panel, Escape, click same nav item | Part 5 §4.1 |
| **SVG exit areas** | Hakim el Hattab technique | Part 3 §2.3, Smashing Magazine (2021) |

Research: Smashing Mag: "click/tap causes less trouble" (Part 3 §2.3). Boundev: "never use hover-triggered" (2026). Baymard: 61% of sites lack hover delay (Part 3 §2.3).

---

## A.4 Level Cutoff

**Recommendation: Mega menu shows Levels 1–3. Levels 4–5 deferred to PLP.**

| Cutoff | What's Shown | Where |
|---|---|---|
| Level 1: Category | Top-level nav + Column 1 heading | Mega menu |
| Level 2: Brand | Column 2 — 48px logos | Mega menu |
| Level 3: Model | Column 3 — 60px thumbnails | Mega menu |
| Level 4: Sub-model | Filterable category groups | PLP sidebar |
| Level 5: Product Type | Filter facets (FG, AG, TF, SG) | PLP filter chips |

**Research:** NN/g: mega menus "support 2–3 tiers" — defer deeper (Part 3 §2.2, 2024). Boundev: "limit to 2 levels max" (Part 3 §2.2). Baymard: 76% of sites miss subcategories on intermediary pages (Part 3 §2.5). SGS case study: first 3 levels in HTML, deeper via JS (Part 3 §2.5, Smashing Magazine 2016).

**PLP:** Each L3 link → `/boots/nike/mercurial/`. L4 sub-models as filterable groups. L5 as filter chips. Breadcrumbs: `Boots > Nike > Mercurial > Vapor 16 Elite > FG`. Left sidebar with siblings (Nike sidebar + Decathlon "Activities" from Part 1 §1.3).

---

## A.5 ASCII Wireframe — Desktop Mega Menu

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Boots] [Clothing] [Equipment] [Accessories] [Brands] [Sale]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  COLUMN 1    │  │  COLUMN 2    │  │  COLUMN 3    │  │ COL 4   │ │
│  │  CATEGORY +  │  │  BRANDS      │  │  MODELS      │  │ FEATURED│ │
│  │  EDITS       │  │  (48px logo) │  │  (60px thumb)│  │         │ │
│  │              │  │              │  │              │  │         │ │
│  │ ▶ All Boots  │  │ [Nike logo]  │  │ [img]        │  │ [img]   │ │
│  │              │  │   Nike       │  │   Mercurial  │  │         │ │
│  │ Edits:       │  │              │  │   Phantom    │  │ Latest  │ │
│  │  › New In    │  │ [Adidas logo]│  │   Tiempo     │  │ Release │ │
│  │  › Best Sel. │  │   Adidas     │  │   X          │  │         │ │
│  │  › By Surface│  │              │  │   Predator   │  │         │ │
│  │    - FG      │  │ [Puma logo]  │  │              │  │ [CTA:   │ │
│  │    - AG      │  │   Puma       │  │ [img]        │  │ Shop →] │ │
│  │    - TF      │  │              │  │   Future 7   │  │         │ │
│  │    - SG      │  │ [New Balance]│  │   King       │  │         │ │
│  │              │  │ [Mizuno]     │  │              │  │         │ │
│  │              │  │ [Umbro]      │  │  (vertical   │  │         │ │
│  │              │  │              │  │   scroll)    │  │         │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                     │
│  [View All Boots →]                    [View All Brands →]          │
├─────────────────────────────────────────────────────────────────────┤
│  Utility: Track Order | Authenticity Guarantee | Pro Support        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## A.6 Patterns to Avoid

Per Part 3 §2.7:

| Pattern to Avoid | Why | Source |
|---|---|---|
| Cascading nested fly-out menus | Frustrating with 2+ tiers | NN/g (2024) |
| Hover-only with no delay | "Flickering" and accidental triggers | Baymard: 61% wrong |
| Multi-level hover inside mega menu | Users must re-open navigation repeatedly | Smashing Magazine (2021) |
| GUI widgets (carousels, etc.) | Mega menu is nav tool, not full page | NN/g (2017) |
| Horizontal scrolling | Disorients users | Boundev (2026) |

---

## A.7 Accessibility — Desktop

Per Part 3 §2.8:

- **Keyboard:** Tab/Shift+Tab top-level, Enter/Space open, Arrows within submenu, Escape close (WCAG 2.1 AA)
- **ARIA:** `aria-expanded` on parents, `aria-haspopup` for triggers, `role="navigation"` landmarks
- **Screen readers:** Two approaches — (a) simple click-through to page, (b) advanced screen reader plugin
- **Touch targets:** Minimum 44×44px for all clickable items
- **Focus indicators:** Visible focus styles on all navigable elements
- **Contrast:** WCAG AA 4.5:1 normal / 3:1 large text
- **Exit guard:** 500ms exit delay minimum

---

*End of Part A — continues in Part B (Mobile Design)*
