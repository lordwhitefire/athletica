# Mega Menu UX Gap Analysis — Stream 3, Part C: Hierarchy Mapping + Appendix

> **Compiled by:** Probe-Beacon (Intelligence Team)
> **Task:** stream-3-mega-menu-ux-gap-analysis
> **Date:** 2026-07-19
> **Primary sources:** Part 5 §4.2 Table, Part 3 §2.2
> **Reports to:** Probe (Director of Intelligence)

---

## C.1 Definitive 5-Level Hierarchy Mapping

| Mega Menu Location | Level | Example | Content Type | Visual | Handled By |
|---|---|---|---|---|---|
| **Top-level nav bar** | Level 1: Category | "Boots" | Text link | Uppercase, 14-16px | Mega menu |
| **Column 1 heading** | Level 1: Category | "Boots" | Clickable heading + Edits | Bold heading + sub-links | Mega menu |
| **Column 2** | Level 2: Brand | "Nike", "Adidas" | 48px logo + brand name | Logo left, name right | Mega menu |
| **Column 3** | Level 3: Model | "Mercurial", "Phantom" | 60px thumbnail + model name | Thumbnail left, name right | Mega menu |
| **PLP sidebar/filters** | Level 4: Sub-model | "Vapor 16 Elite" | Filterable groups + thumbnails | Group heading + list | PLP facets |
| **PLP filter chips** | Level 5: Product Type | "FG", "AG", "TF", "SG" | Filter facet chips | Button group/checkbox | PLP facets |

**Source:** Part 5 §4.2 Table — exact mapping of mega menu locations to hierarchy levels

---

## C.2 Design Rationale

| Decision | Rationale | Source |
|---|---|---|
| Show Levels 1–3 in mega menu | NN/g: mega menus "can support 2–3 tiers" | Part 3 §2.2, NN/g (2024) |
| Level 4 on PLP | Decathlon's "Activities" sidebar for sibling nav | Part 1 §1.3, aureatelabs.com |
| Level 5 as filter facets | Standard eCommerce — Nike, Adidas use PLP filters | Part 1 §1.1, Part 1 §1.2 |
| Breadcrumbs on PLP | Full path: Boots > Nike > Mercurial > Vapor > FG | Part 5 §4.2, NN/g orientation |
| Left sidebar on PLP | Nike's nested sidebar + Decathlon "Activities" | Part 1 §1.1 (econsultancy.com), Part 1 §1.3 |
| URL structure | `/boots/nike/mercurial/?stud=fg` | Part 5 §4.2 |

---

## C.3 Competitor Hierarchy Comparison

| Site | Levels in Menu | Depth Strategy | Source |
|---|---|---|---|
| **Nike** | 2 (L1–L2) | Nested sidebar on PLP | Part 1 §1.1 |
| **Adidas** | 2 (L1–L2) | PLP filters only (no sidebar) | Part 1 §1.2 |
| **Decathlon** | 2 (L1–L2) | "Activities" sidebar on landing pages | Part 1 §1.3 |
| **Foot Locker** | 2 (L1–L2) | PLP facets + breadcrumbs | Part 2 §1.4 |
| **JD Sports** | 2 (L1–L2) | PLP facets + breadcrumbs | Part 2 §1.5 |
| **ASOS** | 2 (L1–L2) | Sub-nav + breadcrumbs on landing page | Part 2 §1.6 |
| **Zalando** | 2 (L1–L2) | Breadcrumbs + filter chips | Part 2 §1.7 |
| **▶ Athletica (proposed)** | **3 (L1–L3)** | **PLP facets + breadcrumbs + sidebar** | **This document** |

**Key insight:** All 7 competitors show only 2 levels in mega menus. Athletica's proposed 3-level display is more ambitious, justified by the 4-column layout with dedicated columns for Brands (L2) and Models (L3).

---

## Appendix: Source Reference Index

### Research Parts (6 files)

| Part | File | Content | Sources |
|---|---|---|---|
| Part 1 | mega-menu-ux-research-part1.md | Nike, Adidas, Decathlon | ~41 refs |
| Part 2 | mega-menu-ux-research-part2.md | Foot Locker, JD Sports, ASOS, Zalando + Tables | ~41 refs |
| Part 3 | mega-menu-ux-research-part3.md | Desktop Best Practices (columns, hover, images, cutoff, accessibility) | NN/g, Baymard, Smashing, Boundev |
| Part 4 | mega-menu-ux-research-part4.md | Mobile Strategy (hybrid accordion + drill-down, wireframes, accessibility) | NN/g, Boundev, Smashing, SGS |
| Part 5 | mega-menu-ux-research-part5.md | Athletica-Specific: wireframes, hierarchy mapping, mobile nav | All above |
| Part 6 | mega-menu-ux-research-part6.md | Unresolved items + 41 sources cited | All 41 |

### Unresolved Items (Require CEO Input)

Per Part 6 §4.5:

1. **Audience segmentation:** Gender-first or Category-first? (Nike = gender, JD = category)
2. **Exact category taxonomy:** Confirm Level 1 categories
3. **Surface types:** Confirm "By Surface" dimensions
4. **Brand list:** Which brands will Athletica carry?
5. **Mobile search persistence:** Search icon in header after hamburger opens?
6. **Cookie-based personalization:** Implement Zalando's cookie preference?
7. **Promotional column ownership:** Marketing team manages Column 4?

### Key Design Decisions Summary

| # | Decision | Recommendation | Spec Citations |
|---|---|---|---|
| 1 | Top-level nav | 6 text links | Part 5 §4.1, Part 1 §1.1 |
| 2 | Column count | 4 columns | Part 3 §2.1 |
| 3 | Column 1 | Category + Edits | Part 5 §4.1, Part 2 §1.5 |
| 4 | Column 2 | Brands with 48px logos | Part 5 §4.1, Part 2 §1.4 |
| 5 | Column 3 | Models with 60px thumbnails | Part 5 §4.1, Part 3 §2.4 |
| 6 | Column 4 | Single promo image + CTA | Part 5 §4.1, Part 2 §1.5 |
| 7 | Bottom row | View All [Category] + View All Brands | Part 5 §4.1, Part 1 §1.2 |
| 8 | Hover/Click | Click primary, hover secondary (400ms + triangle) | Part 3 §2.3 |
| 9 | Level cutoff | L1–L3 in menu, L4–L5 on PLP | Part 3 §2.2, §2.5, Part 5 §4.2 |
| 10 | Mobile pattern | Hybrid accordion (L1–L2) + drill-down (L3–L5) | Part 4 §3.1, Part 5 §4.3 |
| 11 | Touch targets | 44×44px minimum | Part 4 §3.7 |
| 12 | "View All" on mobile | At every level | Part 4 §3.5, Baymard |
| 13 | Mobile animations | Accordion: 50ms stagger; Push: 200–300ms slide | Part 4 §3.5 |
| 14 | Mobile breadcrumbs | "← Back to [Parent]" style | Part 4 §3.7, NN/g |
| 15 | Accessibility | WCAG 2.1 AA, keyboard, ARIA, reduced motion | Part 3 §2.8, Part 4 §3.7 |

---

*Document compiled by Probe-Beacon on 2026-07-19 from research parts 1–6 (41 sources total).*
*Reports to: Probe (Director of Intelligence).*
