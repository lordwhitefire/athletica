# Mega Menu UX Research: Nike.com & Adidas.com

**Task:** task-mega-menu-ux-001
**Researcher:** Probe-Orion (Intelligence Team)
**Date:** 2026-07-19
**Purpose:** Inform Athletica's mega menu design for a 5-level category hierarchy (Category → Brand → Model → Sub-model → Product Type)

---

## NIKE.COM

### Source Material
- wpmet.com/best-mega-menu-examples/ — "Nike: The Sporty & Streamlined Navigation Masterclass" (2026)
- thehangline.com/how-to-design-a-mega-menu/ — "How to Design a Mega Menu for Large Websites" (2026)
- styles.refero.design — "Nike.com design system" (2026)
- katsaville.com/work/nikenavigation — "Nike Navigation" (staff designer documentation)
- econsultancy.com/nike-vs-adidas-vs-under-armour-site-navigation-comparison/ (2016, foundational patterns still used)
- themehunk.com/mega-menu-designs/ — "9 Best Mega Menu Design Examples" (2026)
- unlimited-elements.com/10-best-mega-menu-examples/ — "Top 10+ Trending Mega Menu Examples" (2026)
- exclusiveaddons.com/examples-of-mega-menus/ — "Nike mega menu analysis" (2026)
- muffingroup.com/blog/hamburger-menu-design-examples/ — "Hamburger Menu Design Examples" (2026)

### Levels Visible
- **Top-level nav items:** ~6 primary links in the header bar: "New & Featured", "Men", "Women", "Kids", "Jordan", "Sale" (per styles.refero.design — notes "Novedad, Hombre, Mujer, Niño/a, Deporte, NikeSKiMS" for Spanish locale — structure is identical across locales)
- **Visible within mega menu panel:** 2 levels only. The panel shows **category headings** (bold, not clickable) with **subcategory links** below them.
- **Not shown:** Levels 3+ (e.g., specific shoe models, sub-models, product types) are NOT exposed inside the mega menu. Users must click through to a category page to see deeper levels.
- **On category pages:** Nike adds a **nested left-hand sidebar menu** above the filters that shows the current category hierarchy (per econsultancy.com comparison). This helps users maintain awareness of where they are in the product catalog and jump to sibling categories without returning to the header.

### Column Layout
- **3–5 columns** per panel (per thehangline.com — "3 to 4 columns max for most retail"; styles.refero.design — footer uses 4 columns, nav uses columns matching category structure)
- **Column distribution:** Each audience section (Men, Women, Kids) uses an identical column structure:
  - Column 1: "New & Featured" (curated links like "New Releases", "Best Sellers", "Latest Drops")
  - Column 2: "Shoes" (subcategories like "Lifestyle", "Running", "Basketball", "Football", "Training & Gym")
  - Column 3: "Clothing" (subcategories like "Tops & T-Shirts", "Shorts", "Hoodies & Sweatshirts", "Jackets & Vests")
  - Column 4 (optional): "Accessories & Equipment" and/or a **promotional image block** on the far right side
- **White background**, full-width panel, no border/shadow on the nav bar itself (per styles.refero.design)
- **Typography:** Column headings in bold, 14-16px (estimated). Link text in regular weight, slightly smaller (per thehangline.com — "Bold category headings create a clear visual hierarchy")

### Images
- **NO product thumbnails, category images, or icons** inside the menu columns themselves (per unlimited-elements.com — "No images. It focuses on simplicity"; wpmet.com — "No distracting icons or unnecessary images, just clean text")
- **Promotional image on the right side** — optional one-column-wide promotional banner or featured product image (per thehangline.com — "includes a featured image or promotional block on the right side of the panel")
- **On category pages:** Nike uses a "pictoral menu" — a horizontal row of category tiles WITH images at the top of the product listing page (per econsultancy.com — "a cool example of a pictoral menu that sits above category listings")
- **On mobile:** Thumbnail images are NOT used in the hamburger navigation

