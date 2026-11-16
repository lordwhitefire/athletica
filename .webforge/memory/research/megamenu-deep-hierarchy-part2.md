# Mega Menu Deep Hierarchy Research — Part B: Mobile Navigation + Summary

> **Researcher:** Probe-Sable
> **Task:** task-mega-menu-ux-001 (work stream 4)
> **Date:** 2026-07-19
> **For:** Athletica — football boots e-commerce (5-level category hierarchy)
> **Status:** Complete — ready for Probe compilation

---

## Part B: Mobile Navigation for Deep Hierarchies

### B1. Recommended Pattern: Hybrid Accordion + Drill-Down (Push Navigation)

**Primary recommendation: Accordion for Levels 1–2 → Switch to Drill-Down/Push navigation for Levels 3–5**

After extensive research of available patterns and competitor approaches, the recommended pattern for Athletica's 5-level hierarchy is a **hybrid accordion + drill-down system:**

- **Level 1 → Level 2:** Use an accordion pattern inside a full-screen overlay menu. Tapping a Level 1 category (e.g., "Boots") expands inline to show Level 2 brands (Nike, Adidas, Puma).
- **Level 2 → Level 3:** Tapping a Level 2 brand (e.g., "Nike") **triggers a push transition** to a new full-screen panel showing Level 3 models.
- **Level 3 → Level 4+:** Continue the drill-down/push pattern. Each tap pushes a new screen.
- **At any level**, a "View All [Category]" link and a prominent "Back" button (at the top) allow returning to parent levels.

Research-backed guidance:
- NN/g "Mobile Subnavigation" (2017): "Sequential menus" (drill-down) are recommended for deep hierarchies. Accordions work well when subcategories contain "less than 6" items. For more than 15 subcategories per primary category, use a category landing page. (Source: NN/g, "Mobile Subnavigation", Raluca Budiu, 2017, nngroup.com/articles/mobile-subnavigation/)
  - Decision algorithm from NN/g: <6 subcategories → accordion/submenu; 6–15 subcategories → section menu; 15+ → category landing page
- NN/g "Menu-Design Checklist" (2024): Sequential navigation "can enable users to peruse a deep structure" and recommends it for deep hierarchies on mobile. Toyota's mobile site is cited as a good example. (Source: NN/g, 2024, guideline #9)
- Smashing Magazine (Vitaly Friedman, 2021): "Vertical accordions appear to be faster and more predictable than overlays (be it single-column or multiple layers). And split-menus appear to be faster and more predictable than accordions." Recommends starting with split-menus, then accordions, then overlays as complexity increases. (Source: Smashing Magazine, 2021)
- Boundev (2026): Recommends "Accordion Pattern" for 2–3 levels and "Drill-Down Pattern" for deeper levels. "Each level slides in as a full-screen panel, replacing the previous level. A back button or swipe gesture returns to the parent. Provides context for deep hierarchies without overwhelming the screen." (Source: Boundev, 2026)

**Why this pattern works for 5 levels:**
- **Levels 1–2 (Accordion):** Users can see all top-level categories at a glance (Boots, Clothing, Accessories). Expanding a category inline shows brands without losing context. This supports "sideways browsing" — jumping from one brand to another without going back to root.
- **Levels 3–5 (Drill-down/Push):** Once a user commits to a brand, push navigation gives them full-screen focus on that branch. Each level shows a clear "You are here" context via heading and back button. This avoids the "nested doll navigation" problem (NN/g term) where accordions become too deep and push content far down the screen.
- **Hybrid switch at Level 2:** Research shows accordions fail at depth because "the expanded ancestors of a deep-level category would push the current scope too far away from the top of the screen, thus requiring a lot of scrolling" (SGS case study, Smashing Magazine, 2016). Switching to push at Level 2 solves this.

### B2. Alternatives Considered

| Pattern | Pros | Cons | Verdict |
|---|---|---|---|
| **Pure Accordion (all 5 levels)** | Familiar pattern, users can see all levels expanded | 5 levels of indentation = loss of context, too much scrolling, "nested doll" problem (NN/g). SGS found 7 levels of indentation required 7 visual cues — impractical. | ❌ Rejected for 5 levels |
| **Pure Drill-Down/Push (all levels)** | Clear focus, works for any depth | No sideways browsing — users must go back to root to switch brands. NN/g warns "sequential menus can disorient users." Requires remembering path. | ⚠️ Works but loses Level 1 overview |
| **Hamburger only** | Simple, standard | NN/g: "Hamburger menus hurt UX metrics" — discoverability cut by ~50%. Users don't explore. | ❌ Rejected |
| **Section Menus** | Good for deep dives within one section | Only works if users stay in one section. Can't jump between different branches. | ⚠️ Rejected — Athletica users browse across categories |
| **Category Landing Pages** | Always available, no interaction cost | Requires page load for every subcategory switch. Too high interaction cost. | ❌ Rejected |
| **Bottom Tab Bar (Level 1 only)** | Always visible, one-tap access | Only 3–5 items. Only covers top level. | ⚠️ Could supplement but not replace |
| **Hybrid Accordion + Drill-Down** | Best of both: overview + focus | Requires clear visual transition. Users need to learn two interaction patterns. | ✅ RECOMMENDED |

