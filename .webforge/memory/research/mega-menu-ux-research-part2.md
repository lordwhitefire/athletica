# Mega Menu UX Research — Comprehensive Report for Athletica (Part 2: Site Analysis — Foot Locker, JD Sports, ASOS, Zalando + Comparison Tables)

> **Compiled by:** Probe-Orion (Intelligence Team)
> **Task:** task-mega-menu-ux-001
> **Date:** 2026-07-19
> **Input sources:** Probe-Orion, Probe-Wren, Probe-Beacon, Probe-Sable research

---

## Section 1: Site Analysis (continued)

### 1.4 Foot Locker

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`

#### Levels Visible
- **Desktop: 2 levels** visible in the main mega menu panel (category → subcategory). Deeper levels require clicking to a PLP.
- Top-level categories: **Back to School, Men's, Women's, Kids', New Arrivals, Releases, Sale** (7 items).
- Source: footlocker.com homepage HTML

#### Column Layout
- **Multi-column mega menu** — On hover/click of a top-level category (e.g., "Men's"), a full-width panel appears with subcategories organized into groups.
- Each mega menu panel has approximately **4-6 columns** depending on the category.
- Column groups have bold headers (e.g., "Featured," "Shoes," "Clothing," "Accessories," "Brands") with subcategory links below each header.
- Source: Richard Ilott's JD Sports case study references Foot Locker patterns

#### Images/Thumbnails
- **[NOT FOUND — further research needed]** Foot Locker's mega menu appears to be primarily text-link based for subcategories. The "New Arrivals" and "Releases" sections may include product images, but main category dropdowns are link-heavy.
- Category landing pages and PLPs use large hero images and product thumbnails.

#### Hover vs Click
- **Hover to open** the mega menu panel on desktop. Subcategory links within the panel require a click to navigate.
- Source: footlocker.com navigation behavior

#### Deep Category Handling
- Foot Locker has a relatively **shallow hierarchy** (typically 2-3 levels max):
  - Level 1: Gender/Section (Men's, Women's, Kids')
  - Level 2: Product Type (Shoes, Clothing, Accessories, Brands)
  - Level 3: Specific type (Trainers, Boots, Sandals — on the PLP as filters)
- Any depth beyond 2 levels is handled via **faceted navigation on the PLP** (left sidebar filters for size, color, price, brand, width).
- No fly-out or nested submenus — the mega menu is flat (2-level max).
- Source: footlocker.com PLP filter structure

#### Distinctive Patterns
1. **Brand-as-column** — Each mega menu panel includes a dedicated "Brands" column listing top brands. Directly relevant to Athletica's Level 2 (Brand).
2. **Gender-first taxonomy** — Organizes by gender (Men, Women, Kids), then by product type.
3. **"Shop by" groupings within the menu** — Subcategories grouped by shopping intent, not just taxonomy.
4. **Promotional slots in navigation** — "Sale" has distinct visual treatment (typically red or highlighted).
5. **Product Merchandised Pages (PMPs)** — Dedicated landing pages for key product types.

#### Mobile Approach
- **Hamburger menu** (off-canvas drawer) on mobile.
- Categories expand as accordion-style lists. Tap parent → shows child links vertically.
- Search is prominent above the hamburger menu.
- **Baymard rating:** Foot Locker is a **Top 1% Baymard performer** (per Probe-Sable's Part B research).

---

### 1.5 JD Sports

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`

#### Levels Visible
- **Desktop: 2 levels** visible in the mega menu panel (category → subcategory). Deeper levels require clicking through.
- Top-level categories: **Back To School, Men, Women, Kids, Collections, Sale, Brands** (7 items).
- Source: jdsports.co.uk HTML (observed `level0` nav items)

#### Column Layout
- **Full-width mega menu** with **5-6 columns** per panel.
- Each top-level category (Men, Women, Kids) has a consistent column structure:
  - Column 1: "Edits" (curated collections: New In, Summer Edit, Holiday Shop)
  - Column 2: Footwear (Trainers, Boots, Slides, Running Shoes, Football Boots)
  - Column 3: Clothing (T-Shirts, Hoodies, Tracksuits, Jackets)
  - Column 4: Accessories (Bags, Caps, Socks, Sunglasses)
  - Column 5: Brands (Nike, adidas, New Balance, etc.)
  - Column 6: Collections (specific product collections like Air Max 95)
