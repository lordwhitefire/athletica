# Mega Menu UX Gap Analysis — Stream 2A: Key Examples from Real Sites

> **Author:** Probe-Wren (Intelligence Team)
> **Task:** ticket-athletica-megamenu-stream2
> **Date:** 2026-07-19
> **Purpose:** Extract specific pattern details from real sites (competitor analysis) relevant to Athletica's 5-level hierarchy.
> **Sources synthesized:** Mega Menu UX Research Parts 1–6 (41 sources)

---

## PART A: Key Examples from Real Sites

For each site, specific pattern details extracted that are relevant to Athletica's 5-level hierarchy (Category → Brand → Model → Sub-model → Product Type).

---

### 1. JD Sports (Part 2 §1.5)

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`; jdsports.co.uk HTML; Richard Ilott's redesign case study (richardilott.com/jd-sports-main-navigation)

#### Consistent 6-Column Template
- **Key pattern:** Every top-level category (Men, Women, Kids) uses the exact same column structure: Edits → Footwear → Clothing → Accessories → Brands → Collections. (Source: Part 2 §1.5 — "Consistent column structure across categories")
- **Why it matters for Athletica:** Athletica has 11 categories. A consistent template means every category's mega menu looks predictable. Users learn the pattern once and apply it everywhere.
- **HTML implementation:** `nav-panel` divs with `nav-links` containing multiple `ul` elements. The structure is documented so new categories can be added without breaking IA (per Richard Ilott's redesign).

#### "Edits First" Philosophy
- **Column 1 is always "Edits"** — curated, intent-based shopping (New In, Summer Edit, Holiday Shop) rather than pure taxonomy. (Source: Part 2 §1.5 — "Curated, intent-based shopping prioritized over pure taxonomy")
- **Athletica application:** Replace "Edits" with "New In", "Best Sellers", "By Surface" (FG/AG/TF/SG) as the first column. This matches the proposed wireframe in Part 5 (§4.1) where Column 1 is "Category + Edits".
- **Rich Ilott's insight:** Menus often reflect "internal org structure, not customer mental models." Edits-first aligns with customer shopping intent (browsing, discovery) vs. internal taxonomy (brand, model, SKU).

#### Brands Column
- **Column 5 is Brands** (Nike, Adidas, New Balance, etc.). Directly applicable because Athletica's Level 2 = Brand. (Source: Part 2 §1.5 — "Column 5: Brands")
- **Athletica adaptation:** Move Brands to Column 2 (instead of Column 5) since Brand is Level 2 in Athletica's hierarchy, not a secondary dimension.

#### Promo Column
- **Right-side `nav-promotions` div** with large product/category image and CTA link, served via Amplience CDN. (Source: Part 2 §1.5 — "Yes — JD Sports uses promotional images in a dedicated nav-promotions section")
- **Athletica application:** Column 4 as featured/promotional column per Part 5 wireframe (§4.1).

#### Hover Behavior
- Hover to open with `wChild` class detection. "Close Menu" button available. (Source: Part 2 §1.5)

#### Mobile
- Off-canvas drawer → accordion-style expansion. Shared taxonomy with platform-appropriate interactions. (Source: Part 2 §1.5)

---

### 2. Nike (Part 1 §1.1)

**Source:** Probe-Orion research, `megamenu-nike-adidas.md`; styles.refero.design; thehangline.com; econsultancy.com

#### Audience-First Navigation
- **Primary split:** Men/Women/Kids (audience-first) rather than by product type. (Source: Part 1 §1.1 — "Audience-first navigation — Primary split by audience (Men/Women/Kids) rather than by product type")
- **Athletica relevance:** `[NOT FOUND — ask CEO]` per Part 6 §4.5. If Athletica serves multiple genders/segments, audience-first could apply. If primarily football-focused, category-first (like JD Sports) may be better.

#### 3-5 Columns, 2 Levels Visible
- 3-5 text columns per panel. Only 2 levels visible in the mega menu (heading + subcategory links). (Source: Part 1 §1.1 — "Visible within mega menu panel: 2 levels only")
- **Athletica difference:** Part 5 (§4.2) recommends 3 levels visible (Category → Brand → Model) in the mega menu, deferring Levels 4-5 to PLP. Nike is more conservative (2 levels only).

#### "New & Featured" as First Column
- Column 1 is always "New & Featured" (New Releases, Best Sellers, Latest Drops). (Source: Part 1 §1.1 — "Column 1: 'New & Featured' (curated links)")
- **Parallels JD Sports' "Edits" column.** Both prioritize discovery over taxonomy in the first column.

#### Text-Only Minimalist Design
- **NO product thumbnails, category images, or icons** inside the menu columns. (Source: Part 1 §1.1 — multiple sources: unlimited-elements.com, wpmet.com)
- **Athletica difference:** Part 5 (§4.1) recommends brand logos (48px) in Column 2 and product thumbnails (60px) in Column 3. Athletica would be MORE visual than Nike.

#### Nested Left-Hand Sidebar on PLPs
- Category pages have a nested left-hand sidebar showing the current category hierarchy. (Source: Part 1 §1.1 — "On category pages: Nike adds a nested left-hand sidebar menu above the filters")
- **Directly applicable** to Athletica's PLP for Levels 4-5 (sub-model, product type).

#### Mobile
- Full-screen overlay + accordion expansion. Staggered fade-in animation (~50ms apart per item). (Source: Part 1 §1.1 — muffingroup.com; uxdesign.cc)

---

### 3. Adidas (Part 1 §1.2)

**Source:** Probe-Orion research, `megamenu-nike-adidas.md`; wpmet.com; econsultancy.com; plerdy.com

#### Dual-Dimension Navigation
- **Browse by Product Type (Shoes, Clothing, Accessories) AND by Sport (Running, Football, Training, Basketball)**. (Source: Part 1 §1.2 — "Dual dimension navigation — Browse by 'Product Type' OR by 'Sport'")
- **Athletica application:** Browse by Category (Boots, Clothing) AND by Surface (FG, AG, TF, SG) or by Brand. The "By Surface" column in Part 5 (§4.1) directly adapts Adidas' dual-dimension pattern.

#### Bold "All" Links
- Bold "All" links at the bottom of each submenu. (Source: Part 1 §1.2 — "Bold 'All' category links in bold — Bold 'All' links at the bottom of each submenu")
- **Athletica application:** "View All Boots", "View All Brands" at bottom of mega menu (Part 5 §4.1 bottom row).

#### Image-Heavy Mega Menu
- Promotional banners, product shots, category thumbnails within the menu. (Source: Part 1 §1.2 — wpmet.com; rsacreativestudio.com)
- **Contrast with Nike's text-only approach.** Athletica sits between: brand logos (48px) + product thumbs (60px) but no large promo banners inside the menu (per Part 3 §2.4 recommendation).

#### Bottom Row in Mega Menu
- Full-width bottom section with additional links/CTAs. (Source: Part 1 §1.2 — wpmet.com — "includes the bottom row for further information")
- **Directly applicable** to Athletica's "View All" bottom row in Part 5 wireframe.

#### "Many Routes In" Approach
- More paths to find products: by sport, by product type, by brand, by color, by collection. (Source: Part 1 §1.2 — econsultancy.com)
- **Athletica relevance:** Multiple entry points (Category, Brand, Surface, Edits) gives users flexibility.

---

### 4. Foot Locker (Part 2 §1.4)

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`; footlocker.com HTML; Richard Ilott's case study references

