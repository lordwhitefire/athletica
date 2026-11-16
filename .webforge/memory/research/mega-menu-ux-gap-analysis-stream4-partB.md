# Mega Menu UX Gap Analysis — Stream 4 Part B: Phased Implementation Plan

> **Compiled by:** Probe-Sable | **Task:** task-mega-menu-ux-3level-001 | **Date:** 2026-07-19
> **Sources:** Part A analysis, Part 3 (§2.1-2.6), Part 4 (§3.1-3.5), Part 5 (§4.1-4.3)

---

## Overview

**4 phases, 11-17 days total.**

Build order: Foundation → Desktop → Mobile → Polish. Mobile can start in parallel with Desktop once Foundation is done.

---

## Phase 1 — Foundation (2-3 days)

**Goal:** Prepare types, data, and column-building logic.

| # | Task | Details | Effort | Source |
|---|------|---------|--------|--------|
| 1.1 | Refactor `Column` interface | Add `ColumnType` discriminator. Create `BrandColumnItem`, `ModelColumnItem`, `FeaturedColumnItem`, `CategoryColumnItem` | 2h | Part 5 §4.1 |
| 1.2 | Add image fields to `NavItem` | Add `logoUrl?`, `thumbnailUrl?`, `promoImageUrl?` to `navigation.ts` | 1h | Part 5 §4.1 |
| 1.3 | Update navigation data | Add `logoUrl` to Level 2 items, `thumbnailUrl` to Level 3 items, `promoImageUrl` to Level 1 items in Sanity/navigation.json | 4h | Part 5 §4.2 |
| 1.4 | Rewrite `buildColumns()` | Replace auto-packing with `buildCategoryColumn()`, `buildBrandsColumn()`, `buildModelsColumn()`, `buildFeaturedColumn()`, `buildBottomLinks()` | 4h | Part 3 §2.1 |
| 1.5 | Add bottom-link extraction | Separate "View All" links into dedicated structure | 1h | Part 5 §4.1 |
| 1.6 | Test type changes | Verify all existing callers compile with new types | 2h | — |

**Deliverable:** Updated `navigation.ts` types, updated `navigation.json`, new `buildColumns()` returning typed columns.

**Dependencies:** None.

**Risk:** Image fields may not exist in Sanity schema yet — coordinate with CMS team to add `logoUrl`, `thumbnailUrl` to the navigation document type.

---

## Phase 2 — Desktop Mega Menu (3-5 days)

**Goal:** Full desktop: 4-column layout with images, interactions, bottom row.

| # | Task | Details | Effort | Source |
|---|------|---------|--------|--------|
| 2.1 | `renderCategoryColumn()` | Heading link "▶ All Boots" + edit links (New In, Best Sellers, By Surface) + subcategory links | 2h | Part 5 §4.1 C1 |
| 2.2 | `renderBrandsColumn()` | 48×48 brand logos + names, vertical list | 2h | Part 5 §4.1 C2 |
| 2.3 | `renderModelsColumn()` | 60×60 model thumbnails + names, grouped by brand, vertical scroll | 3h | Part 5 §4.1 C3 |
| 2.4 | `renderFeaturedColumn()` | Single promo image (aspect ratio), heading, desc, "Shop →" CTA button | 2h | Part 5 §4.1 C4 |
| 2.5 | Bottom "View All" row | Full-width row with left "View All Boots" and right "View All Brands" | 1h | Part 5 §4.1 |
| 2.6 | Top-level nav bar | Render all 11 categories as horizontal links, highlight active category | 4h | Part 5 §4.1 |
| 2.7 | Click-to-open | Click top-level nav item opens its mega menu panel | 2h | Part 3 §2.5 |
| 2.8 | 400ms hover delay | `setTimeout`-based hover with cleanup on `onMouseLeave` | 2h | Part 3 §2.5 |
| 2.9 | Amazon triangle | Invisible SVG triangle between nav bar and panel | 2h | Part 3 §2.5 |
| 2.10 | 500ms exit delay | Debounce before closing when mouse leaves panel | 1h | Part 3 §2.5 |
| 2.11 | Escape to close | `keydown` listener with cleanup | 1h | Part 3 §2.5 |
| 2.12 | Click-outside close | Backdrop or ref-based detection | 1h | Part 3 §2.5 |
| 2.13 | Remove old sidebar | Delete Quick Links sidebar (lines 293-318) | 0.5h | Part 3 §2.1 |
| 2.14 | Vertical scroll columns | `overflow-y-auto` + `max-h-[70vh]` for Columns 2 and 3 | 0.5h | Part 5 §4.1 |
| 2.15 | Responsive testing | Test at 1024px, 1280px, 1440px, 1920px | 2h | Part 3 §2.1 |

