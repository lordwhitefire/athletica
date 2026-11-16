# Mega Menu UX Research: Sports Retailers

**Researched by:** Probe-Wren
**Date:** 2026-07-19
**Purpose:** Inform Athletica's mega menu design (Next.js + Tailwind + Sanity CMS, 5-level category hierarchy)

---

## Site 1: Decathlon (decathlon.com / decathlon.co.uk)

### Levels visible
- **Desktop:** 2 levels visible in the main navigation panel (category → subcategory). Deeper levels (3+) require clicking through to category landing pages, which then reveal further subcategories via sidebar navigation ("Activities" sidebar).
- Decathlon does NOT show 3+ levels directly in the menu. They flatten to 2 levels max in the dropdown, then use the category landing page for deeper refinement.
- Source: decathlon.com HTML structure analysis; aureatelabs.com CRO analysis (2024) confirms sidebar navigation on category pages shows further subcategory levels.

### Column layout
- **Mega menu is NOT used in the traditional sense.** Decathlon uses a search-navigation hybrid approach instead of a classic mega menu.
- On desktop, clicking a top-level category triggers a search-like overlay showing: (a) relevant subcategories as a structured list, (b) popular/featured products, (c) the search field auto-populated with the category name.
- The layout is a single-column list of subcategories + a product card section, not a multi-column grid.
- Source: hmmh.de/en/projects/decathlon-search-navigation (Decathlon's search-navigation hybrid case study).

### Images
- **Yes** — subcategory landing pages show product thumbnails and category hero images. The search-navigation overlay shows product cards with images for popular/featured items.
- Category pages have hero images and product galleries.
- Source: aureatelabs.com CRO analysis; decathlon.com HTML (image elements found in category templates).

### Hover/Click
- **Click to open.** The navigation is triggered by clicking a category link. It does NOT open on hover.
- The search-navigation system requires a deliberate click because it populates the search field and fetches results simultaneously.
- Source: hmmh.de case study: "Clicking on one of them makes it the first part of a search query by including the term as a keyword in the search field."

### Deep category handling
- Decathlon handles deep hierarchy by **delegating depth to category landing pages.** The main menu only shows 2 levels. Level 3+ is surfaced through:
  - **Category landing page** with a sidebar "Activities" navigation showing sibling/subsidiary categories.
  - **Breadcrumbs** at the top of every category page showing the full path.
  - **Left-side filters** on PLPs for attributes (size, price, brand, color, etc.).
- Source: aureatelabs.com analysis: "sidebar navigation called 'Activities' provides additional browsing options within the category... includes links to all the subcategories (collections) that fall in the same category."

### Distinctive patterns
1. **Search-Navigation Hybrid** — Decathlon's most distinctive pattern. Categories are integrated INTO the search experience. Clicking a category populates the search box and shows a combined category + product results overlay. This was the result of a design sprint (hmmh + Decathlon) and showed "significantly more conversions" in A/B tests.
2. **"Activities" Sidebar** — On category pages, a persistent left sidebar shows related categories/activities. This allows users to pivot to a different subcategory without returning to the main menu.
3. **Six quick-access categories** — Below the search bar, six top categories are shown as quick links that double as search keywords.
4. **Vitamin Web design system** — Decathlon uses its own open-source design system (Vitamin) with dedicated accordion and navigation components.
5. **No traditional mega menu** — Despite having thousands of products across dozens of sports, Decathlon deliberately avoids a classic mega menu. They rely on search-first navigation.

### Mobile approach
- Hamburger menu (off-canvas drawer) with accordion-style expandable categories.
- Decathlon's Vitamin design system includes accordion components specifically for mobile navigation.
- Search is prominently positioned at the top — reflects the search-first philosophy.
- Breadcrumbs persist on mobile for orientation.
- Source: Decathlon Vitamin Web GitHub (accordion component PR); decathlon.com mobile HTML structure.

### Summary for Athletica
- Decathlon's approach proves that for huge catalogs, a **search-first hybrid** can outperform a mega menu.
- They **cap menu depth at 2 levels** and handle deeper navigation through category landing pages + sidebar navigation + breadcrumbs.
- The "Activities" sidebar pattern is directly applicable to Athletica's 5-level hierarchy.

---

## Site 2: Foot Locker (footlocker.com / footlocker.co.uk)

### Levels visible
- **Desktop: 2 levels** visible in the main mega menu panel (category → subcategory). Deeper levels require clicking to a PLP.
- Foot Locker's top-level categories: **Back to School, Men's, Women's, Kids', New Arrivals, Releases, Sale** (7 items).
- Source: footlocker.com homepage HTML (observed top-level nav items).

### Column layout
- **Multi-column mega menu** — On hover/click of a top-level category (e.g., "Men's"), a full-width panel appears with subcategories organized into groups.
- Each mega menu panel has approximately **4-6 columns** depending on the category.
- Column groups have bold headers (e.g., "Featured," "Shoes," "Clothing," "Accessories," "Brands") with subcategory links below each header.
- Source: Richard Ilott's JD Sports case study references Foot Locker patterns; general observation from footlocker.com navigation structure.

### Images
- **[NOT FOUND — further research needed]** Foot Locker's mega menu appears to be primarily text-link based for subcategories. The "New Arrivals" and "Releases" sections may include product images, but the main category dropdowns are link-heavy.
- Category landing pages and PLPs use large hero images and product thumbnails.
- Source: footlocker.com HTML structure (nav link density suggests text-first approach).

### Hover/Click
- **Hover to open** the mega menu panel on desktop. Subcategory links within the panel require a click to navigate.
- Source: footlocker.com navigation behavior (standard e-commerce hover mega menu).

### Deep category handling
- Foot Locker has a relatively **shallow hierarchy** (typically 2-3 levels max):
  - Level 1: Gender/Section (Men's, Women's, Kids')
  - Level 2: Product Type (Shoes, Clothing, Accessories, Brands)
  - Level 3: Specific type (Trainers, Boots, Sandals, etc. — on the PLP as filters/facets)
- Any depth beyond 2 levels is handled via **faceted navigation on the PLP** (left sidebar filters for size, color, price, brand, width).
- No fly-out or nested submenus — the mega menu is flat (2-level max).
- Source: footlocker.com PLP filter structure; category hierarchy observed from URL patterns.

### Distinctive patterns
1. **Brand-as-column** — Each mega menu panel includes a dedicated "Brands" column listing top brands for that category (e.g., Men's dropdown shows Nike, adidas, Jordan, New Balance, etc.). This is directly relevant to Athletica's Level 2 (Brand) hierarchy.
2. **Gender-first taxonomy** — Foot Locker organizes primarily by gender (Men, Women, Kids), then by product type. This matches Athletica's potential user mental model.
3. **"Shop by" groupings within the menu** — Subcategories are grouped by shopping intent, not just product taxonomy (e.g., "New Arrivals", "Best Sellers", "Sale" appear alongside product-type links).
4. **Promotional slots in navigation** — "Sale" has a distinct visual treatment (typically red or highlighted).
5. **Product Merchandised Pages (PMPs)** — Dedicated landing pages for key product types with curated content.

### Mobile approach
- **Hamburger menu** (off-canvas drawer) on mobile.
- Categories expand as accordion-style lists.
- Tap to expand parent → shows child links vertically.
- Search is prominent above the hamburger menu.
- Source: footlocker.com mobile behavior (responsive navigation pattern); Richard Ilott's navigation redesign case study (mentions aligning mobile/desktop behavior).

### Summary for Athletica
- Foot Locker's **brands column within each category** is directly applicable — Athletica's Level 2 is Brand.
- **2-level max in menu** with deeper filtering on PLP matches Athletica's need.
- **Gender-first hierarchy** is worth considering for Athletica (Men's Boots, Women's Boots, Kids' Boots).

---

## Site 3: JD Sports (jdsports.co.uk)

### Levels visible
- **Desktop: 2 levels** visible in the mega menu panel (category → subcategory). Like Foot Locker, deeper levels require clicking through.
- Top-level categories: **Back To School, Men, Women, Kids, Collections, Sale, Brands** (7 items).
- Source: jdsports.co.uk HTML navigation structure (observed `level0` nav items).

### Column layout
- **Full-width mega menu** with **5-6 columns** per panel.
- Each top-level category (Men, Women, Kids) has a consistent column structure:
  - Column 1: "Edits" (curated collections like New In, Summer Edit, Holiday Shop)
  - Column 2: Footwear (Trainers, Boots, Slides, Running Shoes, Football Boots)
  - Column 3: Clothing (T-Shirts, Hoodies, Tracksuits, Jackets)
  - Column 4: Accessories (Bags, Caps, Socks, Sunglasses)
  - Column 5: Brands (Nike, adidas, New Balance, etc.)
  - Column 6: Collections (specific product collections like Air Max 95, Handball Spezial)
- Some columns have a clickable header that links to the full category page.
- Source: jdsports.co.uk HTML (`nav-panel` divs with `nav-links` containing multiple `ul` elements, each representing a column).

### Images
- **Yes** — JD Sports uses promotional images in a dedicated `nav-promotions` section of the mega menu.
- Each mega menu panel has a right-side promotion column with a large product/category image and a CTA link (e.g., "Shop Back To School" with a lifestyle image).
- Source: jdsports.co.uk HTML (`.nav-promotions` div with `<img>` tags using Amplience CDN).

### Hover/Click
- **Hover to open** the mega menu panel on desktop. The panel appears when hovering over any top-level link that has children (`wChild` class).
- There is also a "Close Menu" button (`nav-menu-close`) to dismiss the panel.
- Source: jdsports.co.uk HTML (navigation close button + hover-triggered panel behavior).

### Deep category handling
- JD Sports **flattens everything to 2 levels in the menu.** No fly-out submenus.
- For deeper navigation (e.g., Men → Footwear → Football Boots), users must click through to the category page where they find:
  - **Left sidebar filters** (brand, size, color, price, etc.)
  - **Breadcrumbs** showing the full path
  - **Faceted navigation** for further refinement
- JD Sports' navigation **redesign by Richard Ilott** explicitly addressed the problem of menus reflecting "internal org structure, not customer mental models."
- Source: Richard Ilott's case study on JD Sports main navigation; jdsports.co.uk PLP structure.

### Distinctive patterns
1. **Consistent column structure across categories** — Every top-level category (Men, Women, Kids) uses the exact same 6-column layout pattern: Edits → Footwear → Clothing → Accessories → Brands → Collections. This creates predictability.
2. **"Edits" as the first column** — Curated, intent-based shopping (New In, Summer Edit, Holiday Shop) is prioritized over pure taxonomy. This reflects the shift from "internal org structure to customer mental models" per Richard Ilott's redesign.
3. **Dual image + text mega menu** — The right side of each mega menu panel has a large promotional image (hosted on Amplience CDN), combining link navigation with visual merchandising.
4. **Promotional top-level item** — "Back To School" appears as a top-level category with its own dedicated mega menu, keeping seasonal campaigns at the same level as core categories.
5. **Flexible mega menu templates** — Part of Richard Ilott's redesign: created documentation and templates so new categories/campaigns could be added without breaking the IA.
6. **Search integrated in the header** — Large search bar with live search, trending searches, recent searches, and recently viewed products all in the search dropdown.

### Mobile approach
- **Off-canvas drawer** triggered by hamburger icon.
- Accordion-style expandable categories (tap parent → reveals child links).
- Full-screen overlay pattern for search.
- The mobile navigation uses a **shared taxonomy with platform-appropriate interaction** patterns (per Richard Ilott's redesign principles).
- Source: jdsports.co.uk mobile behavior; Richard Ilott's case study notes "greater consistency between mobile and desktop."

### Summary for Athletica
- **Consistent column template** across categories is the key takeaway — every main section has the same structure (Edits → Product Types → Brands).
- The **"Edits" column** (curated, intent-based shopping) is relevant for Athletica's seasonal campaigns.
- **Dual link + promo image** in mega menu is a proven engagement pattern.
- The **navigation governance** principles (Richard Ilott's redesign) — defining rules for what goes where — is critical for Athletica as the catalog grows.

---

## Cross-Site Comparison Table

| Feature | Decathlon | Foot Locker | JD Sports |
|---|---|---|---|
| **Menu type** | Search-navigation hybrid | Traditional mega menu | Traditional mega menu + promo image |
| **Levels in menu** | 2 (then → landing page) | 2 (then → PLP filters) | 2 (then → PLP filters) |
| **Column count** | N/A (search overlay) | 4-6 columns | 5-6 columns + 1 promo |
| **Images in menu** | In search results only | Minimal (text-first) | Yes — promo column with CDN images |
| **Trigger** | Click | Hover | Hover (with close button) |
| **Brands column** | Not in menu (on PLP) | Yes — per category | Yes — per category |
| **Mobile pattern** | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion |
| **Deep hierarchy** | "Activities" sidebar + breadcrumbs | PLP facets + breadcrumbs | PLP facets + breadcrumbs |
| **Unique strength** | Search-nav hybrid boosts conversion | Brand column per category | Consistent column template + promo |

---

## Key Recommendations for Athletica

### 1. Cap menu depth at 2 levels
All three retailers cap the mega menu at 2 visible levels. Athletica's 5-level hierarchy (Category → Brand → Model → Sub-model → Product Type) should NOT be shown in the menu all at once. Levels 3-5 belong on category landing pages with faceted navigation.

### 2. Include a Brands column
Both Foot Locker and JD Sports include a dedicated Brands column in every mega menu panel. Since Athletica's Level 2 is Brand (Nike, Adidas, Puma, etc.), brands should be prominent in the menu — not buried as a subcategory.

### 3. Add curated "Edits" to the first column
JD Sports' first column is always "Edits" — curated, intent-based groupings. Athletica should include a similar column for "New In", "Best Sellers", "By Playing Surface" (FG, AG, TF, SG).

### 4. Use click trigger (like Decathlon) or hover + close button (like JD Sports)
Hover-only is risky for accessibility. Consider click-to-open (Decathlon pattern) or hover with a visible close button (JD Sports pattern). Per 2026 UX best practices, click is the safer default.

### 5. Deep hierarchy lives on the PLP
For Athletica's deeper levels (Model → Sub-model → Product Type), use a sidebar faceted navigation on the PLP, with breadcrumbs for orientation — exactly like Decathlon's "Activities" sidebar.

### 6. Search integration is critical
Decathlon's search-navigation hybrid drove significantly higher conversions. Athletica should integrate search with the category menu so that clicking "Boots" → "Nike" populates the search and shows results + subcategories.

### 7. Mobile: off-canvas drawer with accordion
Consistent across all three retailers. Athletica should use a hamburger + off-canvas drawer with accordion-style expandable categories on mobile. No mega menu on mobile (per industry best practices).

### 8. Consistent column template
JD Sports' approach of using the same column structure (Edits → Footwear → Clothing → Accessories → Brands → Collections) across ALL top-level categories creates predictability. Athletica should define a template (e.g., Edits → Boots by Brand → Boots by Surface → Accessories → Brands) and apply it consistently.

---

## Sources Cited

1. hmmh.de/en/projects/decathlon-search-navigation — Decathlon search-navigation hybrid case study
2. aureatelabs.com/blog/cro-inspiration-for-sports-or-fitness-stores/ — Decathlon CRO analysis (2024)
3. footlocker.com — Direct HTML structure observation
4. jdsports.co.uk — Direct HTML navigation structure observation (nav-panel, nav-links, nav-promotions)
5. richardilott.com/jd-sports-main-navigation — JD Sports navigation redesign case study
6. commercev3.com/resources/blog/navigation-optimization-ecommerce-site-architecture-guide — Mega menu best practices
7. fatcowwebdesign.com/how-to-design-a-mega-menu-for-large-websites-ux-patterns-and-css-examples/ — Mega menu UX patterns 2026
8. ecomdesignpro.com/ecommerce-navigation-patterns/ — Ecommerce navigation patterns
9. nngroup.com/articles/mobile-accordions/ — Mobile accordion UX best practices
10. storebrief.com/ledger/e-commerce-seo/how-to-build-a-category-architecture-for-50k-skus — Category architecture for large catalogs
11. boundev.ai/blog/multilevel-menu-design-ux-guide — Multi-level menu UX patterns
12. Decathlon Vitamin Web GitHub — Accordion component for mobile nav