- Some columns have a clickable header linking to the full category page.
- Source: jdsports.co.uk HTML (`nav-panel` divs with `nav-links` containing multiple `ul` elements)

#### Images/Thumbnails
- **Yes** — JD Sports uses promotional images in a dedicated `nav-promotions` section.
- Each mega menu panel has a right-side promotion column with a large product/category image and a CTA link.
- Source: jdsports.co.uk HTML (`.nav-promotions` div with `<img>` tags using Amplience CDN)

#### Hover vs Click
- **Hover to open** the mega menu panel on desktop. Appears when hovering over any top-level link with children (`wChild` class).
- **"Close Menu" button** (`nav-menu-close`) to dismiss the panel.
- Source: jdsports.co.uk HTML

#### Deep Category Handling
- JD Sports **flattens everything to 2 levels in the menu.** No fly-out submenus.
- For deeper navigation (e.g., Men → Footwear → Football Boots), users click through to the category page where they find:
  - **Left sidebar filters** (brand, size, color, price, etc.)
  - **Breadcrumbs** showing the full path
  - **Faceted navigation** for further refinement
- Navigation redesign by **Richard Ilott** explicitly addressed the problem of menus reflecting "internal org structure, not customer mental models."

#### Distinctive Patterns
1. **Consistent column structure across categories** — Every top-level category uses the exact same 6-column layout: Edits → Footwear → Clothing → Accessories → Brands → Collections.
2. **"Edits" as the first column** — Curated, intent-based shopping prioritized over pure taxonomy (per Richard Ilott's redesign).
3. **Dual image + text mega menu** — Right side has a large promotional image (Amplience CDN).
4. **Promotional top-level item** — "Back To School" as a top-level category with its own mega menu.
5. **Flexible mega menu templates** — Documentation and templates so new categories could be added without breaking IA.
6. **Search integrated in the header** — Large search bar with live search, trending/recent searches.

#### Mobile Approach
- **Off-canvas drawer** triggered by hamburger icon.
- Accordion-style expandable categories (tap parent → reveals child links).
- Full-screen overlay pattern for search.
- Shared taxonomy with platform-appropriate interaction patterns (per Richard Ilott's redesign).

---

### 1.6 ASOS

**Source:** Probe-Beacon research, `megamenu-fashion-platforms.md`

#### Levels Visible
- **2 levels visible on hover:** Top-level category name + one level of subcategories beneath it.
- Top-level nav bar: Women, Men, New In, Brands, Sale (red highlighted)
- Gender selection ("Women/Men") is the primary entry-point split.
- Sub-levels beyond the first tier require a click through to the category landing page.
- Source: Digital Silk mega menu analysis (digitalsilk.com)

#### Column Layout
- **Multi-column layout** with 3-4 columns beneath category headings.
- Columns divided by category groups (e.g., "Clothing", "Shoes", "Accessories" as headers).
- **Prominent image panel occupies the right side** of the mega menu.
- Columns have clear heading hierarchy: bold category names with indented subcategory links below.

#### Images/Thumbnails
- **Limited use of images** in the main link columns — relies primarily on typography and whitespace.
- **One featured image on the right** of each mega menu panel promoting a curated collection.
- **Brand logos are NOT displayed** inside the mega menu; brands are in a separate "Brands" section.
- No product thumbnails in the navigation tree itself.

#### Hover vs Click
- **Hover-activated** on desktop — hovering over a top-level nav item triggers the panel.
- Clicking the top-level label navigates to that category landing page.
- Subcategory links within the mega menu are clickable.
- No hover delay information available [NOT FOUND — further research needed].

#### Deep Category Handling
- ASOS does NOT display more than 2 levels deep in the mega menu.
- Beyond the first tier of subcategories, users must click through to the category landing page.
- The category landing page uses further sub-navigation (sidebar or horizontal sub-nav) to drill deeper.
- Breadcrumbs are used on category/product pages for orientation.

#### Distinctive Patterns
- **Red text for Sale links:** The only color break in the otherwise monochrome menu (per Digital Silk).
- **Whitespace-dominant design:** Relies heavily on negative space and clear typography.
- **Gender segmentation as primary entry point:** Women/Men selection at the very top.
- **"New In" as a persistent top-level item:** Always accessible.
- **A–Z Brands directory:** Separate brand browsing via alphabetical listing.

#### Mobile Approach
- **Hamburger menu icon** reveals a sliding panel.
- **Gender selection persists at top** of the mobile nav.
- Categories open a **new screen** with subcategories — **drill-down navigation pattern** (tap to go deeper, back button to return).
- **Filters slide in from the right** on PLPs (size, color, brand, fit, style, price).
- Search bar is always visible and prominent at the top.

#### Brand Handling
- Brands are NOT listed within the category mega menu.
- A **separate "Brands" top-level nav item** links to a dedicated brand directory page.
- Brand directories split by Women/Men and use A–Z alphabetical listing.

---

### 1.7 Zalando

**Source:** Probe-Beacon research, `megamenu-fashion-platforms.md`

#### Levels Visible
- **2 levels visible in the mega menu** — top-level category and immediate subcategories.
- First segmentation is **Women / Men / Kids** — the dominant entry point.
- After selecting a gender/age segment, the nav shows: New Arrivals, Clothing, Shoes, Accessports, Brands, Sale.
- Sub-levels beyond the initial mega menu panel require navigation to the category page.
- Zalando's IA: **shallow depth** — important pages reachable in 2-3 clicks (per happycoding.agency).

#### Column Layout
- **Multi-column layout** with categories divided into columnar groups.
- Columns use **icon-based pictograms** instead of product photos for category identification.
- Layout uses clear column headers with sub-items listed beneath.
- **Content-inspired sections** alongside product categories (e.g., "Festival Looks", "Outdoor Essentials").
- Source: happycoding analysis ("Icons instead of images", "Inspiration over Hierarchy")

#### Images/Thumbnails
- **Icons/pictograms used instead of product images** — follows **Law of Prägnanz**: clear, reduced forms faster to grasp.
- **No product thumbnails** in the primary navigation columns.
- **Inspirational imagery** may appear in promotional sections within the menu.

#### Hover vs Click
- **Hover-activated** on desktop with **deliberate hover delay** (~200-300ms) to prevent accidental triggers.
- The hover delay is a documented UX pattern from usability research.
- Clicking a top-level label navigates to that category's landing page.
- Source: happycoding analysis ("Hover delay on submenus")

#### Deep Category Handling
- Zalando follows a **shallow depth architecture** — key pages 2-3 clicks from homepage.
- Categories deeper than 2 levels handled on the category landing page, not the mega menu.
- **Visible breadcrumbs** on every category/product page.
- **Filter chips** on category pages allow narrowing within deep hierarchies.

#### Distinctive Patterns
- **Early segmentation as strategic lever:** Women/Men/Kids choice stored in a cookie (`ncx`) so returning visitors skip this step — applies Hick's Law.
- **"Inspiration over Hierarchy":** Content-driven entry points like "Festival Looks", "Sustainable Styles".
- **Personalized navigation:** Recommendations adapt based on behavior, location, and device.
- **Icon-based categories** (pictograms) — reduces cognitive load.
- **Permanent scope indicator:** Active gender segment remains highlighted throughout session.
- **Brand strategy through nav:** Categories communicate brand values (sustainability, exclusivity).

#### Mobile Approach
- **Mobile-first design** — independently designed, not shrunken desktop.
- **Clear tap targets** with adequate spacing.
- **Sticky header** remains visible during scrolling.
- **Prominent filter buttons** on PLPs.
- **Gender segmentation remains the first choice** on mobile.
- **Breadcrumbs and filter chips** visible on mobile for orientation.
- Principle: "Every category is a tap, not a puzzle."

#### Brand Handling
- Brands integrated into the category structure (e.g., Clothing → Brands → Nike).
- Also has a **dedicated brands directory** at the top level.
- Brands have their own "brand hub" pages with curated assortments.
- Brand pages include filtering by category, size, color, price.

---

### 1.8 Cross-Site Comparison Tables

#### Nike vs Adidas

| Aspect | Nike.com | Adidas.com |
|---|---|---|
| **Top-level items** | ~6 (New & Featured, Men, Women, Kids, Jordan, Sale) | ~5 (MEN, WOMEN, KIDS, Sale, New & Trending) |
| **Levels in menu** | 2 (heading + subcategory links) | 2 (subcategory links + optional bottom row) |
| **Columns** | 3-5 text columns + optional promo image | Multi-column + images + bottom row |
| **Images in menu** | No (text-only) | Yes (promotional banners, thumbnails) |
| **Hover/Click** | Hover with intent delay + click/keyboard | Hover with intent delay + click/keyboard |
| **Deep hierarchy** | Nested sidebar on PLP + filters | PLP filters (no nested sidebar) |
| **Mobile pattern** | Full-screen overlay + accordion | Hamburger + off-canvas/accordion |
| **Unique feature** | Nested left-hand sidebar on PLP | "Shop By Color" + bottom row in menu |

#### Sports Retailers Comparison

| Feature | Decathlon | Foot Locker | JD Sports |
|---|---|---|---|
| **Menu type** | Search-navigation hybrid | Traditional mega menu | Traditional mega menu + promo |
| **Levels in menu** | 2 (then → landing page) | 2 (then → PLP filters) | 2 (then → PLP filters) |
| **Column count** | N/A (search overlay) | 4-6 columns | 5-6 columns + 1 promo |
| **Images in menu** | In search results only | Minimal (text-first) | Yes — promo column |
| **Trigger** | Click | Hover | Hover (with close button) |
| **Brands column** | Not in menu | Yes — per category | Yes — per category |
| **Mobile pattern** | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion |
| **Deep hierarchy** | "Activities" sidebar | PLP facets + breadcrumbs | PLP facets + breadcrumbs |
| **Unique strength** | Search-nav hybrid boosts conversion | Brand column per category | Consistent column template |

#### Fashion Platforms Comparison

| Feature | ASOS | Zalando |
|---|---|---|
| **Primary split** | Women/Men (top bar) | Women/Men/Kids (stored in cookie) |
| **Visible levels in menu** | 2 (category + subcategory) | 2 (category + subcategory) |
| **Images in menu** | 1 featured promo image (right side) | Icons/pictograms only |
| **Hover activation** | Hover (no delay info found) | Hover with ~200-300ms delay |
| **Deep categories (>2)** | Landing page sub-nav | Breadcrumbs + filter chips |
| **Menu width** | Partial width + right-side image | Full-width panel |
| **Mobile pattern** | Hamburger → drill-down screens | Mobile-first, sticky header |
| **Brand navigation** | Separate A–Z brand directory | Integrated + brand hubs |
| **Inspirational content** | Limited (1 promo image) | Heavy: trends, seasonal looks |
| **Personalization** | Limited | Extensive: behavior/location/device |

#### Full 7-Site Comparison

| Feature | Nike | Adidas | Decathlon | Foot Locker | JD Sports | ASOS | Zalando |
|---|---|---|---|---|---|---|---|
| **Levels in menu** | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| **Columns** | 3-5 | Multi + bottom row | N/A (search) | 4-6 | 5-6 + promo | 3-4 + promo | Multi + icons |
| **Images in menu** | No | Yes | Search results | Minimal | Yes | 1 promo | Icons only |
| **Trigger** | Hover + click | Hover + click | Click | Hover | Hover + close | Hover | Hover w/ delay |
| **Brands column** | No | No | No | Yes | Yes | No | Integrated |
| **Mobile** | Overlay + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + drill-down | Mobile-first |
| **Deep nav** | Sidebar + filters | Filters only | "Activities" sidebar | PLP facets | PLP facets | Sub-nav + breadcrumbs | Breadcrumbs + chips |

---

*End of Part 2 — continues in Part 3 (Best Practices for Deep Hierarchies)*
