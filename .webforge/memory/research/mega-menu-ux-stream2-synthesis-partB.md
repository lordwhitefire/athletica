# Mega Menu UX Gap Analysis — Stream 2: Real Site Examples Synthesis (Part B: Decathlon, ASOS, Zalando + Comparison Table)

> **Compiled by:** Probe-Wren (Intelligence Team)
> **Task:** ticket-athletica-megamenu-stream2
> **Date:** 2026-07-19
> **Purpose:** Synthesize existing research (Parts 1–6) into key examples for Athletica's 5-level hierarchy.
> **Reports to:** Probe (Director of Intelligence)
> **Source material:** mega-menu-ux-research-part1.md through part6.md

---

## PART A (continued): Key Examples from Real Sites

### 5. Decathlon (Part 1 §1.3)

#### Search-Navigation Hybrid — No Traditional Mega Menu
Per mega-menu-ux-research-part1.md §1.3: "Mega menu is NOT used in the traditional sense. Decathlon uses a search-navigation hybrid approach instead of a classic mega menu."

**How it works:** Clicking a top-level category triggers a search-like overlay showing:
- Relevant subcategories as a structured list
- Popular/featured products
- The search field auto-populated with the category name

Layout is a single-column list of subcategories + a product card section — not a multi-column grid (per hmmh.de/en/projects/decathlon-search-navigation — referenced in mega-menu-ux-research-part1.md §1.3).

#### A/B Test Proves Search-Nav Converts Better
Per mega-menu-ux-research-part1.md §1.3: "Search-Navigation Hybrid — Categories integrated INTO the search experience. 'Significantly more conversions' in A/B tests (hmmh case study)."

The hmmh.de case study (source #25 in Part 6) specifically demonstrated that integrating navigation into the search experience outperformed traditional mega menu approaches. The case is particularly relevant because Decathlon has a **similarly massive catalog** (thousands of product SKUs across dozens of sports).

**Key mechanism:** "Clicking on one of them makes it the first part of a search query" — the navigation and search are not separate systems. When you click a category, it auto-populates the search query, combining browsing and searching into a single flow.

**For Athletica:** Part 5 §4.4 notes: "Decathlon's search-nav hybrid: 'Significantly more conversions' (per hmmh.de). Integrate search with menu." This suggests Athletica should consider:
1. Search bar prominently positioned in the header (above or visible alongside the mega menu)
2. Search should be "aware" of the current navigation context
3. The mega menu could pre-populate search when a category is clicked (advanced pattern)

#### "Activities" Sidebar for Deep Hierarchy Handling
Per mega-menu-ux-research-part1.md §1.3: "Decathlon handles deep hierarchy by **delegating depth to category landing pages.** The main menu only shows 2 levels. Level 3+ is surfaced through: Category landing page with a sidebar 'Activities' navigation showing sibling/subsidiary categories."

Per aureatelabs.com analysis (referenced in mega-menu-ux-research-part1.md §1.3): "sidebar navigation called 'Activities' provides additional browsing options."

**For Athletica:** This "Activities" sidebar is the direct inspiration for the **left sidebar on PLP** recommended in Part 5 §4.2: "Left sidebar on PLP — sibling sub-models and parent categories (inspired by Nike's nested sidebar + Decathlon's 'Activities' sidebar)."

#### Other Decathlon Details
- **Click to open** — Navigation is NOT hover-triggered. Must click a category link to open the search overlay.
- **Six quick-access categories** below the search bar
- **Vitamin design system** — Open-source with accordion and navigation components
- **Mobile:** Hamburger (off-canvas drawer) + accordion; search-first

---

### 6. ASOS (Part 2 §1.6)

#### Drill-Down Mobile Pattern
Per mega-menu-ux-research-part2.md §1.6: "Categories open a **new screen** with subcategories — **drill-down navigation pattern** (tap to go deeper, back button to return)."

**Pattern:** On mobile, tapping a category in the hamburger menu does NOT expand inline (accordion). Instead, it pushes a **new full screen** showing subcategories. Users tap to go deeper, use a back button to return. This is pure drill-down/push navigation.

**For Athletica:** ASOS validates the drill-down pattern for deep hierarchies. Part 4's recommended hybrid pattern uses drill-down for Levels 3–5 specifically (per mega-menu-ux-research-part4.md §3.1). ASOS uses it for ALL levels — which is appropriate for their relatively shallow hierarchy (fashion retail, not 5-level deep).

#### Gender-First Split
Per mega-menu-ux-research-part2.md §1.6: "Gender selection ('Women/Men') is the primary entry-point split."

**Pattern:** The top-level nav bar shows Women/Men as the first choice. This persists throughout the session. Brands are a separate top-level item (A–Z directory), not part of category mega menus.

**For Athletica:** ASOS shows that gender-first segmentation works for fashion/apparel. The unresolved question for Athletica (per Part 5 §4.5): should the top-level nav split by Gender or Category first?

#### Other ASOS Details
- **2 levels visible on hover** — Top-level category + one level of subcategories
- **Limited use of images** — 1 featured promo image on the right side
- **Whitespace-dominant design** — Relies on negative space and clear typography
- **Red text for Sale links** — Only color break in otherwise monochrome menu (per Digital Silk)
- **"New In" as persistent top-level item**
- **Mobile:** Hamburger → drill-down screens; filters slide in from right on PLPs
- **Brand handling:** Separate "Brands" top-level item → A–Z brand directory page (split by Women/Men)

---

### 7. Zalando (Part 2 §1.7)

#### Icon-Based Navigation (Pictograms)
Per mega-menu-ux-research-part2.md §1.7: "Icons/pictograms used instead of product images — follows **Law of Prägnanz**: clear, reduced forms faster to grasp" (per happycoding.agency).

**Pattern:** Zalando uses simple icon pictograms for category identification instead of product photos or text-only links. This reduces cognitive load — users recognize the icon faster than reading text.

**For Athletica:** This is a possible enhancement for Athletica's mega menu, particularly for Column 1 (Category + Edits) where icons could speed recognition. However, the research doesn't specifically prescribe this — it's noted as an approach Zalando uses.

#### Cookie-Based Personalization
Per mega-menu-ux-research-part2.md §1.7: "Early segmentation as strategic lever: Women/Men/Kids choice stored in a cookie (`ncx`) so returning visitors skip this step — applies Hick's Law."

**Pattern:** When a first-time visitor selects a gender/segment, Zalando stores this preference in a cookie (`ncx`). On subsequent visits, the navigation automatically defaults to the stored segment, skipping the segmentation step entirely. This **applies Hick's Law** — reducing the number of choices for returning users speeds up decision-making.

**For Athletica:** Part 5 §4.5 marks this as unresolved: "Cookie-based personalization: Should Athletica implement Zalando's cookie-based gender/segment preference to skip the initial segmentation step for returning visitors?" This requires CEO input.

#### "Inspiration Over Hierarchy"
Per mega-menu-ux-research-part2.md §1.7: "Content-driven entry points like 'Festival Looks', 'Sustainable Styles'."

**Pattern:** Zalando's navigation includes inspirational, lifestyle-based groupings alongside product taxonomy. Instead of JUST "Clothing → Dresses," they also have "Festival Looks" and "Outdoor Essentials" — entry points that match lifestyle intent, not product taxonomy.

**For Athletica:** This is the fashion-retail equivalent of JD Sports' "Edits" column and Nike's "New & Featured" column. The pattern: **intersperse inspirational/content-based groupings within the taxonomy structure.** For Athletica, this could mean "By Surface" (FG/AG/TF/SG), "Match Day Kit," "Training Essentials," etc. as content-driven groupings alongside the brand/model hierarchy.

#### Other Zalando Details
- **Shallow depth architecture** — Key pages 2-3 clicks from homepage (per happycoding.agency)
- **Hover-activated with ~200-300ms delay** — Deliberate prevent accidental triggers
- **Personalized navigation** — Adapts based on behavior, location, and device
- **Permanent scope indicator** — Active gender segment remains highlighted throughout session
- **Mobile:** Mobile-first design; clear tap targets; sticky header; breadcrumbs and filter chips visible
- **Brand handling:** Integrated into category structure AND has dedicated brands directory; brands have "brand hub" pages

---

## PART B: Comparison Table

### Full 7-Site Comparison

| Site | Menu Type | Levels in Menu | Column Count | Images in Menu | Trigger | Brands Column | Mobile Pattern | Deep Nav Strategy | Key Innovation for Athletica |
|---|---|---|---|---|---|---|---|---|---|
| **Nike** | Text-only mega menu, 2 levels max | 2 (heading + subcategory links) | 3–5 columns | No images in menu — text-only; optional promo image on right | Hover with ~200-300ms intent delay + click | No dedicated brands column | Hamburger → Full-screen overlay → Accordion (L1-L2) → Drill-down (L3+) | Nested left sidebar on PLP + "pictoral menu" on category page + faceted filters | **First-column "New & Featured"** — lead with intent, not taxonomy. **Nested PLP sidebar** for deep hierarchy hand-off. |
| **Adidas** | Image-heavy mega menu with bottom row | 2 (subcategory links + optional bottom row) | Multi-column + images + bottom row | Yes — promotional banners, category thumbnails, product shots | Hover with ~200-300ms intent delay + click | No dedicated brands column | Hamburger → Off-canvas/Accordion | PLP filters only (no nested sidebar) | **Dual-dimension navigation** (Product Type AND Sport). **Bold "All" links** at bottom of submenus. **Bottom row** for "View All" options. |
| **Decathlon** | Search-navigation hybrid (not traditional mega menu) | 2 (then → landing page) | N/A — search overlay (single-column + product cards) | In search results only | Click to open (not hover) | Not in menu | Hamburger → Accordion (3+ levels) | "Activities" sidebar on category pages + breadcrumbs + filters | **Search-nav hybrid** — A/B tested "significantly more conversions." **"Activities" sidebar** for deep hierarchy on PLP. |
| **Foot Locker** | Traditional mega menu, 4–6 columns, brands column | 2 (then → PLP filters) | 4–6 columns | Minimal (text-first) | Hover to open | **Yes — per category** (dedicated "Brands" column) | Hamburger → Drill-down (all levels) — Top 1% Baymard | Faceted PLP filters + breadcrumbs (shallow: 2-3 levels max) | **Brand-as-column** — directly maps to Athletica's Level 2 (Brand). **Top 1% Baymard** validates approach. |
| **JD Sports** | Traditional mega menu + promo column, 5–6 columns | 2 (then → PLP filters) | 5–6 columns + 1 promo | Yes — right-side promo column (Amplience CDN) | Hover (with "Close Menu" button) | **Yes — per category** (Column 5) | Hamburger → Accordion (off-canvas drawer) | PLP facets + breadcrumbs | **Consistent column template** — learn once, apply everywhere. **"Edits" as first column** — intent-first. **Richard Ilott: "customer mental models, not org structure."** |
| **ASOS** | Partial-width mega menu with right-side promo image | 2 (category + subcategory) | 3–4 columns + 1 promo image | 1 featured promo image (right side) | Hover (no delay info found) | No — separate "Brands" top-level item | Hamburger → Drill-down screens (tap = new screen) | Landing page sub-nav + breadcrumbs | **Gender-first split** as primary entry point. **Drill-down mobile pattern** — clean separation of levels. |
| **Zalando** | Icon-based mega menu, multi-column, full-width | 2 (category + subcategory) | Multi-column + icons | Icons/pictograms only (no product images) | Hover with ~200-300ms delay | Integrated into category structure + dedicated brands directory | Mobile-first (independently designed); sticky header; breadcrumbs + filter chips | Breadcrumbs + filter chips on PLP (shallow: 2-3 clicks) | **Cookie-based personalization** (Hick's Law). **"Inspiration over Hierarchy"** — content-driven entry points. **Icon-based categories**. |

### Summary: Column Counts Across Sites

| Site | Typical Column Count | Notes |
|---|---|---|
| Nike | 3–5 | Text-only, no images. Optional promo block adds a column. |
| Adidas | Multi-column + bottom row | Bottom row is additional, not a column. Variable columns for product types and sports. |
| Decathlon | N/A | Search overlay, not multi-column. |
| Foot Locker | 4–6 | Includes a "Brands" column per category. |
| JD Sports | 5–6 + 1 promo | Most columns — Edits, Footwear, Clothing, Accessories, Brands, Collections + promo. |
| ASOS | 3–4 + 1 promo | Right-side promo image. |
| Zalando | Multi-column | Icons-based, variable columns. |

### Summary: Brands Column Handling

| Site | Brands Column? | Where? |
|---|---|---|
| Nike | No | Brands are subcategory links under "Shoes" etc. |
| Adidas | No | Brands appear in sports/category groupings. |
| Decathlon | No | Not in menu. Brands searchable. |
| Foot Locker | **Yes** | Dedicated "Brands" column per category menu (Men's → Brands: Nike, adidas, Jordan) |
| JD Sports | **Yes** | Consistent Column 5 in every category's mega menu |
| ASOS | No (separate) | Separate "Brands" top-level item → A–Z brand directory page |
| Zalando | Integrated | Integrated into category structure + dedicated brands directory |

### Summary: Level Visibility & Cutoff Strategy

| Site | Levels in Mega Menu | What Happens at Level 3+ | Mobile Handling |
|---|---|---|---|
| Nike | 2 | Nested sidebar on PLP + pictoral menu + filters | Accordion (L1-L2) → Drill-down (L3+) |
| Adidas | 2 | PLP filters only (no nested sidebar — criticized) | Accordion all levels |
| Decathlon | 2 | "Activities" sidebar on PLP + breadcrumbs | Accordion (3+ levels) |
| Foot Locker | 2 | PLP faceted filters + breadcrumbs | Drill-down all levels (Top 1% Baymard) |
| JD Sports | 2 | PLP facets + breadcrumbs | Accordion (off-canvas drawer) |
| ASOS | 2 | Landing page sub-nav + breadcrumbs | Drill-down all levels |
| Zalando | 2 | Breadcrumbs + filter chips on PLP | Mobile-first, sticky header |

---

*Continue to Part C (Synthesis for Athletica) →*

*Document compiled by Probe-Wren on 2026-07-19. Reports to Probe (Director of Intelligence).*
