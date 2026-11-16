# Mega Menu UX Gap Analysis — Stream 3, Part B: Mobile Design (Hybrid Accordion + Drill-Down)

> **Compiled by:** Probe-Beacon (Intelligence Team)
> **Task:** stream-3-mega-menu-ux-gap-analysis
> **Date:** 2026-07-19
> **Primary sources:** Part 4 §3.1-3.7, Part 5 §4.3
> **Reports to:** Probe (Director of Intelligence)

---

## B.1 Recommended Pattern

**Hybrid Accordion + Drill-Down (Push Navigation)**

- **Level 1 → Level 2:** Accordion inside full-screen overlay. Tap expands inline.
- **Level 2 → Level 3:** Tap triggers push transition to new full-screen panel.
- **Level 3 → Level 4+:** Continue drill-down/push pattern.
- **Switch point:** At Level 2 (accordion for top levels, push for deep levels).

**Research backing:**
- NN/g (2017): "Sequential menus" recommended for deep hierarchies. Decision algorithm: <6 subcategories → accordion; 6–15 → section menu; 15+ → category landing page (Part 4 §3.1)
- NN/g (2024): Sequential navigation "can enable users to peruse a deep structure" (Part 4 §3.1, guideline #9)
- Boundev (2026): "Accordion for 2–3 levels, Drill-Down for deeper levels" (Part 4 §3.1)
- Smashing Magazine (2021): "Vertical accordions appear faster and more predictable than overlays" (Part 4 §3.1)
- SGS case study (2016): Expanded ancestors push content too far — switch to push at Level 2 solves this (Part 4 §3.2)

**Why hybrid works for 5 levels:**
- Levels 1–2 (Accordion): Sideways browsing — jump between brands without returning to root (Part 4 §3.2)
- Levels 3–5 (Drill-down): Full-screen focus avoids "nested doll navigation" problem (Part 4 §3.2)
- Competitor validation: Nike + Foot Locker (both Top 1% Baymard) use hybrid accordion + drill-down (Part 4 §3.6)
- Decision algorithm: Level 1 has 5–10 brands (accordion sweet spot). Level 3+ models may exceed 6 (justifies drill-down) (Part 4 §3.2)

---

## B.2 Initial State — Full-Screen Overlay

**Design:**
- Hamburger icon → full-screen overlay (slide-in drawer, left side)
- **Header:** Close (✕) at left, "Menu" title, Search icon (🔍) at far right
- **Body:** Level 1 categories as accordion rows with ▶ chevron
- **Footer:** Utility links: Brands, Sports, Help

**Wireframe — Initial State:**

```
┌──────────────────────────────┐
│ ✕  Menu                  🔍 │  ← Header: close + search
├──────────────────────────────┤
│                              │
│ ▶ Boots                      │  ← Level 1 accordion (collapsed)
│ ▶ Clothing                   │
│ ▶ Equipment                  │
│ ▶ Accessories                │
│ ▶ Brands                     │
│ ▶ Sale                       │
│                              │
├──────────────────────────────┤
│ [Brands] [Sports] [Help]     │  ← Utility footer
└──────────────────────────────┘
```

**Source:** Part 5 §4.3 wireframe; Nike full-screen overlay per Part 1 §1.1 (muffingroup.com)

---

## B.3 Expanded Accordion — Level 1 → Level 2

**Design:**
- Tap Level 1 (e.g., "Boots") → expands inline with ▼ chevron
- Shows: "View All [Category]" link, curated Edits (New In, Best Sellers)
- Brands with → arrow indicating drill-down capability
- Indentation: 16–20px per level (Part 4 §3.5)
- Animation: staggered fade-in ~50ms per item (Part 4 §3.5, muffingroup.com)

**Wireframe — Accordion Expanded:**

```
┌──────────────────────────────┐
│ ✕  Menu                  🔍 │
├──────────────────────────────┤
│                              │
│ ▼ Boots                      │  ← Expanded accordion
│   ▶ All Boots                │      (PLP link)
│   ▶ New In                   │      (curated edit)
│   ▶ Best Sellers             │      (curated edit)
│   ▶ Nike                  →  │      (drill-down arrow)
│   ▶ Adidas                →  │
│   ▶ Puma                  →  │
│   ▶ View All Brands       →  │
│                              │
│ ▶ Clothing                   │  ← Collapsed
│ ▶ Equipment                  │
│ ▶ Accessories                │
│ ▶ Brands                     │
│ ▶ Sale                       │
└──────────────────────────────┘
```

**Source:** Part 5 §4.3; Part 4 §3.5 accordion behavior; Nike accordion per Part 1 §1.1

---

## B.4 Drill-Down — Level 2 → Level 3+ (Push Navigation)

**Design:**
- Tap Level 2 brand (e.g., "Nike") → pushes new panel sliding from right
- **Header:** "← Back" breadcrumb (e.g., "← Back to Boots > Nike")
- **Body:** Level 3 models with 60px thumbnails + → arrows
- **Footer:** "View All [Category]" link
- **Animation:** CSS transform slide 200–300ms (Part 4 §3.5, SGS case study)
- **Touch targets:** Min 44×44px (Part 4 §3.7)

**Wireframe — Level 3 Push (Models):**

```
┌──────────────────────────────┐
│ ← Back    Boots > Nike   🔍 │  ← Breadcrumb trail + back
├──────────────────────────────┤
│                              │
│ ⚽ Nike Mercurial         →  │  ← Level 3 model
│ ⚽ Nike Phantom           →  │
│ ⚽ Nike Tiempo            →  │
│ ⚽ Nike Zoom              →  │
│ ⚽ Nike Premier III       →  │
│                              │
│ [View All Nike Boots →]      │  ← "View All" per level
│                              │
└──────────────────────────────┘
```

**Wireframe — Level 4 Push (Sub-models):**

```
┌──────────────────────────────┐
│ ← Back    Nike > Mercurial   │  ← Progressive breadcrumb
├──────────────────────────────┤
│                              │
│ Superfly 9 Elite         →  │  ← Level 4 sub-model
│ Superfly 9 Pro           →  │
│ Superfly 9 Academy       →  │
│ Vapor 16 Elite           →  │
│ Vapor 16 Pro             →  │
│ Vapor 16 Academy         →  │
│                              │
│ [View All Mercurial →]       │
│                              │
└──────────────────────────────┘
```

**Source:** Part 5 §4.3 wireframes; Part 4 §3.4 ASCII wireframes; Foot Locker push navigation per Part 2 §1.4, Part 4 §3.6

---

## B.5 Key Implementation Details

Per Part 4 §3.5 and §3.7:

| Aspect | Specification | Source |
|---|---|---|
| **Overlay** | Full-screen slide-in (left drawer), not partial | Part 4 §3.5 |
| **Push animation** | CSS transform slide, 200–300ms | Part 4 §3.5, SGS case study |
| **Accordion animation** | Staggered fade-in ~50ms per item | Part 4 §3.5, muffingroup.com |
| **Breadcrumb style** | "← Back to [Parent]", not generic "Back" | Part 4 §3.7, NN/g (2017) |
| **Touch targets** | Min 44×44px, ideally 48×48dp | Part 4 §3.7, NN/g + Material Design 3 |
| **Indentation** | 16–20px per hierarchy level | Part 4 §3.5 |
| **"View All" links** | At every level — only 24% of sites do this | Part 4 §3.5, Baymard |
| **Icons** | ▶ for drill-down, ▼ for accordion, → for links | Part 4 §3.5, Smashing Magazine (2022) |
| **Search** | Persistent at top of nav overlay | Part 4 §3.5, Decathlon per hmmh.de |
| **Performance** | Load L1–L3 in HTML, lazy-load deeper via JS | Part 4 §3.5, SGS case study |
| **Reduced motion** | Support `prefers-reduced-motion` — disable slides | Part 4 §3.7, WCAG 2.1 2.3.3 |
| **Focus management** | On push, move focus to heading. On close, return to trigger. | Part 4 §3.7, WCAG 2.1 2.4.3 |

---

## B.6 Accessibility — Mobile

Per Part 4 §3.7:

- **Keyboard:** Tab, Arrow keys, Enter/Space, Escape
- **Screen readers:** `aria-expanded` + `aria-controls` for accordion, `aria-current="page"` for current category
- **Motion sensitivity:** `prefers-reduced-motion` support
- **Touch targets:** Minimum 44×44px
- **Focus management:** Move focus to panel heading on drill-down; return to trigger on close
- **Contrast:** WCAG AA (4.5:1 normal text)
- **Orientation:** Support portrait + landscape. In landscape, consider split-menu showing two levels
- **Back button:** Use breadcrumb-style "← Back to [Parent]" — avoid confusion with browser back

---

## B.7 Patterns to Avoid (Mobile)

Per Part 4 §3.3:

| Pattern | Why Rejected | Source |
|---|---|---|
| Pure Accordion (all 5 levels) | 5 levels = loss of context, "nested doll" problem | NN/g, SGS case study |
| Pure Drill-Down (all levels) | No sideways browsing — must return to root | NN/g: "can disorient users" |
| Hamburger-only | Discoverability cut ~50%, users don't explore | NN/g |
| Category Landing Pages for nav | Page load for every switch — high interaction cost | General UX |
| Section Menus only | Only works in one section | Probe-Sable analysis |

---

*End of Part B — continues in Part C (Hierarchy Mapping)*