### Hover vs Click
- **Desktop:** Hover-triggered with a short intent delay (~200-300ms) per thehangline.com and fatcowwebdesign.com
- **Click also supported** — clicking a top-level nav item also opens the panel (accessibility requirement)
- **Close behavior:** Panel closes on mouse-leave. Recommended 150ms close delay prevents accidental closure during diagonal mouse movement (per designstudiouiux.com)
- **Keyboard:** Tab key navigates through top-level items and through panel links. Enter/Space opens/closes. Escape closes panel (per fatcowwebdesign.com mega menu CSS guide)

### Deep Category Handling
- **Nike's approach:** The mega menu intentionally avoids showing deep hierarchies. Only 2 levels max in the panel.
- **For deeper navigation (3+ levels):**
  1. User must click a subcategory link (e.g., "Football" under "Shoes") which loads a category page
  2. The category page has a **nested left-hand sidebar** showing the current category and all sibling subcategories (per econsultancy.com)
  3. The category page also features a **pictoral menu** with images for visual browsing of sub-collections
  4. Further filters (nested left, sticky) handle remaining refinement
- **Philosophy:** Nike uses the mega menu as a broad funnel, then relies on category page navigation and filters for deep drilling. The menu is kept intentionally shallow to avoid choice paralysis (per katsaville.com — "Editing — Help users to navigate without choice paralysis or overwhelm by thoughtfully limiting the navigation options")

### Distinctive Patterns
1. **Audience-first navigation** — Primary split is by audience (Men / Women / Kids) rather than by product type. This immediately segments the massive catalog and reduces cognitive load (per exclusiveaddons.com and wpmet.com)
2. **Text-only minimalist design** — No imagery inside the menu panel. Relies entirely on typographic hierarchy (bold headings, regular-weight links) and white space. Creates a premium, uncluttered feel (per unlimited-elements.com)
3. **Consistent structure across sections** — Every audience section (Men, Women, Kids) uses the exact same column layout and heading structure. Users learn the pattern once and apply it everywhere (per katsaville.com — "Consistency — Help users understand the site's hierarchy and architecture by repeatedly using the same language and ordering across all navigation touch-points")
4. **"New & Featured" as first column** — Every section's mega menu leads with a curated "New & Featured" column, blending marketing content with navigation (per exclusiveaddons.com and katsaville.com)
5. **No sticky header** — The nav bar is NOT sticky. It sits on a white background with no fill, no shadow, no border (per styles.refero.design). This is unusual for e-commerce and prioritizes editorial content over persistent navigation.
6. **Two-tier nav bar** — Thin utility bar (search, help, login) in 12px above the main nav row with category links in 16px Medium weight (per styles.refero.design)
7. **Search field treatment** — Background #f5f5f5 with 24px border radius, 6px vertical / 8px horizontal padding, placeholder in #707072 (per styles.refero.design)

### Mobile Approach
- **Hamburger icon** opens a **full-screen overlay** (per muffingroup.com — "Its hamburger opens a full-screen overlay that splits items into sections under visible headings")
- **Accordion-style expansion** — Tapping a top-level item (e.g., "Men") expands inline to show subcategories. Tapping a subcategory loads the category page (per muffingroup.com and nngroup.com/mobile-subnavigation/)
- **Staggered fade-in animation** — Items fade in roughly 50ms apart per item (per muffingroup.com)
- **4 main parent categories** in the accordion: Men, Women, Kids, Nike by You (per uxdesign.cc case study)
- **No images in mobile nav** — Text-only accordion, same labels as desktop (per muffingroup.com)
- **Desktop structure translates** to simplified accordion format for mobile (per wpmet.com — "The desktop structure translates perfectly into a simplified accordion style for mobile users")

---

## ADIDAS.COM

### Source Material
- wpmet.com/best-mega-menu-examples/ — "Adidas: The Bold & Visual Sportswear Hub" (2026)
- rsacreativestudio.com/blog/15-must-see-mega-menu-examples/ — "Adidas: Bold and Brand-Focused" (2026)
- econsultancy.com/nike-vs-adidas-vs-under-armour-site-navigation-comparison/ (2016, foundational patterns still used)
- plerdy.com/blog/adidas-homepage-web-design-review/ — "Adidas Homepage Web Design Review" (2025)
- themehunk.com/mega-menu-designs/ — "9 Best Mega Menu Design Examples" (2026)
- adidas.com/us/men — Direct site examination (2026)
- creativecorner.studio/blog/mega-menu-examples/ — "13 Must-See Mega Menu Examples" (2025)

