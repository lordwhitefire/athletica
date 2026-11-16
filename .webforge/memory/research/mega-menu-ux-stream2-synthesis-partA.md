# Mega Menu UX Gap Analysis — Stream 2: Real Site Examples Synthesis (Part A: JD Sports, Foot Locker, Nike, Adidas)

> **Compiled by:** Probe-Wren (Intelligence Team)
> **Task:** ticket-athletica-megamenu-stream2
> **Date:** 2026-07-19
> **Purpose:** Synthesize existing research (Parts 1–6) into key examples for Athletica's 5-level hierarchy.
> **Reports to:** Probe (Director of Intelligence)
> **Source material:** mega-menu-ux-research-part1.md through part6.md

---

## PART A: Key Examples from Real Sites

### 1. JD Sports (Part 2 §1.5)

#### Consistent 6-Column Template
JD Sports uses a full-width mega menu with a **consistent 5–6 column structure** applied uniformly across every top-level category (Men, Women, Kids):
- **Column 1:** "Edits" — curated collections (New In, Summer Edit, Holiday Shop)
- **Column 2:** Footwear (Trainers, Boots, Slides, Running Shoes, Football Boots)
- **Column 3:** Clothing (T-Shirts, Hoodies, Tracksuits, Jackets)
- **Column 4:** Accessories (Bags, Caps, Socks, Sunglasses)
- **Column 5:** Brands (Nike, adidas, New Balance, etc.)
- **Column 6:** Collections (specific product collections like Air Max 95)

Per mega-menu-ux-research-part2.md §1.5: "JD Sports HTML (`nav-panel` divs with `nav-links` containing multiple `ul` elements)." The template is the same regardless of which category you hover — this consistency reduces cognitive load because users learn the layout once and apply it everywhere.

#### "Edits First" Philosophy and Application to Athletica
The **first column** is not a taxonomy column — it's an **intent-based "Edits" column** (New In, Summer Edit, Holiday Shop). Per mega-menu-ux-research-part2.md §1.5: "Curated, intent-based shopping prioritized over pure taxonomy (per Richard Ilott's redesign)."