#### Brands as Standalone Column
- **Each mega menu panel includes a dedicated "Brands" column** listing top brands (Nike, Adidas, etc.). (Source: Part 2 §1.4 — "Brand-as-column — Each mega menu panel includes a dedicated 'Brands' column listing top brands")
- **Most directly applicable pattern** for Athletica because Athletica's Level 2 = Brand. This validates Column 2 as Brands in Part 5's wireframe.

#### 4-6 Columns per Panel
- Columns: "Featured," "Shoes," "Clothing," "Accessories," "Brands" as headers. (Source: Part 2 §1.4 — "Column groups have bold headers")

#### Top 1% Baymard Performer
- **Foot Locker is a Top 1% Baymard performer** (per Probe-Sable's Part B research). (Source: Part 2 §1.4)
- **Why this matters:** Foot Locker's brand-as-column pattern is validated by rigorous UX testing. This is the strongest evidence for including a Brands column in Athletica's mega menu.

#### Deep Category Handling
- Relatively shallow hierarchy (2-3 levels max). Level 3 handled via faceted navigation on PLP. (Source: Part 2 §1.4)
- **Athletica must go deeper** — column 3 (Models with 60px thumbs) extends to Level 3, which Foot Locker doesn't do.

#### Mobile
- Hamburger → drill-down (push navigation) for all levels. Top 1% Baymard performer on mobile too. (Source: Part 2 §1.4; Part 4 §3.6 competitor table)

---

### 5. Decathlon (Part 1 §1.3)

**Source:** Probe-Wren research, `megamenu-sports-retailers.md`; hmmh.de case study; aureatelabs.com CRO analysis

#### Search-Navigation Hybrid
- **No traditional mega menu.** Clicking a category triggers a search-like overlay showing: subcategories, popular products, and auto-populated search field. (Source: Part 1 §1.3 — hmmh.de: "Clicking on one of them makes it the first part of a search query")
- **"Significantly more conversions"** in A/B tests (per hmmh.de).
- **Athletica relevance:** Not a direct replacement for the mega menu, but the search integration insight applies. Part 5 (§4.3) recommends search bar at top of mobile nav overlay.

#### "Activities" Sidebar on PLP
- Persistent left sidebar on category pages showing related categories. (Source: Part 1 §1.3 — "sidebar navigation called 'Activities' provides additional browsing options")
- **Directly applicable** to Athletica's PLP — use a "Brands" or "Models" sidebar similar to Decathlon's "Activities" sidebar.

#### Handles Deep Hierarchy with Icons/Thumbnails
- Subcategory landing pages show product thumbnails and category hero images. (Source: Part 1 §1.3 — aureatelabs.com)
- **Despite thousands of products,** Decathlon deliberately avoids a classic mega menu. This is a contrarian data point — not every deep-catalog retailer needs a mega menu.

#### Mobile
- Hamburger menu with accordion-style expandable categories. Vitamin design system includes accordion components. (Source: Part 1 §1.3)

---

### 6. ASOS (Part 2 §1.6)

**Source:** Probe-Beacon research, `megamenu-fashion-platforms.md`; digitalsilk.com; mockplus.com

#### Bottom Nav on Mobile + Hamburger for Categories
- **Unique approach:** Bottom tab bar persists on mobile for key sections. Hamburger menu used for full category tree. (Source: Part 2 §1.6 — Part 4 §3.6: "Bottom nav + Hamburger for categories")
- **Athletica relevance:** If Athletica wants persistent access to key sections (Brands, Sale, Search), a bottom tab could supplement the hamburger. Part 4 (§3.3) lists this as an alternative: "Could supplement."

#### Gender as Primary Entry Point
- Women/Men selection at the very top of navigation. (Source: Part 2 §1.6 — "Gender selection ('Women/Men') is the primary entry-point split")

#### "Shop By" Approach
- Categories divided by shopping intent groups, not just taxonomy. (Source: Part 2 §1.6 — "Subcategories grouped by shopping intent")
- **Athletica relevance:** Similar to JD Sports' "Edits" column. Curated groupings (New In, Best Sellers, By Surface) help users who don't know exactly what they want.

#### Whitespace-Dominant
- Relies heavily on negative space and clear typography. (Source: Part 2 §1.6)
- No brand logos in mega menu (separate "Brands" section).

---

### 7. Zalando (Part 2 §1.7)

**Source:** Probe-Beacon research, `megamenu-fashion-platforms.md`; happycoding.agency

#### Early Segmentation via Cookie
- Women/Men/Kids choice stored in `ncx` cookie so returning visitors skip re-selection. (Source: Part 2 §1.7 — "Early segmentation as strategic lever: Women/Men/Kids choice stored in a cookie (ncx)")
- **Applies Hick's Law** — reduces choice for returning visitors.
- **Athletica relevance:** If audience-first navigation is chosen, implement cookie-based preference.

#### Icon-Based Categories (Pictograms)
- Icons/pictograms used instead of product images — follows Law of Prägnanz: clear, reduced forms faster to grasp. (Source: Part 2 §1.7)
- **Athletica relevance:** Lower-maintenance alternative to product thumbnails if Column 3 images are not feasible.

#### "Inspiration over Hierarchy"
- Content-driven entry points alongside product categories (Festival Looks, Sustainable Styles). (Source: Part 2 §1.7)
- **Athletica relevance:** "By Surface" column serves a similar purpose — attribute-based browsing alongside category hierarchy.

#### Personalization
- Recommendations adapt based on behavior, location, and device. (Source: Part 2 §1.7)
- **Athletica relevance:** Future enhancement. Not needed for V1.

---

## Cross-Site Comparison Summary (Part 2 §1.8)

| Feature | Nike | Adidas | Decathlon | Foot Locker | JD Sports | ASOS | Zalando |
|---|---|---|---|---|---|---|---|
| **Levels in menu** | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| **Columns** | 3-5 | Multi + bottom row | N/A (search) | 4-6 | 5-6 + promo | 3-4 + promo | Multi + icons |
| **Images in menu** | No | Yes | Search results | Minimal | Yes | 1 promo | Icons only |
| **Trigger** | Hover + click | Hover + click | Click | Hover | Hover + close | Hover | Hover w/ delay |
| **Brands column** | No | No | No | Yes | Yes | No | Integrated |
| **Mobile** | Overlay + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + accordion | Hamburger + drill-down | Mobile-first |
| **Deep nav** | Sidebar + filters | Filters only | "Activities" sidebar | PLP facets | PLP facets | Sub-nav + breadcrumbs | Breadcrumbs + chips |

Source: Part 2 §1.8, Full 7-Site Comparison table.