### Levels Visible
- **Top-level nav items:** 5 primary links: "MEN", "WOMEN", "KIDS", "Sale", "New & Trending" (per plerdy.com — and confirmed via adidas.com URL structure)
- **Visible within mega menu panel:** 2 levels typically. Category headings + subcategory links.
- **Not shown:** Levels 3+ are NOT exposed in the mega menu. Users click through to category/subcategory pages for deeper refinement.
- **Refinement on category pages:** Adidas relies on robust filter systems (by price, discount, sport, product type) to handle deep drilling rather than exposing it in the navigation (per econsultancy.com comparison)

### Column Layout
- **Multi-column layout** with gender-based categories (per wpmet.com)
- **Refined by two orthogonal dimensions:** "Product Type" (Shoes, Clothing, Accessories) AND "Sports" (Running, Football, Training, Basketball, etc.) — per wpmet.com
- **Distinctive BOTTOM ROW** in the mega menu — a full-width bottom section that provides additional links, "View All" options, or information (per wpmet.com — "includes the bottom row for further information")
- **Column distribution (estimated):**
  - Columns for product types (Shoes, Clothing, Accessories)
  - Columns for sports categories
  - Bottom row: "View All" links, featured content
  - Right-side or interspersed: promotional images/banners
- **High-contrast design elements** with bold typography (per wpmet.com)

### Images
- **YES — Adidas uses images extensively in the mega menu** (per wpmet.com — "Visual Storytelling: Uses promotional images to highlight offers and collaborations")
- **Promotional banners** for seasonal campaigns, collaborations (e.g., Valentines, Prime), and new collections (per wpmet.com)
- **Category thumbnail images** — The "brands menu" within the Adidas header contains thumbnail images for each brand (per econsultancy.com — "The brands menu also contains thumbnail images")
- **Large product shots** within the menu for featured/new items (per rsacreativestudio.com — "displays large product shots alongside categorized links")
- **Fast-loading visual assets** — optimized for performance within the navigation (per wpmet.com)

### Hover vs Click
- **Desktop:** Hover-triggered. The panel appears when hovering over a top-level category.
- **Behavior similar to Nike** — hover intent with delay (~200-300ms) per industry standard
- **Click also supported** for keyboard and touch accessibility
- **Close:** Panel dismisses on mouse-leave with a forgiveness delay

### Deep Category Handling
- **Adidas approach:** Like Nike, the mega menu shows max 2 levels.
- **For deeper navigation:**
  1. User clicks a subcategory (e.g., "Shoes" under "Men") → goes to category page
  2. Category pages use robust filter panels (by sport, price, discount, size, color) for deeper refinement
  3. Category pages feature a "category grid" with product thumbnails and "Shop Now" CTAs (per mobbin.com screen capture)
- **Key difference from Nike:** Adidas does NOT have the nested left-hand sidebar menu on category pages that Nike uses (per econsultancy.com — "once you have used Nike's website, the lack of that nested menu on the left-hand side of category pages... is the most annoying")
- **"Many routes in" approach** — Adidas provides more paths to find products: by sport, by product type, by brand, by color, by collection (per econsultancy.com — "Adidas's menu has a slightly different approach to information architecture ('many routes in') but is just as well realised")

### Distinctive Patterns
1. **Image-heavy mega menu** — Unlike Nike's text-only approach, Adidas uses promotional images, product shots, and category thumbnails within the menu. This makes the menu itself a marketing surface (per wpmet.com, rsacreativestudio.com)
2. **Bottom row in mega menu** — A unique full-width bottom section with additional links/CTAs. This is unusual and distinctive (per wpmet.com — "includes the bottom row for further information")
3. **"Shop By Color" submenu** — A unique feature allowing users to filter/browse by color directly from the navigation (per wpmet.com)
4. **Sport-specific sub-categories** — Adidas organizes by sport (Running, Football, Training, Basketball, etc.) as a first-class dimension alongside product type (per wpmet.com)
5. **Bold, large typography** — Large sans-serif fonts that are highly readable and on-brand (per wpmet.com)
6. **Dynamic "New & Trending" sections** — Real-time or frequently updated sections to drive engagement (per wpmet.com)
7. **"All" category links in bold** — At the bottom of each submenu, bold "All" links to view the full category (per econsultancy.com — "I like the way Adidas uses bold font to flag up the 'All' category links that sit at the bottom of each submenu")
8. **Dual dimension navigation** — Users can browse by "Product Type" OR by "Sport", providing two orthogonal entry points into the catalog (per wpmet.com)