### B3. Implementation Guidance

**Menu structure on mobile:**

```
┌─────────────────────────────┐
│ ✕  Menu                  🔍 │  ← Header with close + search
├─────────────────────────────┤
│                             │
│ ▶ Boots                     │  ← Level 1 (accordion)
│   ▶ Nike                    │  ← Level 2 expansions inline
│   ▶ Adidas                  │
│   ▶ Puma                    │
│   [View All Boots →]        │
│                             │
│ ▶ Clothing                  │  ← Another Level 1 accordion
│ ▶ Accessories               │
│ ▶ Sale                      │
│                             │
├─────────────────────────────┤
│ [Brands] [Sports] [Help]    │  ← Utility links at bottom
└─────────────────────────────┘
```

**After tapping Level 2 (e.g., "Nike"):**

```
┌─────────────────────────────┐
│ ← Back    Boots > Nike   🔍 │  ← Breadcrumb + back
├─────────────────────────────┤
│                             │
│ ⚽ Nike Mercurial       →   │  ← Level 3 (drill-down list)
│ ⚽ Nike Phantom         →   │     Each with icon + arrow
│ ⚽ Nike Tiempo          →   │
│ ⚽ Nike Zoom            →   │
│                             │
│ [View All Nike Boots →]     │
│                             │
├─────────────────────────────┤
│ 🔒 Member Access: Sign In   │
└─────────────────────────────┘
```

**After tapping Level 3 (e.g., "Mercurial"):**

```
┌─────────────────────────────┐
│ ← Back    Nike > Mercurial  │
├─────────────────────────────┤
│                             │
│ Superfly 9 Elite       →   │  ← Level 4 (sub-models)
│ Superfly 9 Pro         →   │
│ Superfly 9 Academy     →   │
│ Vapor 16 Elite         →   │
│ Vapor 16 Pro           →   │
│ Vapor 16 Academy       →   │
│                             │
│ [View All Mercurial →]      │
│                             │
└─────────────────────────────┘
```

**Key implementation details:**

1. **Full-screen overlay:** Use a slide-in drawer (left side) that takes over the full viewport. Do NOT use a partial overlay — users need the full screen to see deep hierarchy.
2. **Animated transitions:** Use CSS transforms for push transitions (slide left). Duration: 200–300ms. (Source: SGS case study used 300ms horizontal slide)
3. **Breadcrumb trail:** Always show current path at the top (e.g., "Boots > Nike > Mercurial"). NN/g emphasizes orienting users in deep hierarchies. (Source: NN/g, "Mobile Subnavigation", 2017)
4. **"View All" links at each level:** Every level should have a prominent "View All [Category]" link at the bottom. Baymard: "Have a 'View All' option in the main navigation at each level of the mobile product catalog — only 24% get it right." (Source: Baymard)
5. **Touch targets:** 44×44px minimum for all items. Indentation for hierarchy: 16–20px per level. (Source: NN/g touch target guidelines; Boundev)
6. **Icons:** Use chevron-right (→) for items that drill down (levels 3+). Use chevron-down (▼) for accordions (levels 1–2). Keep icons consistent. (Source: Smashing Magazine, 2022)
7. **Color/indentation hierarchy:** Use distinct visual cues for each level. Smashing Magazine warns: "7 levels of navigation requires 7 degrees of visual cue" — impractical. Keep to 2–3 visual styles maximum. (Source: SGS case study, 2016)
8. **Performance:** Conditionally load deeper navigation branches. SGS loaded first 3 levels in HTML by default, then loaded deeper branches via JavaScript on user intent. (Source: Smashing Magazine SGS case study, 2016)

### B4. Competitor Comparison

| Site | Mobile Nav Pattern | Levels Shown | Notes |
|---|---|---|---|
| **Nike** | Hamburger → Accordion (L1–L2) → Drill-down (L3+) | 3 levels in menu, defer to PLP | Clean separation: accordion for categories, push for deeper. Brand thumbnails. (Source: Snappymob audit, 2025; Baymard Nike UX case study) |
| **Adidas** | Hamburger → Accordion (all levels) | 3 levels in menu | Less scannable than Nike. Bold typefaces for main categories. (Source: Snappymob audit, 2025; Baymard Adidas UX case study) |
| **ASOS** | Bottom nav + Hamburger for categories | 2 levels in hamburger, defer to PLP | Unique bottom tab approach. Categories in full-screen overlay with images. |
| **Zalando** | Hamburger → Accordion (1 level) → Links | 2 levels in menu | Minimal — most navigation deferred to PLP. Text-only subcategories. (Source: Baymard, 2025) |
| **Decathlon** | Hamburger → Accordion (3+ levels) | 3+ levels | Handles deep sports hierarchy. Uses icons and thumbnails extensively. [NOT VERIFIED via direct research] |
| **Foot Locker** | Hamburger → Drill-down (all levels) | 3+ levels | Push navigation for all levels. Brand-first approach. (Source: Baymard — Top 1% performer) |
| **Target** | Full-screen overlay → Click-only, one column | 2–3 levels | Smashing Magazine praises Target: "avoids multi-column layout, shows one level at a time on tap/click." (Source: Smashing Magazine, 2021) |

