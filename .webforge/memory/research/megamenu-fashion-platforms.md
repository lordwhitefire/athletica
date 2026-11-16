# Mega Menu UX Research: ASOS.com and Zalando.com

> **Research for:** Athletica — football boots/sports e-commerce site (Next.js + Tailwind CSS + Sanity CMS)
> **Context:** Athletica has a 5-level category hierarchy (Category → Brand → Model → Sub-model → Product Type)
> **Date:** 2026-07-19
> **Sources:** Digital Silk, DesignRush, happycoding agency, Mockplus blog, NN/G, direct site observations

---

## ASOS.com

### Levels visible
- **2 levels visible on hover:** The mega menu shows the top-level category name plus one level of subcategories directly beneath it.
- The top-level nav bar contains items like: Women, Men, New In, Brands, Sale (red highlighted)
- Gender selection ("Women/Men") is the primary entry-point split, determined before browsing
- Sub-levels beyond the first tier of subcategories require a click through to the category landing page
- Source: Digital Silk mega menu analysis (digitalsilk.com/web-design/web-trends/best-mega-menu-examples/)

### Column layout
- **Multi-column layout** with 3-4 columns of links beneath category headings
- Columns are divided by category groups (e.g., "Clothing", "Shoes", "Accessories" as column headers)
- A **prominent image panel occupies the right side** of the mega menu, drawing attention to a featured collection or campaign
- Columns have clear heading hierarchy: bold category names with indented subcategory links below
- Source: Digital Silk analysis; Mockplus blog (mockplus.com/blog/post/mega-menu-examples)

### Images
- **Limited use of images** in the main link columns — ASOS relies primarily on typography and whitespace
- **One featured image on the right** of each mega menu panel promoting a curated collection or campaign
- **Brand logos are NOT displayed** inside the mega menu; brands are in a separate "Brands" top-level section
- No product thumbnails in the navigation tree itself
- Source: Digital Silk analysis; direct site observation

### Hover/Click
- **Hover-activated** on desktop — hovering over a top-level nav item triggers the mega menu panel
- Clicking the top-level label (e.g., "Women") navigates to that category landing page
- Subcategory links within the mega menu are clickable and navigate directly to those pages
- No hover delay information available [NOT FOUND — further research needed]
- Source: Digital Silk analysis; NN/G hover menu best practices

### Deep category handling
- ASOS does NOT display more than 2 levels deep in the mega menu
- Beyond the first tier of subcategories, users must click through to the category landing page
- The category landing page uses further sub-navigation (sidebar or horizontal sub-nav) to drill deeper
- Breadcrumbs are used on category/product pages for orientation deeper in the hierarchy
- This approach keeps the mega menu clean and prevents information overload
- Source: DesignRush ASOS app analysis (designrush.com/best-designs/apps/asos-app-design); site structure observation

### Distinctive patterns
- **Red text for Sale links:** The only color break in the otherwise monochrome menu — draws visual priority to sale/discount items (per Digital Silk: "red text that makes links to sales more visible")
- **Whitespace-dominant design:** Relies heavily on negative space, clear typography, and well-structured headings rather than visual clutter
- **Gender segmentation as primary entry point:** Women/Men selection happens at the very top of the navigation before any category browsing
- **"New In" as a persistent top-level item:** Always accessible, not buried inside categories
- **A–Z Brands directory:** Separate brand browsing via an alphabetical listing, not mixed into category navigation
- Source: Digital Silk (digitalsilk.com); Mockplus; site observation

### Mobile approach
- **Hamburger menu icon** (top-left) reveals a sliding panel with account options and navigation
- **Gender selection persists at top** of the mobile nav (Women/Men)
- Top-level mobile nav items: Home, Categories, New In
- Categories open a **new screen** with subcategories (e.g., Clothing → Dresses, Jeans, Tops, etc.)
- Subcategories on mobile use a **drill-down navigation pattern** (tap to go deeper, back button to return)
- **Filters slide in from the right** on product listing pages (size, color, brand, fit, style, price)
- Search bar is always visible and prominent at the top
- Source: DesignRush ASOS app analysis; site observation

### Brand handling within categories
- Brands are NOT listed within the category mega menu
- A **separate "Brands" top-level nav item** links to a dedicated brand directory page
- Brand directories are split by Women/Men and use an A–Z alphabetical listing
- Once on a brand page (e.g., Nike), users can filter by category (e.g., Nike → Shoes → Trainers)
- Source: Site structure observation from ASOS.com

---

## Zalando.com

### Levels visible
- **2 levels visible in the mega menu** — top-level category and immediate subcategories are displayed
- The first segmentation is **Women / Men / Kids** — this is the dominant entry point
- After selecting a gender/age segment, the nav shows categories like: New Arrivals, Clothing, Shoes, Accessports, Brands, Sale
- Sub-levels beyond the initial mega menu panel require navigation to the category page
- Zalando's IA follows the principle of **shallow depth** — important pages reachable in 2-3 clicks (per happycoding analysis)
- Source: happycoding (happycoding.agency/en/blog/zalando-ux-best-practices-for-ecommerce-navigation-and-personalization)

### Column layout
- **Multi-column layout** with categories divided into columnar groups
- Columns use **icon-based pictograms** instead of product photos for category identification
- The layout uses clear column headers with sub-items listed beneath
- **Content-inspired sections** appear alongside product categories (e.g., "Festival Looks", "Outdoor Essentials", "Sustainable Styles")
- The right side may contain promotional or inspirational content
- Source: happycoding analysis (sections: "Icons instead of images", "Inspiration over Hierarchy")