### Mobile Approach
- **Hamburger menu** with the main top-level categories (MEN, WOMEN, KIDS, Sale, New & Trending)
- **Large category links** are also added just below the fold on the mobile homepage as a quick-entry shortcut (per econsultancy.com — "Adidas's mobile homepage sees the addition of some large category links just below the fold... This seems a smart move, given some may instinctively scroll, rather than heading for the burger menu")
- **Off-canvas or accordion pattern** for subcategory expansion (per creativecorner.studio)
- **Filter buttons** on mobile are noted as smaller than Nike's, making them more fiddly to use (per econsultancy.com — "Filter and sort buttons, as well as the product layout button, are all quite a bit smaller than Nike's buttons")
- **Filter menu behavior** — Once you open the filter menu, you cannot simply exit it; you have to reload the product selection (per econsultancy.com — notable UX friction point)

---

## COMPARATIVE SUMMARY

| Aspect | Nike.com | Adidas.com |
|---|---|---|
| **Top-level items** | ~6 (New & Featured, Men, Women, Kids, Jordan, Sale) | ~5 (MEN, WOMEN, KIDS, Sale, New & Trending) |
| **Levels in menu** | 2 (category heading + subcategory links) | 2 (subcategory links + optional bottom row) |
| **Columns** | 3-5 text columns + optional promo image | Multi-column + images + bottom row |
| **Images in menu** | No (text-only) | Yes (promotional banners, thumbnails) |
| **Hover/Click** | Hover with intent delay + click/keyboard | Hover with intent delay + click/keyboard |
| **Deep hierarchy** | Category page nested sidebar + filters | Category page filters (no nested sidebar) |
| **Mobile pattern** | Full-screen overlay + accordion | Hamburger + off-canvas/accordion |
| **Unique feature** | Nested left-hand sidebar on PLP | "Shop By Color" + bottom row in menu |

## KEY INSIGHTS FOR ATHLETICA

1. **Neither Nike nor Adidas expose 3+ levels in the mega menu.** Both cap at 2 visible levels. For Athletica's 5-level hierarchy (Category → Brand → Model → Sub-model → Product Type), the mega menu should handle Levels 1-2, and deeper drilling (Levels 3-5) should be handled on category pages via filters, breadcrumbs, or sidebar navigation.

2. **Nike's text-only approach** is cleaner and lower-maintenance but requires strong typographic hierarchy. Adidas's image-heavy approach is more engaging but requires frequent asset updates.

3. **Nike's audience-first split** (Men/Women/Kids) is highly effective for segmenting a large catalog. Athletica could adapt this as a top-level split by Category (Boots, Clothing, Equipment) or by Gender.

4. **Nike's nested left-hand sidebar on PLPs** is a best practice for deep hierarchies — it keeps users oriented and allows quick jumps between sibling categories. Adidas lacks this, which econsultancy notes as a negative.

5. **Adidas's "dual dimension"** navigation (by Product Type AND by Sport) is relevant for Athletica — users may want to browse by Brand (Nike, Adidas, Puma) AND by Category (Boots, Clothing) as orthogonal dimensions.

6. **Mobile accordion with staggered animation** (Nike's approach) is a proven pattern. For 5 levels of depth, a multi-screen (push) pattern may work better than deeply nested accordions (per smashingmagazine.com and nngroup.com).

7. **Bottom row pattern** (Adidas) could be adapted for Athletica to feature a "Shop All Boots" or "View All Brands" CTA within the menu.

8. **Consistency is critical** — Nike's identical structure across all audience sections is a key UX strength (per katsaville.com). Athletica should use a consistent column layout across all top-level categories.