**Key competitor insight:** Nike and Foot Locker (both Top 1% Baymard performers) use a **hybrid approach**: accordion for initial levels, drill-down for deeper levels. This validates the recommended pattern.

### B5. Accessibility Considerations — Mobile

1. **Keyboard navigation:** Full keyboard support — Tab, Arrow keys, Enter/Space, Escape. (Source: Boundev, 2026; WCAG 2.1 AA)
2. **Screen readers:** Use `aria-expanded` and `aria-controls` for accordion items. Use `aria-current="page"` for current category. (Source: Boundev, 2026)
3. **Motion sensitivity:** Provide `prefers-reduced-motion` support — disable slide animations. (Source: WCAG 2.1 — 2.3.3)
4. **Touch targets:** Minimum 44×44px, ideally 48×48dp (Material Design 3). (Source: NN/g; Material Design 3)
5. **Focus management:** On drill-down push, move focus to panel heading. On close, return focus to trigger. (Source: WCAG 2.1 — 2.4.3)
6. **Contrast:** All text must meet WCAG AA (4.5:1 normal, 3:1 large text). (Source: NN/g, 2017)
7. **Orientation:** Support portrait and landscape. In landscape, consider split-menu showing two levels. (Source: Smashing Magazine, 2022)
8. **Back button behavior:** Use breadcrumb-style back ("← Back to [Parent]"), not generic "Back." Avoid confusion with browser back button. (Source: NN/g, "Mobile Subnavigation", 2017)

---

## Summary: Key Decisions for Athletica

| Decision | Recommendation | Primary Source |
|---|---|---|
| Desktop: Column count | 4 columns | NN/g (chunking), Baymard (~10 items max) |
| Desktop: Levels shown | Show 3 levels, defer 4+ to PLP | NN/g (2–3 tiers), Boundev |
| Desktop: Hover vs Click | Click primary, hover secondary (400ms + triangle) | NN/g (guideline #13), Smashing Mag |
| Desktop: Images | Brand thumbs (48px) + product thumbs (60px) | NN/g (visual cues), Baymard (55% missing) |
| Desktop: Cutoff | After Level 3 → PLP with faceted filters | NN/g (guideline #14), Baymard |
| Mobile: Pattern | Hybrid accordion (L1–L2) + drill-down (L3–L5) | NN/g (Mobile Subnavigation), Boundev |
| Mobile: Accordion depth | Switch at Level 2 (≤6 items per group) | NN/g (<6 = accordion, 15+ = landing page) |
| Mobile: Touch targets | 44×44px minimum | NN/g, Material Design 3 |
| Mobile: Performance | Load L1–L3 in HTML, lazy-load deeper | SGS case study (Smashing Magazine) |
| Accessibility | WCAG 2.1 AA / keyboard / screen reader / reduced motion | NN/g, Boundev, WCAG |

---

## Sources Cited (Part B)

1. NN/g, "Mobile Subnavigation" (Raluca Budiu, July 2017) — nngroup.com/articles/mobile-subnavigation/
2. NN/g, "Menu-Design Checklist: 17 UX Guidelines" (June 2024) — nngroup.com/articles/menu-design/
3. NN/g, "Mega Menus Work Well for Site Navigation" (Jakob Nielsen, Angie Li, March 2017) — nngroup.com/articles/mega-menus-work-well/
4. Baymard Institute, "Homepage & Category Navigation UX 2025" (Edward Scott, updated Sep 2025) — baymard.com/blog/ecommerce-navigation-best-practice
5. Baymard Institute, "Make Product Categories the Top-Level Navigation Items on Mobile Sites" (Jan 2023) — baymard.com/blog/main-navigation-product-categories
6. Smashing Magazine, "User-Friendly Mega-Dropdowns: When Hover Menus Fail" (Vitaly Friedman, May 2021) — smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/
7. Smashing Magazine, "Redesigning SGS' Seven-Level Navigation System: A Case Study" (Marko Dugonjić, Sep 2016) — smashingmagazine.com/2016/09/redesigning-sgs-seven-level-navigation-system-a-case-study/
8. Smashing Magazine, "Designing Navigation for Mobile: Design Patterns and Best Practices" (Vitaly Friedman, Nov 2022) — smashingmagazine.com/2022/11/navigation-design-mobile-ux/
9. Boundev, "Multilevel Menu Design: UX Patterns That Reduce Friction" (2026) — boundev.ai/blog/multilevel-menu-design-ux-guide
10. Snappymob, "UI/UX Audit: Nike vs Adidas Website Comparison" (2025) — blog.snappymob.com/ui-ux-audit-nike-vs-adidas-website-comparison
11. Material Design 3, Navigation Drawer Guidelines — m3.material.io/components/navigation-drawer/guidelines
12. Amazon triangle technique — bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown
13. Hakim el Hattab, "Building Better Interfaces" SVG path exit areas — slides.com/wireframe
