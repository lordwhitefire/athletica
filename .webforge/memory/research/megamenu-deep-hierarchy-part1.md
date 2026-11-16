# Mega Menu Deep Hierarchy Research — Part A: Desktop Mega Menu

> **Researcher:** Probe-Sable
> **Task:** task-mega-menu-ux-001 (work stream 4)
> **Date:** 2026-07-19
> **For:** Athletica — football boots e-commerce (5-level category hierarchy)
> **Status:** Complete — ready for Probe compilation

---

## Part A: Desktop Mega Menu for Deep Hierarchies

### A1. Optimal Column Count

**Recommendation: 3–5 columns maximum**

Research-backed guidance:
- NN/g recommends chunking options into "related sets" and keeping a "medium level of granularity" — not too many groups, not too few. Mega menus show everything at once in a two-dimensional panel divided into groups. (Source: NN/g, "Mega Menus Work Well for Site Navigation", 2017, nngroup.com/articles/mega-menus-work-well/)
- Baymard Institute found that users begin to feel overwhelmed when presented with more than ~10 subcategory options in a single menu. Dividing into manageable chunks is critical — subdivide when reaching around 10 categories. (Source: Baymard, "Homepage & Category Navigation UX 2025", updated Sep 2025, baymard.com/blog/ecommerce-navigation-best-practice)
- Boundev's research on multilevel menus: "Mega menus outperform nested dropdowns for sites with 50+ pages by displaying the full information architecture in scannable multi-column layouts." (Source: Boundev, "Multilevel Menu Design: UX Patterns That Reduce Friction", 2026, boundev.ai/blog/multilevel-menu-design-ux-guide)
- Smashing Magazine (Vitaly Friedman): "Showing the breadth of options requires quite a bit of space. Think of large eCommerce retailers." Real-world examples like DaveRamsey.com (5 groups), John Lewis (4–5 columns). (Source: Smashing Magazine, "User-Friendly Mega-Dropdowns: When Hover Menus Fail", 2021, smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/)

**For Athletica (5-level hierarchy):** Use a 4-column mega menu layout:
- **Column 1:** Category-level links (Level 1 — e.g., "Boots")
- **Column 2:** Brand links grouped by category (Level 2 — e.g., "Nike", "Adidas")
- **Column 3:** Model links grouped by brand (Level 3 — e.g., "Mercurial", "Phantom")
- **Column 4:** Featured/action column (promotions, "Shop All [Category]", or popular sub-models)

### A2. Level Visibility — How Many Levels Should Show

**Recommendation: Show 3 levels in the mega menu. Cut off Levels 4–5 and defer to the category PLP.**