**Application to Athletica:** Instead of leading with pure taxonomy (Model → Sub-model), JD Sports leads with curated groupings that match **shopping intent**. For Athletica, Column 1 should include intent-based edits like:
- New In (recent arrivals)
- Best Sellers (social proof)
- By Surface (FG, AG, TF, SG — Athletica's unique differentiator)

This maps directly to Part 5's recommended Column 1: "Category links + Edits (Level 1)" with "New In, Best Sellers, By Surface" (per mega-menu-ux-research-part5.md §4.1).

#### Richard Ilott's Redesign: IA vs Customer Mental Models
Per mega-menu-ux-research-part2.md §1.5: "Navigation redesign by **Richard Ilott** explicitly addressed the problem of menus reflecting 'internal org structure, not customer mental models.'"

**Key insight:** Ilott's redesign shifted JD Sports from an organization-centric IA (organized by how the business categorizes products internally) to a **customer-centric IA** (organized by how shoppers think about products). The evidence is the "Edits" column — customers don't walk into a store thinking "I want to browse by department code." They think "I want something new" or "I'm looking for summer outfits."

**For Athletica:** The "Edits" pattern directly challenges a pure taxonomy-driven mega menu. If Athletica's internal IA has 5 levels (Category → Brand → Model → Sub-model → Product Type), showing that raw hierarchy in the menu would reflect "internal org structure, not customer mental models." The fix: wrap the hierarchy in intent-based groupings (Edits, By Surface, Best Sellers) while still exposing the taxonomy structure.

#### Consistent Column Template Across Categories
Per mega-menu-ux-research-part2.md §1.5: "Every top-level category uses the exact same 6-column layout." This is a deliberate design decision — templates ensure new categories can be added without breaking the IA. The research notes: "Documentation and templates so new categories could be added without breaking IA" (per mega-menu-ux-research-part2.md §1.5, Distinctive Patterns #5).

**For Athletica:** The same principle applies — whether a user hovers over "Boots," "Clothing," or "Accessories," the **4-column template** (Category+Edits | Brands | Models | Featured) should remain consistent. This is reflected in Part 5's wireframe (per mega-menu-ux-research-part5.md §4.1).

#### Other JD Sports Details
- **Hover to open** with a "Close Menu" button (per mega-menu-ux-research-part2.md §1.5)
- **Images:** Right-side promotion column with Amplience CDN images (per `nav-promotions` div analysis)
- **Deep hierarchy:** Flattened to 2 levels in menu — deeper handled via PLP left sidebar filters and breadcrumbs
- **Top-level categories:** Back To School, Men, Women, Kids, Collections, Sale, Brands (7 items)
- **Mobile:** Off-canvas drawer + accordion-style expandable categories

---

### 2. Foot Locker (Part 2 §1.4)

#### Brand-as-Column Pattern
Per mega-menu-ux-research-part2.md §1.4: "Each mega menu panel includes a dedicated 'Brands' column listing top brands. Directly relevant to Athletica's Level 2 (Brand)."

**What it looks like:** When you hover over a top-level category (e.g., "Men's"), the mega menu panel shows 4–6 columns. One of those columns is always labeled "Brands" with links to Nike, adidas, Jordan, New Balance, etc. This is NOT a separate "Brands" top-level section — it's a **Brands column within each category's mega menu**.

**Direct mapping to Athletica's Level 2:** Athletica's hierarchy has Brand at Level 2 (Category → Brand → Model → Sub-model → Product Type). Foot Locker's pattern validates dedicating an entire column to brands per category. For Athletica, this is Column 2 in the recommended wireframe (per mega-menu-ux-research-part5.md §4.1): "Brand links with 48px logos (Level 2)."

#### Top 1% Baymard Performer — What Makes It Work
Per mega-menu-ux-research-part2.md §1.4: "Baymard rating: Foot Locker is a **Top 1% Baymard performer** (per Probe-Sable's Part B research)."

Factors contributing to this rating (extracted from the research):
1. **Shallow hierarchy (2–3 levels max)** — The mega menu stays flat. No fly-out submenus or nested dropdowns. Level 3+ is handled via PLP faceted navigation.
2. **Gender-first taxonomy** — Men/Women/Kids as primary split, matching how shoppers self-identify (per mega-menu-ux-research-part2.md §1.4, Distinctive Pattern #2)
3. **"Shop by" groupings** — Subcategories grouped by shopping intent, not just taxonomy (e.g., "Featured" as a group heading alongside "Shoes," "Clothing"). Mirrors JD Sports' "Edits" philosophy.
4. **Brand-as-column** — Makes brands a first-class navigation dimension rather than burying them in subcategory lists.
5. **Promotional slots** — "Sale" has distinct visual treatment (typically red or highlighted), drawing attention to deals (per mega-menu-ux-research-part2.md §1.4, Distinctive Pattern #4)
6. **Mobile pattern** — Hamburger + drill-down navigation, also top-tier

#### How Foot Locker Handles Deep Hierarchy
Per mega-menu-ux-research-part2.md §1.4: "Any depth beyond 2 levels is handled via **faceted navigation on the PLP** (left sidebar filters for size, color, price, brand, width). No fly-out or nested submenus — the mega menu is flat (2-level max)."

The hierarchy:
- **Level 1:** Gender/Section (Men's, Women's, Kids')
- **Level 2:** Product Type (Shoes, Clothing, Accessories, Brands) — shown in mega menu
- **Level 3+:** Specific type (Trainers, Boots, Sandals) — handled via PLP filters + breadcrumbs

**For Athletica:** This pattern validates cutting off at Level 2 in the menu and deferring deeper levels to the PLP. However, Part 3 §2.2 recommends Athletica show 3 levels (Category → Brand → Model) in the mega menu, which is one level more than Foot Locker shows. The difference: Athletica's Level 3 (Model) is a meaningful navigation step with information scent (product thumbnails), whereas Foot Locker's Level 3 (specific type like "Trainers") is better handled as a filter.

---

### 3. Nike (Part 1 §1.1)

#### 2-Level Max in Mega Menu, Text-Only, No Images
Per mega-menu-ux-research-part1.md §1.1: "NO product thumbnails, category images, or icons inside the menu columns" (per unlimited-elements.com — "No images. It focuses on simplicity").

Nike shows only **2 levels** in the mega menu panel:
- **Level 1 (column heading):** Bold category heading (not clickable)
- **Level 2 (link):** Subcategory links below the heading

The panel is **3–5 text-only columns** on a white background with no borders or shadows. Typography: "Column headings bold, 14-16px; link text regular weight, slightly smaller" (per thehangline.com, referenced in mega-menu-ux-research-part1.md §1.1).

#### How Nike Handles Deeper Navigation (3+ Levels)
Per mega-menu-ux-research-part1.md §1.1: "Nike's approach: Mega menu intentionally avoids deep hierarchies. Only 2 levels max in the panel."

For deeper navigation, Nike uses a **multi-step funnel**:
1. User clicks a subcategory link (e.g., "Football" under "Shoes") → loads a category page
2. **Category page has a nested left-hand sidebar** showing the current category and all sibling subcategories (per econsultancy.com comparison, referenced in mega-menu-ux-research-part1.md §1.1)
3. Category page also features a **"pictoral menu"** — horizontal row of category tiles WITH images at the top of the PLP (per econsultancy.com)
4. Further filters (nested left, sticky) handle remaining refinement

**Philosophy:** "Mega menu as a broad funnel, category page navigation for deep drilling. Kept intentionally shallow to avoid choice paralysis" (per katsaville.com — referenced in mega-menu-ux-research-part1.md §1.1).

**For Athletica:** Nike's nested left sidebar on PLP is directly applicable. Part 5 recommends: "Left sidebar on PLP — sibling sub-models and parent categories (inspired by Nike's nested sidebar)" (per mega-menu-ux-research-part5.md §4.2).

#### Audience-First Segmentation Pattern
Per mega-menu-ux-research-part1.md §1.1: "Primary split by audience (Men/Women/Kids) rather than by product type" (per exclusiveaddons.com, wpmet.com).

**How it works:** The top-level nav is organized by WHO the customer is (Men, Women, Kids), not WHAT the product is (Boots, Clothing). Within each audience segment, the column layout is identical — "New & Featured," "Shoes," "Clothing," "Accessories & Equipment."

**For Athletica:** This is marked as `[NOT FOUND — ask CEO]` in Part 5 §4.5. The research cannot determine whether Athletica should use audience-first (Men's/Women's) or category-first (Boots/Clothing/Equipment) segmentation. Both are validated by competitors:
- Nike = audience-first (Men/Women/Kids)
- JD Sports = category-first (but gender-organized sections within)
- Foot Locker = gender-first (Men, Women, Kids)
- ASOS = gender-first (Women/Men as primary split)

The distinction matters for Column 1 structure. If audience-first: the top-level nav has fewer items with subcategories inside. If category-first: the top-level nav shows product categories directly.

#### "New & Featured" First-Column Pattern
Per mega-menu-ux-research-part1.md §1.1: "Column 1: 'New & Featured' (curated links: New Releases, Best Sellers, Latest Drops)."

**Pattern:** Every audience section's mega menu starts with a "New & Featured" column. This is NOT a taxonomy column — it's a **marketing/content column** that promotes new arrivals, best sellers, and curated drops.

**For Athletica:** This is the direct inspiration for Part 5's "Category + Edits" Column 1. The principle: **lead with intent, not taxonomy.** Nike's "New & Featured" = JD Sports' "Edits" = Foot Locker's "Featured" column group. All three competitors converge on the same pattern: the first column should answer "What's new?" and "What's popular?" — not "What's the category structure?"

#### Other Nike Details
- **No sticky header** — Nav bar is NOT sticky (per styles.refero.design, mega-menu-ux-research-part1.md §1.1)
- **Two-tier nav bar** — Thin utility bar (search, help, login) in 12px above main nav row
- **Search field:** Background #f5f5f5, 24px border radius, placeholder in #707072
- **Mobile:** Hamburger → full-screen overlay → accordion expansion → staggered fade-in animation (~50ms per item)
- **Mobile:** No images in mobile nav — text-only accordion

---

### 4. Adidas (Part 1 §1.2)

#### Image-Heavy Mega Menu with Bottom Row
Per mega-menu-ux-research-part1.md §1.2: "YES — Adidas uses images extensively in the mega menu" (per wpmet.com — "Visual Storytelling: Uses promotional images to highlight offers and collaborations").

**Distinctive elements:**
- **Promotional banners** for seasonal campaigns and collaborations
- **Category thumbnail images** — The "brands menu" contains thumbnail images for each brand (per econsultancy.com)
- **Large product shots** within the menu for featured/new items (per rsacreativestudio.com)
- **Bottom row:** Full-width bottom section with additional links, "View All" options (per wpmet.com)

**For Athletica:** Adidas demonstrates that images in the mega menu are feasible and engaging — BUT they require performance optimization ("Fast-loading visual assets — optimized for performance within navigation" per wpmet.com). Part 3 §2.4 recommends a **middle ground**: use small thumbnails (48–60px) at Level 2 and Level 3 rather than large promotional images. The bottom row "View All" pattern (from Adidas) is directly adopted in Part 5's wireframe: "View All Boots" and "View All Brands" at the bottom.

#### Dual-Dimension Navigation (Product Type AND Sport)
Per mega-menu-ux-research-part1.md §1.2: "Refined by two orthogonal dimensions: 'Product Type' (Shoes, Clothing, Accessories) AND 'Sports' (Running, Football, Training, Basketball, etc.)" (per wpmet.com).

**How it works:** The mega menu doesn't force users down a single path. Users can browse by:
- **What they want** (Shoes, Clothing, Accessories)
- **What they do** (Running, Football, Training, Basketball)
- **Or both simultaneously**

Per mega-menu-ux-research-part1.md §1.2: "'Many routes in' approach — More paths to find products: by sport, by product type, by brand, by color, by collection" (per econsultancy.com).

**For Athletica:** This dual-dimension approach is adapted in Part 5's "By Surface" column — adding a second dimension (stud type: FG/AG/TF/SG) alongside the primary hierarchy. This is Athletica-specific and a unique differentiator for football boots (per mega-menu-ux-research-part5.md §4.1).

#### Bold "All" Links Pattern
Per mega-menu-ux-research-part1.md §1.2: "Bold 'All' links at the bottom of each submenu" (per econsultancy.com).

**Pattern:** Each submenu section in Adidas's mega menu has a bold "All" link that navigates to the full category page. This is a UX affordance that signals "there's more to see here" — addressing the concern that the mega menu only shows a curated subset.

**For Athletica:** Part 5 adopts this as: "View All [Category]" link at the bottom of each column, and a persistent bottom row with "View All Boots" and "View All Brands" (per mega-menu-ux-research-part5.md §4.1).

#### Other Adidas Details
- **5 top-level items:** MEN, WOMEN, KIDS, Sale, New & Trending
- **No nested sidebar on PLP** — Criticized by econsultancy.com for lacking this ("the most annoying" — per mega-menu-ux-research-part1.md §1.2)
- **"Shop By Color" submenu** — Allows browsing by color directly from navigation
- **Mobile:** Hamburger + off-canvas/accordion; filter buttons smaller than Nike's (more fiddly per econsultancy.com)

---

*Continue to Part B (Decathlon, ASOS, Zalando + Comparison Table) →*

*Document compiled by Probe-Wren on 2026-07-19. Reports to Probe (Director of Intelligence).*