### Images
- **Icons/pictograms are used instead of product images** for category identification — follows the **Law of Prägnanz**: clear, reduced forms are faster to grasp
- **No product thumbnails** in the primary navigation columns
- **Inspirational imagery may appear** in promotional/content sections within the menu (e.g., "Looks of the Season")
- This icon-based approach reduces visual noise and cognitive load
- Source: happycoding analysis (section: "Cognitive Load and Gestalt Principles")

### Hover/Click
- **Hover-activated** on desktop with a **deliberate hover delay** (~200-300ms) to prevent accidental menu triggers ("false hovers")
- The hover delay is a documented UX pattern from usability research to reduce distraction
- Clicking a top-level label navigates to that category's landing page
- Source: happycoding analysis (section: "Hover delay on submenus")

### Deep category handling
- Zalando follows a **shallow depth architecture** — key pages are 2-3 clicks from the homepage
- Categories deeper than 2 levels are handled on the category landing page, not the mega menu
- **Visible breadcrumbs** on every category/product page provide orientation and backtracking
- **Filter chips** on category pages allow narrowing down within deep hierarchies
- The mega menu itself does not expose more than 2 levels of depth
- Source: happycoding analysis (sections: "Navigation as Performance Factor", "Visibility of Filters and Orientation Elements")

### Distinctive patterns
- **Early segmentation as strategic lever:** Women/Men/Kids choice is stored in a cookie (`ncx`) so returning visitors skip this step — applies Hick's Law (fewer choices = faster decisions)
- **"Inspiration over Hierarchy":** Shifts from rigid product taxonomy (Shoes → Sneaker → Nike) to content-driven entry points like "Festival Looks", "Sustainable Styles", "New Arrivals", "Looks of the Season" — navigation tells a brand story
- **Personalized navigation:** Entry point and recommendations adapt based on behavior, location, and device — goal is "relevance in seconds"
- **Icon-based categories** (pictograms) rather than text-only or photo-based — reduces cognitive load
- **Permanent scope indicator:** The active gender segment (Women/Men/Kids) remains highlighted throughout the browsing session — provides continuity and "recognition over recall"
- **Brand strategy through nav:** Categories communicate brand values (sustainability, exclusivity, community) not just product groupings
- Source: happycoding analysis (sections 1-6)

### Mobile approach
- **Mobile-first design** — Zalando treats mobile navigation as independently designed, not a shrunken desktop version
- **Clear tap targets** with adequate spacing
- **Sticky header** remains visible during scrolling
- **Prominent filter buttons** on product listing pages
- **Gender segmentation remains the first choice** on mobile (Women/Men/Kids)
- **Breadcrumbs and filter chips** are visible on mobile for orientation
- The principle: "Every category is a tap, not a puzzle" — if 3 taps are needed to find a core product, that's one tap too many
- Source: happycoding analysis (section: "Mobile First Means: Radically Simplify")

### Brand handling within categories
- Brands are integrated into the category structure (e.g., Clothing → Brands → Nike)
- Zalando also has a **dedicated brands directory** at the top level
- Brands have their own "brand hub" pages with curated assortments
- Brand pages include filtering by category, size, color, price
- Source: happycoding analysis; zalando.com brand directory structure

---

## Comparative Summary: Key Takeaways for Athletica

| Feature | ASOS | Zalando |
|---|---|---|
| **Primary split** | Women/Men (top bar) | Women/Men/Kids (stored in cookie) |
| **Visible levels in menu** | 2 (category + subcategory) | 2 (category + subcategory) |
| **Images in menu** | 1 featured promo image (right side) | Icons/pictograms only, no product photos |
| **Hover activation** | Hover (no delay info found) | Hover with ~200-300ms delay |
| **Deep categories (>2 levels)** | Handled on landing page with sub-nav | Handled on landing page with breadcrumbs + filters |
| **Menu width** | Partial width with right-side image | Full-width panel |
| **Mobile pattern** | Hamburger → drill-down screens | Independently designed, sticky header, tap-first |
| **Brand navigation** | Separate A–Z brand directory | Integrated in categories + dedicated brand hubs |
| **Inspirational content** | Limited (1 promo image) | Heavy: trend stories, seasonal looks, curated collections |
| **Personalization** | Limited (recently viewed, saved items) | Extensive: behavior/location/device-based recommendations |

### What This Means for Athletica (5-Level Hierarchy)

Both ASOS and Zalando cap their mega menu at **2 visible levels**. This is a critical finding for Athletica:

1. **Your 5-level hierarchy cannot all live in the mega menu.** The menu should show Level 1 (Category, e.g., "Boots") and Level 2 (Brand, e.g., "Nike"). Levels 3–5 (Model → Sub-model → Product Type) must be handled on the category/brand landing page.

2. **Athletica should adopt gender/segment filtering early.** Like both ASOS (Women/Men) and Zalando (Women/Men/Kids), if Athletica has audience segments (e.g., Men/Women/Kids), this should be the first filter applied before category browsing.

3. **Brand navigation is critical.** For a sports e-commerce site, brand (Nike, Adidas, Puma) is a primary browsing dimension. Zalando's approach of integrating brands within categories while also having a brand directory is the stronger pattern for Athletica.

4. **Hover delay matters.** Zalando's ~200-300ms hover delay is a proven UX pattern. Athletica should implement this to prevent accidental menu triggers.

5. **Deep navigation lives on landing pages.** Beyond the mega menu, Athletica needs breadcrumbs, filter chips, and sub-navigation on brand/model pages to handle Levels 3-5.

6. **Mobile requires independent design.** Neither ASOS nor Zalando simply collapses their desktop menu. Both redesign navigation for tap-first interaction on mobile.