**Deliverable:** Working desktop mega menu with 4-column layout, images, complete interaction model, and bottom row.

**Dependencies:** Phase 1 complete.

**Risk:** 2.9 (Amazon triangle) is non-trivial — requires coordinate math for the SVG polygon. Consider using `pointer-events` approach on a full-width bridge element instead.

---

## Phase 3 — Mobile Navigation (4-6 days)

**Goal:** Full mobile nav with hamburger, accordion, drill-down, animations, accessibility.

| # | Task | Details | Effort | Source |
|---|------|---------|--------|--------|
| 3.1 | `MobileNav` component shell | Hamburger icon + full-screen overlay with close button | 4h | Part 4 §3.2 |
| 3.2 | Accordion L1→L2 | Tapping category expands inline brand list. `aria-expanded`, chevron icons | 4h | Part 4 §3.1 |
| 3.3 | Drill-down L2→L3+ | Tapping brand pushes new full-screen panel. Navigation stack state | 6h | Part 4 §3.1 |
| 3.4 | Breadcrumb trail | "← Back" + path (Boots > Nike) at top of drill-down screens | 2h | Part 4 §3.1 |
| 3.5 | Persistent search bar | Search input at overlay top, focus handler, autocomplete integration | 2h | Part 4 §3.3 |
| 3.6 | "View All" links | "View All Boots", "View All Nike Boots", etc. at every level | 1h | Part 4 §3.1 |
| 3.7 | Push/back animations | CSS transforms 200-300ms using Framer Motion `AnimatePresence` | 4h | Part 4 §3.5 |
| 3.8 | Conditional lazy loading | L1-L3 in HTML, dynamic import for L4+ | 2h | Part 4 §3.5 |
| 3.9 | Touch targets | 44×44px minimum via `min-h-[44px]` classes | 1h | Part 4 §3.5 |
| 3.10 | `aria-expanded` | All accordion toggles, drill-down triggers | 1h | Part 4 §3.5 |
| 3.11 | Focus management | Focus trapped in overlay, restored to hamburger on close | 2h | Part 4 §3.5 |
| 3.12 | Reduced motion | `prefers-reduced-motion` query → disable animations | 1h | Part 4 §3.5 |
| 3.13 | Overlay scroll lock | `document.body.style.overflow = 'hidden'` | 0.5h | Part 4 §3.5 |
| 3.14 | Close button | ✕ in top-right, fixed position within overlay | 0.5h | Part 4 §3.1 |
| 3.15 | Integration point | Render `MobileNav` at breakpoint <1024px, `MegaMenu` at >=1024px | 2h | Part 4 §3.2 |

**Deliverable:** Full mobile navigation with accordion + drill-down, animations, search, and accessibility.

**Dependencies:** Phase 1 complete. Can parallel Phase 2.

**Risk:** 3.3 (drill-down stack management) is the most complex part. Recommend using Zustand or Context for stack state to avoid prop-drilling through 4+ levels.

---

## Phase 4 — Polish & Refinement (2-3 days)

**Goal:** Animations, accessibility audit, performance, cross-browser testing.

