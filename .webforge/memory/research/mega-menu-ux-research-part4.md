# Mega Menu UX Research — Comprehensive Report for Athletica (Part 4: Mobile Strategy)

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-ux-001
> **Date:** 2026-07-19
> **Primary sources:** Probe-Sable, `megamenu-deep-hierarchy-part2.md` (Part B: Mobile Navigation)

---

## Section 3: Mobile Strategy

### 3.1 Recommended Pattern: Hybrid Accordion + Drill-Down (Push Navigation)

**Primary recommendation: Accordion for Levels 1–2 → Switch to Drill-Down/Push navigation for Levels 3–5**

After extensive research of available patterns and competitor approaches, the recommended pattern for Athletica's 5-level hierarchy is a **hybrid accordion + drill-down system:**

- **Level 1 → Level 2:** Use an accordion pattern inside a full-screen overlay menu. Tapping a Level 1 category (e.g., "Boots") expands inline to show Level 2 brands (Nike, Adidas, Puma).
- **Level 2 → Level 3:** Tapping a Level 2 brand (e.g., "Nike") **triggers a push transition** to a new full-screen panel showing Level 3 models.
- **Level 3 → Level 4+:** Continue the drill-down/push pattern. Each tap pushes a new screen.
- **At any level:** A "View All [Category]" link and a prominent "Back" button (at the top) allow returning to parent levels.

Research-backed guidance:
- NN/g "Mobile Subnavigation" (2017): "Sequential menus" (drill-down) are recommended for deep hierarchies. Accordions work well when subcategories contain "less than 6" items. For more than 15 subcategories per primary category, use a category landing page.
  - Decision algorithm from NN/g: <6 subcategories → accordion/submenu; 6–15 subcategories → section menu; 15+ → category landing page
  - (Source: NN/g, "Mobile Subnavigation", Raluca Budiu, 2017, nngroup.com/articles/mobile-subnavigation/)
- NN/g "Menu-Design Checklist" (2024): Sequential navigation "can enable users to peruse a deep structure" and recommends it for deep hierarchies on mobile. Toyota's mobile site is cited as a good example. (Source: NN/g, 2024, guideline #9)
- Smashing Magazine (Vitaly Friedman, 2021): "Vertical accordions appear to be faster and more predictable than overlays (be it single-column or multiple layers). And split-menus appear to be faster and more predictable than accordions." Recommends starting with split-menus, then accordions, then overlays as complexity increases. (Source: Smashing Magazine, 2021)
- Boundev (2026): Recommends "Accordion Pattern" for 2–3 levels and "Drill-Down Pattern" for deeper levels. "Each level slides in as a full-screen panel, replacing the previous level. A back button or swipe gesture returns to the parent. Provides context for deep hierarchies without overwhelming the screen." (Source: Boundev, 2026)

---

### 3.2 Why This Works for 5 Levels

- **Levels 1–2 (Accordion):** Users can see all top-level categories at a glance (Boots, Clothing, Accessories). Expanding a category inline shows brands without losing context. This supports "sideways browsing" — jumping from one brand to another without going back to root.
- **Levels 3–5 (Drill-down/Push):** Once a user commits to a brand, push navigation gives them full-screen focus on that branch. Each level shows a clear "You are here" context via heading and back button. This avoids the "nested doll navigation" problem (NN/g term) where accordions become too deep and push content far down the screen.
- **Hybrid switch at Level 2:** Research shows accordions fail at depth because "the expanded ancestors of a deep-level category would push the current scope too far away from the top of the screen, thus requiring a lot of scrolling" (SGS case study, Smashing Magazine, 2016). Switching to push at Level 2 solves this.
- **NN/g decision algorithm applied:** Athletica's Level 1 categories likely contain 5-10 brand items at Level 2 — this falls in the accordion/submenu sweet spot (<6 recommended; 6-15 acceptable with section menu). Level 3+ models per brand may exceed 6 items, justifying the switch to drill-down/push.

---

### 3.3 Alternatives Considered

| Pattern | Pros | Cons | Verdict |
|---|---|---|---|
| **Pure Accordion (all 5 levels)** | Familiar pattern, users can see all levels expanded | 5 levels of indentation = loss of context, too much scrolling, "nested doll" problem (NN/g). SGS found 7 levels required 7 visual cues — impractical. | ❌ Rejected |
| **Pure Drill-Down/Push (all levels)** | Clear focus, works for any depth | No sideways browsing — users must go back to root to switch brands. NN/g warns "sequential menus can disorient users." | ⚠️ Works but loses overview |
| **Hamburger only** | Simple, standard | NN/g: "Hamburger menus hurt UX metrics" — discoverability cut ~50%. Users don't explore. | ❌ Rejected |
| **Section Menus** | Good for deep dives within one section | Only works if users stay in one section. Can't jump between different branches. | ⚠️ Rejected |
| **Category Landing Pages** | Always available, no interaction cost | Requires page load for every subcategory switch. High interaction cost. | ❌ Rejected |
| **Bottom Tab Bar (Level 1 only)** | Always visible, one-tap access | Only 3-5 items. Only covers top level. | ⚠️ Could supplement |
| **Hybrid Accordion + Drill-Down** | Best of both: overview + focus | Requires clear visual transition. Users need to learn two interaction patterns. | ✅ RECOMMENDED |

---

### 3.4 ASCII Wireframe Diagrams

#### Menu structure on mobile (initial state — full-screen overlay):

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

#### After tapping Level 2 (e.g., "Nike") — drill-down push screen:

```
┌─────────────────────────────┐
│ ← Back    Boots > Nike   🔍 │  ← Breadcrumb trail + back
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

#### After tapping Level 3 (e.g., "Mercurial") — further drill-down:

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

---

### 3.5 Implementation Guidance

1. **Full-screen overlay:** Use a slide-in drawer (left side) that takes over the full viewport. Do NOT use a partial overlay — users need the full screen to see deep hierarchy.

2. **Animated transitions:** Use CSS transforms for push transitions (slide left). Duration: 200–300ms. (Source: SGS case study used 300ms horizontal slide)

3. **Breadcrumb trail:** Always show current path at the top (e.g., "Boots > Nike > Mercurial"). NN/g emphasizes orienting users in deep hierarchies. (Source: NN/g, "Mobile Subnavigation", 2017)

4. **"View All" links at each level:** Every level should have a prominent "View All [Category]" link at the bottom. Baymard: "Have a 'View All' option in the main navigation at each level of the mobile product catalog — only 24% get it right." (Source: Baymard)

5. **Touch targets:** 44×44px minimum for all items. Indentation for hierarchy: 16–20px per level. (Source: NN/g touch target guidelines; Boundev)

6. **Icons:** Use chevron-right (→) for items that drill down (levels 3+). Use chevron-down (▼) for accordions (levels 1–2). Keep icons consistent. (Source: Smashing Magazine, 2022)

7. **Color/indentation hierarchy:** Use distinct visual cues for each level. Smashing Magazine warns: "7 levels of navigation requires 7 degrees of visual cue" — impractical. Keep to 2–3 visual styles maximum. (Source: SGS case study, 2016)

8. **Performance:** Conditionally load deeper navigation branches. SGS loaded first 3 levels in HTML by default, then loaded deeper branches via JavaScript on user intent. (Source: Smashing Magazine SGS case study, 2016)

9. **Search bar:** Persistent at the top of the mobile nav overlay (inspired by Decathlon's search-first approach per hmmh.de case study).

10. **Animation:** Nike-style staggered fade-in (~50ms per item) for accordion reveals. CSS transform slide for drill-down transitions. (Source: muffingroup.com; SGS case study)

---

### 3.6 Competitor Comparison Table

| Site | Mobile Nav Pattern | Levels Shown | Notes |
|---|---|---|---|
| **Nike** | Hamburger → Accordion (L1–L2) → Drill-down (L3+) | 3 levels in menu, defer to PLP | Clean separation: accordion for categories, push for deeper. Top 1% Baymard performer. |
| **Adidas** | Hamburger → Accordion (all levels) | 3 levels in menu | Less scannable than Nike. Bold typefaces for main categories. |
| **ASOS** | Bottom nav + Hamburger for categories | 2 levels in hamburger, defer to PLP | Unique bottom tab approach. Categories in full-screen overlay with images. |
| **Zalando** | Hamburger → Accordion (1 level) → Links | 2 levels in menu | Minimal — most navigation deferred to PLP. Text-only subcategories. |
| **Decathlon** | Hamburger → Accordion (3+ levels) | 3+ levels | Handles deep sports hierarchy. Uses icons and thumbnails. |
| **Foot Locker** | Hamburger → Drill-down (all levels) | 3+ levels | Push navigation for all levels. Brand-first approach. Top 1% Baymard performer. |
| **Target** | Full-screen overlay → Click-only, one column | 2–3 levels | Smashing Magazine praises Target: "avoids multi-column layout, shows one level at a time on tap/click." |

**Key competitor insight:** Nike and Foot Locker (both Top 1% Baymard performers) use a **hybrid approach**: accordion for initial levels, drill-down for deeper levels. This validates the recommended pattern for Athletica.

---

### 3.7 Accessibility Considerations — Mobile

1. **Keyboard navigation:** Full keyboard support — Tab, Arrow keys, Enter/Space, Escape. (Source: Boundev, 2026; WCAG 2.1 AA)
2. **Screen readers:** Use `aria-expanded` and `aria-controls` for accordion items. Use `aria-current="page"` for current category. (Source: Boundev, 2026)
3. **Motion sensitivity:** Provide `prefers-reduced-motion` support — disable slide animations. (Source: WCAG 2.1 — 2.3.3)
4. **Touch targets:** Minimum 44×44px, ideally 48×48dp (Material Design 3). (Source: NN/g; Material Design 3)
5. **Focus management:** On drill-down push, move focus to panel heading. On close, return focus to trigger. (Source: WCAG 2.1 — 2.4.3)
6. **Contrast:** All text must meet WCAG AA (4.5:1 normal, 3:1 large text). (Source: NN/g, 2017)
7. **Orientation:** Support portrait and landscape. In landscape, consider split-menu showing two levels. (Source: Smashing Magazine, 2022)
8. **Back button behavior:** Use breadcrumb-style back ("← Back to [Parent]"), not generic "Back." Avoid confusion with browser back button. (Source: NN/g, "Mobile Subnavigation", 2017)

---

### Summary: Key Mobile Decisions for Athletica

| Decision | Recommendation | Primary Source |
|---|---|---|
| Mobile pattern | Hybrid accordion (L1–L2) + drill-down (L3–L5) | NN/g, Boundev |
| Accordion depth | Switch at Level 2 (≤6 items per group) | NN/g (<6 = accordion) |
| Touch targets | 44×44px minimum | NN/g, Material Design 3 |
| Performance | Load L1–L3 in HTML, lazy-load deeper | SGS case study |
| "View All" links | At every level | Baymard (only 24% do this) |
| Breadcrumbs | Always show path at top | NN/g "Mobile Subnavigation" |
| Animations | Accordion: staggered fade (50ms/item); Push: 200-300ms slide | Muffingroup.com; SGS case study |

---

*End of Part 4 — continues in Part 5 (Athletica-Specific Recommendations + Sources Cited)*