Research-backed guidance:
- NN/g specifically says mega menus "can support 2–3 tiers of information reasonably well" and recommends sending users to "routing pages with additional options" for deeper levels. (Source: NN/g, "Menu-Design Checklist: 17 UX Guidelines", 2024, nngroup.com/articles/menu-design/)
- NN/g: "If typical user journeys involve drilling down through several levels, mega menus can save users time by letting them skip a level (or two)." The emphasis is on showing "several navigation tiers" but not all tiers. (Source: NN/g, "Menu-Design Checklist", guideline #9, 2024)
- NN/g earlier work confirms mega menus "show multiple levels of the site's IA" — typically Levels 1–3. (Source: NN/g, "Mega Menus Work Well for Site Navigation", 2017)
- Baymard: 60% of sites don't divide categories into manageable chunks. Users feel overwhelmed beyond ~10 options per level. Deeper levels should be deferred to intermediary category pages. (Source: Baymard, "Homepage & Category Navigation UX 2025")
- Boundev: "Limit submenu depth to two levels maximum — deeper hierarchies exponentially increase navigation failure rates and should use local page navigation instead." (Source: Boundev, 2026)

**For Athletica (5-level hierarchy):**
- **Show Levels 1–3 in the mega menu** (Category → Brand → Model or first-level sub-model)
- **Cut off at Level 3.** Levels 4 (Sub-model) and 5 (Product Type) should be navigable via the category PLP with faceted filters
- The mega menu's deepest link points to the Level 3 PLP page, where users can further refine by Level 4 and Level 5 attributes using filter facets

**Proposed Athletica mapping:**
| Mega Menu Level | Category Level | Example |
|---|---|---|
| Column heading | Level 1: Category | "Boots" |
| Group heading | Level 2: Brand | "Nike" |
| Link item | Level 3: Model | "Mercurial" |
| → Defer to PLP | Level 4: Sub-model | "Vapor 16 Elite" (filter on PLP) |
| → Defer to PLP | Level 5: Product Type | "FG" (filter on PLP) |

### A3. Hover vs Click

**Recommendation: Click/tap activation, NOT hover-only. Supplement with hover on desktop as a secondary pattern (with proper delay + intelligent mouse path).**

Research-backed guidance:
- NN/g (2024) guideline #13: "Use Click-Activated (Rather Than Hover-Activated) Submenus. Hover is not universally available. It's better to have a consistent, reliable interaction pattern across devices and input modalities." (Source: NN/g, "Menu-Design Checklist", 2024)
- Smashing Magazine (Vitaly Friedman, 2021): "Both in terms of technical implementation and UX, opening the menu on tap/click usually causes way less trouble and way less frustration while allowing for a simple implementation." Recommends testing if click/tap navigation performs equally to hover before implementing hover. (Source: Smashing Magazine, "User-Friendly Mega-Dropdowns", 2021)
- Baymard: 61% of sites don't have a hover delay. Hover-based menus need 300–500ms delay to avoid "flickering." Hover outperformed other patterns IN TESTING, BUT only when properly implemented with delay. (Source: Baymard, "Homepage & Navigation UX 2025"; also baymard.com/blog/dropdown-menu-flickering-issue)
- Boundev: "We never use hover-triggered mega menus in new projects. Click activation is more precise, works identically on touch and mouse devices, and eliminates the entire category of accidental open/close bugs." (Source: Boundev, 2026)

**For Athletica — Recommended hybrid approach:**
1. **Primary: Click/tap to open** — consistent across all devices
2. **Secondary: Hover with 400ms delay + Amazon triangle technique** for mouse users who prefer it
3. Use the "Amazon triangle" technique (trajectory triangle connecting mouse pointer position to mega menu edges) to prevent accidental closes when moving diagonally toward submenu items. (Source: bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown; also cited by Smashing Magazine)
4. Implement SVG path exit areas (Hakim el Hattab technique) for more forgiving mouse movement paths. (Source: Smashing Magazine, 2021)

### A4. Image Usage

**Recommendation: Use small product/brand thumbnails (50–80px) at Level 2 and 3 to increase information scent. Do NOT use large promotional images in the mega menu.**

Research-backed guidance:
- NN/g: "Images in the mega menu can help users select the right option." (Moleskine example) BUT "Avoid GUI widgets and other interface elements that involve more advanced interaction than a simple click." Promotional images that serve as clickable CTAs are acceptable, but avoid complex widgets. (Source: NN/g, "Mega Menus Work Well", 2017)
- NN/g guideline #10: "Use Visual Cues for Long Menus. Images, icons, and limited use of color may help with comprehension." BUT images should be "additional supportive elements, rather than replacing clear text labels." (Source: NN/g, "Menu-Design Checklist", 2024)
- Baymard: 55% of sites are missing or have hard-to-interpret subcategory thumbnails. Users hesitate more when evaluating text-only subcategory links without thumbnails. Thumbnails should be "clear, representative" and "easy to interpret at a glance." (Source: Baymard, "Homepage & Navigation UX 2025")

**For Athletica:**
- Add small brand logos (48×48px) next to Level 2 brand names in the mega menu
- Add small product thumbnails (60×60px) next to Level 3 model names
- Use a "featured" column (Column 4) for a promotional spotlight (new releases, top-rated), but keep it simple — a single image with a CTA link, not a carousel or widget
- Do NOT use promotional banners that rotate or auto-play

### A5. Cutoff Point (Where Mega Menu Stops, Where PLP Takes Over)

**Recommendation: Cut off after Level 3. Level 4+ navigated via PLP filters.**

- NN/g: "If your submenus have multiple levels of submenus, use either a mega menu (that can support 2–3 tiers of information reasonably well), or send users to routing pages with additional options." (Source: NN/g, "Menu-Design Checklist", 2024, guideline #14)
- Baymard: 76% of sites don't feature subcategories as the primary content on intermediary category pages. The PLP/intermediary page should pick up where the mega menu leaves off, featuring subcategories front and center. (Source: Baymard, 2025)
- SGS case study (Smashing Magazine): 7-level navigation survived by showing only the first 3 levels in the navigation tree, then conditionally loading deeper levels. The team found "the first three levels by default in HTML" with deeper branches loaded via JavaScript on intent. (Source: Smashing Magazine, "Redesigning SGS' Seven-Level Navigation System", 2016)

**Athletica implementation:**
- Mega menu shows Levels 1–3
- Each Level 3 link in the menu leads to an intermediary category PLP
- On that PLP, show Level 4 sub-models as filterable category groups with thumbnails
- Level 5 (Product Type: FG, AG, TF, etc.) displayed as filter facets (checkbox or button group) on the PLP
- The PLP URL structure should reflect the hierarchy: `/boots/nike/mercurial/?stud=fg`

### A6. Patterns for Depth (Specific UX Patterns for Deep Navigation)

**Recommended pattern: "Column-Forward" Mega Menu with Brand-First Grouping**

Based on the research, the following pattern is recommended for Athletica's 5-level hierarchy:

1. **Top-level nav bar** — Shows Level 1 categories (Boots, Clothing, Accessories, etc.)
2. **Mega menu opens on click** (or hover with delay) — 4-column layout:
   - **Column 1:** Brand filter/group header (Level 2 brands with logos)
   - **Column 2:** Models within selected brand (Level 3 models)
   - **Column 3:** Quick links to popular sub-models or variants (key Level 4 items featured)
   - **Column 4:** Promotional/action column ("Shop All [Brand] Boots" CTA, featured product)
3. **Bottom of mega menu:** Persistent "View All [Category]" link, search bar if space permits

**Patterns to avoid:**
- **Cascading nested sub-menus (fly-out menus):** NN/g explicitly warns: "Avoid multilevel cascading menus." They become frustrating with 2+ tiers. (Source: NN/g, 2024)
- **Hover-only with no delay:** Causes "flickering" and accidental triggers (Source: Baymard, 2025 — 61% of sites get this wrong)
- **Multi-level hover within mega menu (nested dropdowns inside mega menu):** Smashing Magazine calls this "frustrating" — "users have to re-open the navigation over and over again and remember where they clicked." (Source: Smashing Magazine, 2021)

### A7. Accessibility Considerations — Desktop Mega Menu

- **Keyboard navigation:** Full WCAG 2.1 AA compliance required. Tab/Shift+Tab between top-level items, Enter/Space to open submenus, Arrow keys within submenus, Escape to close. (Source: Boundev, 2026; NN/g, 2024)
- **ARIA attributes:** `aria-expanded` on parent items, `aria-haspopup` for menu triggers, proper `role="navigation"` landmarks. (Source: Boundev, 2026)
- **Screen reader support:** NN/g recommends two approaches: (a) simple — make each top-level menu choice clickable leading to a regular page with full accessible HTML; (b) advanced — jQuery plugin for screen reader accessibility. "If you're a rich company and/or especially concerned with accessibility, you should implement both." (Source: NN/g, "Mega Menus Work Well", 2017)
- **Touch targets:** Minimum 44×44px for all clickable items. (Source: NN/g mobile guidelines; Boundev recommends 48×48dp for Android)
- **Focus indicators:** Visible focus styles on all navigable elements. (Source: NN/g "Menu-Design Checklist", 2024)
- **Contrast:** Ensure sufficient color contrast for text on any background within the mega menu. (Source: NN/g, 2017 — warns about low-vision users with screen magnifiers)
- **Avoid hover-only dismissal:** Menu should not disappear if user moves pointer outside — use 500ms exit delay minimum. (Source: NN/g, "Mega Menus Work Well", 2017)

---

## Sources Cited (Part A)

1. NN/g, "Mega Menus Work Well for Site Navigation" (Jakob Nielsen, Angie Li, March 2017) — nngroup.com/articles/mega-menus-work-well/
2. NN/g, "Menu-Design Checklist: 17 UX Guidelines" (June 2024) — nngroup.com/articles/menu-design/
3. NN/g, "Mobile Subnavigation" (Raluca Budiu, July 2017) — nngroup.com/articles/mobile-subnavigation/
4. Baymard Institute, "Homepage & Category Navigation UX 2025" (Edward Scott, updated Sep 2025) — baymard.com/blog/ecommerce-navigation-best-practice
5. Baymard Institute, "Make Product Categories the Top-Level Navigation Items on Mobile Sites" (Jan 2023) — baymard.com/blog/main-navigation-product-categories
6. Baymard Institute, "Drop-Down Menu Flickering: Provide a Hover Delay of 300–500ms" — baymard.com/blog/dropdown-menu-flickering-issue
7. Smashing Magazine, "User-Friendly Mega-Dropdowns: When Hover Menus Fail" (Vitaly Friedman, May 2021) — smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/
8. Smashing Magazine, "Redesigning SGS' Seven-Level Navigation System: A Case Study" (Marko Dugonjić, Sep 2016) — smashingmagazine.com/2016/09/redesigning-sgs-seven-level-navigation-system-a-case-study/
9. Boundev, "Multilevel Menu Design: UX Patterns That Reduce Friction" (2026) — boundev.ai/blog/multilevel-menu-design-ux-guide
10. Amazon triangle technique — bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown
