# Mega Menu UX Research — Comprehensive Report for Athletica (Part 1: Site Analysis — Nike, Adidas, Decathlon)

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-ux-001
> **Date:** 2026-07-19
> **Purpose:** Final comprehensive synthesis of all research inputs to inform Athletica's mega menu design for a 5-level hierarchy (Category → Brand → Model → Sub-model → Product Type)
> **Input sources:** Probe-Orion (Nike/Adidas), Probe-Wren (Decathlon/Foot Locker/JD Sports), Probe-Beacon (ASOS/Zalando), Probe-Sable (Deep Hierarchy Part A & B)

---

## Table of Contents (All Parts)

- **Part 1:** Site Analysis — Nike, Adidas, Decathlon [THIS FILE]
- **Part 2:** Site Analysis — Foot Locker, JD Sports, ASOS, Zalando + Cross-Site Comparison Tables
- **Part 3:** Best Practices for Deep Hierarchies (Desktop)
- **Part 4:** Mobile Strategy
- **Part 5:** Athletica-Specific Recommendations + Sources Cited

---

## Section 1: Site Analysis

### 1.1 Nike.com

**Source:** Probe-Orion research, `megamenu-nike-adidas.md`

#### Levels Visible
- **Top-level nav items:** ~6 primary links: "New & Featured", "Men", "Women", "Kids", "Jordan", "Sale" (per styles.refero.design — structure identical across locales)
- **Visible within mega menu panel:** 2 levels only — bold category headings (not clickable) with subcategory links below them
- **Not shown:** Levels 3+ are NOT exposed inside the mega menu. Users must click through to a category page to see deeper levels.
- **On category pages:** Nike adds a nested left-hand sidebar menu above the filters showing the current category hierarchy (per econsultancy.com comparison)

#### Column Layout
- **3–5 columns** per panel (per thehangline.com; styles.refero.design)
- **Column distribution (Men/Women/Kids identical structure):**
  - Column 1: "New & Featured" (curated links: New Releases, Best Sellers, Latest Drops)
  - Column 2: "Shoes" (subcategories: Lifestyle, Running, Basketball, Football, Training & Gym)
  - Column 3: "Clothing" (subcategories: Tops & T-Shirts, Shorts, Hoodies, Jackets)
  - Column 4 (optional): "Accessories & Equipment" and/or promotional image block
- **White background,** full-width panel, no border/shadow on the nav bar (per styles.refero.design)
- **Typography:** Column headings bold, 14-16px; link text regular weight, slightly smaller (per thehangline.com)

#### Images/Thumbnails
- **NO product thumbnails, category images, or icons** inside the menu columns (per unlimited-elements.com — "No images. It focuses on simplicity"; wpmet.com — "No distracting icons")
- **Promotional image on the right side** — optional one-column-wide promotional banner (per thehangline.com)
- **On category pages:** Nike uses a "pictoral menu" — horizontal row of category tiles WITH images at the top of the PLP (per econsultancy.com)

#### Hover vs Click
- **Desktop:** Hover-triggered with short intent delay (~200-300ms) per thehangline.com and fatcowwebdesign.com
- **Click also supported** — clicking a top-level nav item also opens the panel (accessibility requirement)
- **Close behavior:** Panel closes on mouse-leave. Recommended 150ms close delay prevents accidental closure
- **Keyboard:** Tab → navigates items, Enter/Space → open/close, Escape → close (per fatcowwebdesign.com)

#### Deep Category Handling
- **Nike's approach:** Mega menu intentionally avoids deep hierarchies. Only 2 levels max in the panel.
- **For deeper navigation (3+ levels):**
  1. User clicks a subcategory link (e.g., "Football" under "Shoes") → loads a category page
  2. Category page has a nested left-hand sidebar showing the current category and all sibling subcategories (per econsultancy.com)
  3. Category page also features a "pictoral menu" with images for visual browsing
  4. Further filters (nested left, sticky) handle remaining refinement
- **Philosophy:** Mega menu as a broad funnel, category page navigation for deep drilling. Kept intentionally shallow to avoid choice paralysis (per katsaville.com — "Editing — Help users to navigate without choice paralysis or overwhelm")

#### Distinctive Patterns
1. **Audience-first navigation** — Primary split by audience (Men/Women/Kids) rather than by product type (per exclusiveaddons.com, wpmet.com)
2. **Text-only minimalist design** — No imagery inside the menu panel. Relies on typographic hierarchy and white space (per unlimited-elements.com)
3. **Consistent structure across sections** — Every audience section uses the same column layout (per katsaville.com)
4. **"New & Featured" as first column** — Blends marketing content with navigation (per exclusiveaddons.com, katsaville.com)
5. **No sticky header** — Nav bar is NOT sticky, sits on white background with no fill/shadow/border (per styles.refero.design)
6. **Two-tier nav bar** — Thin utility bar (search, help, login) in 12px above main nav row (per styles.refero.design)
7. **Search field:** Background #f5f5f5, 24px border radius, placeholder in #707072 (per styles.refero.design)

#### Mobile Approach
- **Hamburger icon** opens a **full-screen overlay** (per muffingroup.com — "splits items into sections under visible headings")
- **Accordion-style expansion** — Tapping a top-level item expands inline to show subcategories (per muffingroup.com, nngroup.com/mobile-subnavigation/)
- **Staggered fade-in animation** — Items fade in ~50ms apart (per muffingroup.com)
- **4 main parent categories:** Men, Women, Kids, Nike by You (per uxdesign.cc)
- **No images in mobile nav** — Text-only accordion (per muffingroup.com)
- **Desktop structure translates** to simplified accordion format for mobile (per wpmet.com)

---

### 1.2 Adidas.com

**Source:** Probe-Orion research, `megamenu-nike-adidas.md`

#### Levels Visible
- **Top-level nav items:** 5 primary links: "MEN", "WOMEN", "KIDS", "Sale", "New & Trending" (per plerdy.com; confirmed via adidas.com)
- **Visible within mega menu panel:** 2 levels typically — category headings + subcategory links
- **Not shown:** Levels 3+ are NOT exposed in the mega menu. Users click through to category/subcategory pages for deeper refinement.
- **Refinement on category pages:** Robust filter systems (by price, discount, sport, product type) handle deep drilling (per econsultancy.com)

#### Column Layout
- **Multi-column layout** with gender-based categories (per wpmet.com)
- **Refined by two orthogonal dimensions:** "Product Type" (Shoes, Clothing, Accessories) AND "Sports" (Running, Football, Training, Basketball, etc.) (per wpmet.com)
- **Distinctive BOTTOM ROW** — Full-width bottom section with additional links, "View All" options (per wpmet.com — "includes the bottom row for further information")
- **Column distribution (estimated):**
  - Columns for product types (Shoes, Clothing, Accessories)
  - Columns for sports categories
  - Bottom row: "View All" links, featured content
  - Right-side or interspersed: promotional images/banners
- **High-contrast design elements** with bold typography (per wpmet.com)

#### Images/Thumbnails
- **YES — Adidas uses images extensively** in the mega menu (per wpmet.com — "Visual Storytelling: Uses promotional images to highlight offers and collaborations")
- **Promotional banners** for seasonal campaigns, collaborations (per wpmet.com)
- **Category thumbnail images** — The "brands menu" contains thumbnail images for each brand (per econsultancy.com)
- **Large product shots** within the menu for featured/new items (per rsacreativestudio.com)
- **Fast-loading visual assets** — optimized for performance within navigation (per wpmet.com)

#### Hover vs Click
- **Desktop:** Hover-triggered with intent delay (~200-300ms) per industry standard
- **Click also supported** for keyboard and touch accessibility
- **Close:** Panel dismisses on mouse-leave with a forgiveness delay

#### Deep Category Handling
- **Adidas approach:** Like Nike, the mega menu shows max 2 levels.
- **For deeper navigation:**
  1. User clicks a subcategory (e.g., "Shoes" under "Men") → goes to category page
  2. Category pages use robust filter panels (by sport, price, discount, size, color) for deeper refinement
  3. Category pages feature a "category grid" with product thumbnails and "Shop Now" CTAs (per mobbin.com)
- **Key difference from Nike:** Adidas does NOT have the nested left-hand sidebar menu on category pages (per econsultancy.com — "the lack of that nested menu... is the most annoying")
- **"Many routes in" approach** — More paths to find products: by sport, by product type, by brand, by color, by collection (per econsultancy.com)