| # | Task | Details | Effort | Source |
|---|------|---------|--------|--------|
| 4.1 | Desktop open/close animation | Framer Motion fade-in + slide-down for mega menu panel | 2h | Part 3 §2.5 |
| 4.2 | Accessibility audit | Full audit: aria labels, focus management, keyboard nav, screen reader | 4h | Part 3 §2.4 |
| 4.3 | Focus trap | Tab cycles within mega menu when open | 1h | Part 3 §2.4 |
| 4.4 | Keyboard navigation | Arrow keys navigate between columns and items | 2h | Part 3 §2.4 |
| 4.5 | Performance: lazy load L4+ | Dynamic imports for deep levels | 1h | Part 3 §2.6 |
| 4.6 | Image optimization | Next.js `<Image>` with `sizes`, `loading="lazy"`, `priority` for above-fold | 2h | Part 5 §4.1 |
| 4.7 | Responsive breakpoints | Test 1024/1280/1440/1920 for desktop, 320/375/414/768 for mobile | 3h | Part 4 §3.5 |
| 4.8 | Reduced motion | Verify all animations respect `prefers-reduced-motion` | 1h | Part 4 §3.5 |
| 4.9 | URL deep-linking | `window.location.hash` → open specific category menu | 1h | Part 3 §2.6 |
| 4.10 | Lint + type check | `bun run lint`, `bun run typecheck` — 0 errors | 1h | — |

**Deliverable:** Production-ready mega menu with animations, accessibility, and performance optimization.

**Dependencies:** Phases 2 + 3 complete.

---

## Critical Path & Parallelization

```
Phase 1: Foundation (2-3d)
  ├──> Phase 2: Desktop (3-5d) — depends on Phase 1
  └──> Phase 3: Mobile (4-6d) — depends on Phase 1 (parallel with Phase 2)
        └──> Phase 4: Polish (2-3d) — depends on Phase 2 + Phase 3
```

**Minimum timeline:** 2 + max(5, 6) + 3 = 11 days (if Desktop and Mobile are staffed in parallel).
**Maximum timeline:** 3 + 5 + 6 + 3 = 17 days (sequential).

---

## Effort Summary

| Phase | Days | Dev-hours | Files Changed | Lines Added |
|-------|------|-----------|---------------|-------------|
| 1 — Foundation | 2-3 | 14 | 3 | ~120 |
| 2 — Desktop | 3-5 | 26 | 1 | ~350 |
| 3 — Mobile | 4-6 | 33 | 1-2 (new) | ~300 |
| 4 — Polish | 2-3 | 18 | 2-3 | ~80 |
| **Total** | **11-17** | **~91** | **4-5** | **~850** |

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Image URLs not available in Sanity | Medium | High (Phase 1 blocked) | Add `logoUrl`/`thumbnailUrl` to Sanity nav schema first |
| Phase 2 + 3 parallel requires 2 devs | Medium | Medium | If only 1 dev, do sequential (17 days) |
| Amazon triangle SVG math | Low | Medium | Use `pointer-events: all` bridge div instead |
| Mobile drill-down stack complexity | Medium | High | Use Zustand/Context for stack state |
| Lazy loading L4+ may cause flicker | Low | Low | Preload in viewport + skeleton states |
| CEO input needed (unresolved items) | High | High | Resolve before Phase 2 starts (see Part 6 §4.5) |

---

## Unresolved Items [NOT FOUND — ask CEO]

Per Part 6 §4.5, these must be resolved before Phase 2 can proceed:

1. **Audience segmentation:** Gender-first (Men's/Women's/Kids') or Category-first (Boots/Clothing)?
2. **Exact L1 categories:** Confirm final top-level category list (current JSON has ~11 categories)
3. **"By Surface" filter:** Is FG/AG/TF/SG the correct second-dimension for column 1?
4. **Brand list:** Which brands does Athletica carry (affects Column 2 content)?
5. **Promo column ownership:** Who manages Column 4 content (Marketing)?

---

*Source references: Part 3 = mega-menu-ux-research-part3.md, Part 4 = mega-menu-ux-research-part4.md, Part 5 = mega-menu-ux-research-part5.md, Part 6 = mega-menu-ux-research-part6.md.*