#### Distinctive Patterns
1. **Image-heavy mega menu** — Promotional images, product shots, category thumbnails within the menu (per wpmet.com, rsacreativestudio.com)
2. **Bottom row in mega menu** — Full-width bottom section with additional links/CTAs (per wpmet.com)
3. **"Shop By Color" submenu** — Allows browsing by color directly from navigation (per wpmet.com)
4. **Sport-specific sub-categories** — Organizes by sport (Running, Football, Training, Basketball) as a first-class dimension (per wpmet.com)
5. **Bold, large typography** — Large sans-serif fonts, highly readable (per wpmet.com)
6. **Dynamic "New & Trending" sections** — Frequently updated to drive engagement (per wpmet.com)
7. **"All" category links in bold** — Bold "All" links at the bottom of each submenu (per econsultancy.com)
8. **Dual dimension navigation** — Browse by "Product Type" OR by "Sport" (per wpmet.com)

#### Mobile Approach
- **Hamburger menu** with main top-level categories (MEN, WOMEN, KIDS, Sale, New & Trending)
- **Large category links** below the fold on mobile homepage as quick-entry shortcut (per econsultancy.com — "a smart move, given some may instinctively scroll, rather than heading for the burger menu")
- **Off-canvas or accordion pattern** for subcategory expansion (per creativecorner.studio)
- **Filter buttons** on mobile are smaller than Nike's — more fiddly (per econsultancy.com)
- **Filter menu issue:** Once open, cannot simply exit; must reload product selection (per econsultancy.com)

---

### 1.3 Decathlon

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`

#### Levels Visible
- **Desktop: 2 levels visible** in the main navigation panel (category → subcategory). Deeper levels (3+) require clicking through to category landing pages, which reveal further subcategories via sidebar navigation ("Activities" sidebar).
- Decathlon does NOT show 3+ levels directly in the menu. They flatten to 2 levels max in the dropdown.
- Source: decathlon.com HTML structure analysis; aureatelabs.com CRO analysis (2024)

#### Column Layout
- **Mega menu is NOT used in the traditional sense.** Decathlon uses a search-navigation hybrid approach instead of a classic mega menu.
- On desktop, clicking a top-level category triggers a search-like overlay showing: (a) relevant subcategories as a structured list, (b) popular/featured products, (c) the search field auto-populated with the category name.
- Layout is a single-column list of subcategories + a product card section, not a multi-column grid.
- Source: hmmh.de/en/projects/decathlon-search-navigation

#### Images/Thumbnails
- **Yes** — subcategory landing pages show product thumbnails and category hero images. The search-navigation overlay shows product cards with images.
- Source: aureatelabs.com CRO analysis; decathlon.com HTML

#### Hover vs Click
- **Click to open.** The navigation is triggered by clicking a category link. It does NOT open on hover.
- The search-navigation system requires a deliberate click because it populates the search field and fetches results simultaneously.
- Source: hmmh.de case study: "Clicking on one of them makes it the first part of a search query"

#### Deep Category Handling
- Decathlon handles deep hierarchy by **delegating depth to category landing pages.** The main menu only shows 2 levels. Level 3+ is surfaced through:
  - **Category landing page** with a sidebar "Activities" navigation showing sibling/subsidiary categories
  - **Breadcrumbs** at the top of every category page
  - **Left-side filters** on PLPs for attributes (size, price, brand, color, etc.)
- Source: aureatelabs.com analysis: "sidebar navigation called 'Activities' provides additional browsing options"

#### Distinctive Patterns
1. **Search-Navigation Hybrid** — Categories integrated INTO the search experience. "Significantly more conversions" in A/B tests (hmmh case study).
2. **"Activities" Sidebar** — Persistent left sidebar on category pages showing related categories.
3. **Six quick-access categories** below the search bar.
4. **Vitamin Web design system** — Open-source design system with accordion and navigation components.
5. **No traditional mega menu** — Deliberately avoids a classic mega menu despite thousands of products.

#### Mobile Approach
- Hamburger menu (off-canvas drawer) with accordion-style expandable categories.
- Vitamin design system includes accordion components for mobile navigation.
- Search is prominently positioned at the top — reflects search-first philosophy.
- Breadcrumbs persist on mobile for orientation.

---

*End of Part 1 — continues in Part 2 (Foot Locker, JD Sports, ASOS, Zalando + comparison tables)*
