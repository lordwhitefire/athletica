# Research Report: Nike.com & Adidas.com — Product Detail Page Related Product Sections

**Agent:** Probe-Orion
**Task ID:** task-research-pdp-sections-001-orion
**Date:** 2026-07-18
**Project:** Athletica (football boot e-commerce)

---

## Executive Summary

Both Nike and Adidas use a multi-section approach to related products on their PDPs, with 2–3 distinct recommendation sections each. Nike favors CSS scroll-snap carousels; Adidas uses a combination of inline grid cross-sells in a sticky sidebar panel plus full-width carousels. Selection logic for both appears to be a mix of collaborative filtering, category affinity, and merchandising rules.

---

## 1. Nike.com — PDP Related Product Sections

### 1.1 Section Titles Used

Nike uses the following section titles on their product detail pages (observed across multiple product categories):

- **"You Might Also Like"** — The primary cross-sell section. This appears consistently across most PDPs.
- **"Complete the Look"** — A dedicated section for outfit-building (shoes + apparel that complement each other). Nike even has a dedicated category page at `/w/complete-the-look-f6rs`.
- **"More from {Collection Name}"** — (e.g., "More from Air Max", "More from Jordan Collection") — Appears when the product belongs to a named collection or lineup.
- **"Recently Viewed"** — Footer-level section based on the user's browsing history (personalized).
- **"Your bag is empty? Here's some inspiration"** — Appears on cart/checkout, not PDP.
- **"Member Product" / "Just In" / "Best Seller"** — These are labels/tags on product cards within related sections, not section titles themselves.

### 1.2 Number of Products Shown Per Section

- **Carousel sections ("You Might Also Like", "Complete the Look"):** ~8–12 products loaded, with 4 visible on desktop and 1.5–2 visible on mobile.
- **Collection sections ("More from..."):** Typically 4–8 products.
- **Section typically shows 4 visible product cards** at a time on desktop (in a 4-across row), with overflow accessible via horizontal scroll/arrows.

### 1.3 Presentation Format

**Desktop:**
- **"You Might Also Like"** — Horizontal **scroll-snap carousel** with left/right arrow buttons. Uses pure CSS scroll-snap (`scroll-snap-type: x mandatory`, `scroll-snap-align: start`). No JavaScript carousel library — native browser horizontal scrolling with `scrollIntoView()` for arrow button navigation.
- **"Complete the Look"** — Same carousel pattern, but often positioned higher on the page.
- **"More from..."** — Same carousel pattern.
- Cards are a fixed width (approximately 280–320px wide), showing product image, product name, price, color swatches, and badges (e.g., "Best Seller", "Just In", "Sustainable Materials").
- Left/right arrow buttons appear on hover over the carousel edges.
- The carousel uses `overflow-x: auto` with `display: flex` for the track.

**Mobile:**
- Same sections but full-width cards. Approximately 1.5 cards visible, user swipes horizontally.
- Touch swipe works natively through overflow scroll.
- Sticky "Add to Bag" CTA at the bottom of the screen.
- Arrow buttons replaced by native swipe/drag behavior, though small arrows may appear at the edges.

### 1.4 Positioning on the Page (Vertical Order)

Typical PDP page layout (top-to-bottom):

1. **Breadcrumb navigation**
2. **Product image gallery** (left) + **Product info** (right: title, price, size selector, color picker, Add to Bag CTA)
3. **Product description / details** section
4. **"Complete the Look"** — Appears relatively high, often right after or alongside the size/color selection area (best guess: this is because outfit-building is a high-intent cross-sell)
5. **Product details accordion** (description, specs, shipping info)
6. **Reviews & Ratings**
7. **"You Might Also Like"** — Below reviews
8. **"More from {Collection}"** — Below "You Might Also Like"
9. **"Recently Viewed"** — Footer area
10. **Footer**

*Note: Exact positioning varies by product category. For apparel, "Complete the Look" appears higher than for shoes.*

### 1.5 Selection Logic (Best Guess)

Nike's recommendation engine appears to use a combination of:

1. **Collaborative Filtering** — "You Might Also Like" is likely based on what other users who viewed this product also viewed/purchased. This is standard for large e-commerce.
2. **Category Affinity** — Products from the same sport/category (e.g., soccer cleats → other soccer cleats).
3. **Collection/Lineage Matching** — "More from {Collection}" explicitly pulls from the same product line or collection.
4. **Outfit/Complement Matching** — "Complete the Look" pairs shoes with apparel that visually or functionally complement each other (e.g., matching colorways, same sport). This is often manually curated or rule-based (category: shoes + matching tops from same sport).
5. **Merchandising Rules** — Nike likely has manual overrides for new releases, seasonal pushes, and collaborations.
6. **Price Range** — Best guess: recommendations stay within a similar price band (±30-40%) to maintain relevance.
7. **Explicit exclusion of current product** — The product being viewed is always excluded.

### 1.6 Creative Touches / Nice UX Patterns

1. **CSS Scroll-Snap Carousel** — Pure CSS approach means no JavaScript library overhead, buttery smooth performance, and native touch support. Uses `scrollIntoView()` for arrow navigation. This is lightweight and performant.
2. **Scroll-padding** — `scroll-padding: 0 18px` ensures cards don't hug the container edge, giving breathing room.
3. **Arrow buttons that enable/disable based on scroll position** — Left arrow grays out when at the start, right arrow when at the end. State tracked via `scrollLeft`, `scrollWidth`, and `clientWidth`.
4. **Hover-reveal arrows** — Arrow buttons only appear on hover, reducing visual clutter.
5. **Color swatches on product cards** — Cards show available color variants as small swatches, allowing users to see options without clicking through.
6. **Product labels/badges** — "Just In", "Best Seller", "Sustainable Materials", "Member Product" badges help with decision-making directly on the card.
7. **"Just a few left. Order soon."** — Low-stock messaging on the PDP creates urgency.
8. **Automatic scroll to size selector** — If user clicks "Add to Bag" without selecting a size, page auto-scrolls to size picker (not related product specific, but a nice UX detail on the PDP).
9. **Sticky "Add to Bag" on mobile** — Ensures the CTA is always accessible.

---

## 2. Adidas.com — PDP Related Product Sections

### 2.1 Section Titles Used

Adidas uses the following section titles on their product detail pages:

- **"You May Also Like"** — The primary recommendation section. Observed with URL parameter `pr=product_rr`.
- **"Complete the Set"** (sometimes "Get Matching Items") — An outfit-building cross-sell. Adidas has a dedicated `/matching_set` category page. Observed with URL parameter `pr=pdpctl_rr`.
- **"More Products"** — General category-based recommendations.
- **"Recently Viewed"** — Footer-based browsing history section.
- **"Has Matching Item"** — A label/badge applied at the PLP level indicating that the product has a matching set item available.

### 2.2 Number of Products Shown Per Section

- **"You May Also Like":** ~24+ products loaded in an infinitely scrollable carousel (observed up to 48 items in some cases). 4 visible on desktop, 1.5–2 on mobile.
- **"Complete the Set" / "Get Matching Items":** 4 products shown in a grid (2×2 on desktop, or a single row of 4 cards). This section is more curated/scoped.
- **"Recently Viewed":** Typically 8–12 products.

### 2.3 Presentation Format

**Desktop:**
- **"You May Also Like"** — Horizontal **carousel** with left/right arrow buttons. Similar to Nike, uses native scrolling. Cards show product image, name, price, color variants, and badges ("Best Seller", "New", "-X%" discount badges).
- **"Complete the Set" (or "Get Matching Items")** — Two distinct presentation formats observed:
  1. **Inline in the sticky right sidebar** — A compact 2×2 grid of matching items rendered directly in the right-hand panel alongside the size selector and Add to Bag button. This is contextually placed for easy add-to-cart.
  2. **Below the main product info** — A horizontal row of 4 products.
- **"Recently Viewed"** — Horizontal scrollable row near the footer.

**Mobile:**
- **"You May Also Like"** — Horizontal carousel, swipeable. Full-width cards, ~1.5 visible.
- **"Complete the Set"** — Horizontal scroll row, positioned between the product info and the reviews/details section.
- No sticky sidebar (it collapses on mobile), so cross-sells move inline.
- Sticky "Add to Bag" CTA at the bottom as the user scrolls.

### 2.4 Positioning on the Page (Vertical Order)

Typical PDP page layout (top-to-bottom):

1. **Breadcrumb navigation**
2. **Product image gallery** (left) + **Product info panel** (right: title, price, rating stars, color selector, size selector with guide)
3. **"Get Matching Items"** (Adidas calls this "Complete the Set") — Embedded in the **right-hand sticky panel** directly below the size selector and above delivery/returns info. This is a distinctive placement — it's in the sticky sidebar, always visible while scrolling.
4. **Customer Reviews** — Placed directly beneath the image gallery (high priority — above technical details).
5. **Product details / accordion** (description, specs, materials)
6. **"You May Also Like"** — Full-width carousel section below the fold.
7. **"Recently Viewed"** — Footer area.
8. **Footer**

### 2.5 Selection Logic (Best Guess)

Adidas's recommendation engine appears similar to Nike's:

1. **Collaborative Filtering** — "You May Also Like" based on co-viewing/co-purchase patterns. The `pr=product_rr` URL parameter suggests a "product recommendation" algorithm.
2. **Matching Set / Outfit Logic** — "Complete the Set" uses product metadata to find matching items. This is likely rule-based: same sport + complementary category (e.g., shoes → socks/shin guards; jersey → shorts). The `pr=pdpctl_rr` parameter suggests "PDP complete the look" recommendations.
3. **Category Affinity** — Products from the same sport/category.
4. **Color/Material Matching** — Best guess: matching sets may use colorway information to suggest items with coordinated colors.
5. **Manual Merchandising** — New releases, featured collections, and collaborations likely have manual override capabilities.
6. **Price Range Matching** — Recommendations typically fall within a similar price tier.
7. **Explicit exclusion of current product.**

### 2.6 Creative Touches / Nice UX Patterns

1. **Sticky sidebar cross-sell ("Get Matching Items")** — This is a standout pattern. Adidas places "Complete the Set" items directly in the sticky right-hand panel so they're always visible while the user is scrolling through product details. This contextual placement encourages add-on purchases without requiring the user to scroll down.
2. **Delivery/Returns info under the CTA** — Free shipping and 30-day returns shown with icons right under the Add to Bag button reduces purchase anxiety.
3. **Bell icon for out-of-stock sizes** — When a size is unavailable, a bell icon appears allowing the user to sign up for restock notifications.
4. **Color swatches on cards** — Similar to Nike, showing available color variants directly on recommendation cards.
5. **"Has Matching Item" badge on PLP** — This label on the product listing page signals that a complete outfit can be built, encouraging click-through.
6. **Reviews placed high** — Customer reviews (with green star ratings) appear directly beneath the image gallery, above technical details, prioritizing social proof.
7. **Product labels/badges:** "Best Seller", "New", "Has Matching Item", "Gift with Purchase", "-X%" discount tags (with sale price in bright red and crossed-out original price).
8. **Breadcrumb navigation** — Always present on PDP for orientation and SEO.
9. **Size guide under size selector** — Placed exactly where users need it, reducing friction.

---

## 3. Key Differences: Nike vs Adidas

| Feature | Nike | Adidas |
|---|---|---|
| **Primary section title** | "You Might Also Like" | "You May Also Like" |
| **Outfit cross-sell title** | "Complete the Look" | "Complete the Set" / "Get Matching Items" |
| **Collection section** | "More from {Collection}" | "More Products" (category-based) |
| **Cross-sell placement** | Full-width carousel below product details | Inline in sticky sidebar panel (unique) |
| **Carousel technique** | Pure CSS scroll-snap + `scrollIntoView()` | Likely similar native scroll approach |
| **Number of recs** | 8–12 per section | 24+ in "You May Also Like" (very large set) |
| **Reviews placement** | Below product details | Directly beneath image gallery (higher) |
| **Recently viewed** | Footer | Footer |
| **Mobile sticky CTA** | Yes | Yes |
| **Badges used** | "Just In", "Best Seller", "Sustainable Materials", "Member Product" | "Best Seller", "New", "Has Matching Item", "Gift with Purchase", "-X%" |
| **Out-of-stock notification** | "Just a few left. Order soon." | Bell icon for restock signup |

---

## 4. Common Patterns (Both Sites)

Despite differences, Nike and Adidas share many patterns:

1. **Two distinct recommendation types** — A general "you might also like" section (algorithmic) and a curated "complete the look/set" section (outfit-building).
2. **Horizontal scroll (not grid) for product cards** — Both use horizontally scrollable carousels, not 2D grids, for related products.
3. **4 products visible at a time on desktop** — A standard across both.
4. **Arrow navigation + native swipe** — Arrow buttons for desktop, touch swipe for mobile. Both use native browser scrolling.
5. **Product badges on recommendation cards** — Labels like "Best Seller" and "New" appear on both.
6. **Color swatches on cards** — Both show available color variants.
7. **Recently Viewed in footer** — Both include this.
8. **Price always shown on recommendation cards.**
9. **Same brand only** — Both keep recommendations within their own brand (no cross-brand recommendations).
10. **Explicit exclusion of the current product.**

---

## 5. Recommendations for Athletica (Football Boot PDP)

Based on these findings, the following approach is recommended for Athletica:

### Section Titles
- **"You Might Also Like"** — General algorithmic recommendations (follows Nike's naming, which feels more natural)
- **"Complete the Kit"** — Football/soccer themed twist on "Complete the Look/Set" (boots → socks, shin guards, jersey)
- **"More from {Brand/Collection}"** — e.g., "More from Nike", "More from Predator Collection"

### Presentation
- **Horizontal scroll-snap carousel** (CSS `scroll-snap-type: x mandatory`) — lightweight, native, buttery smooth
- **4 cards visible on desktop**, 1.5 on mobile
- **Left/right arrow buttons** that appear on hover
- **Product card:** Image, name, price, color swatches, traction type badge (FG, SG, AG)
- **No JavaScript carousel library** — use native scroll + `scrollIntoView()`

### Positioning
1. Product info (sizes, colors, add to cart)
2. **"Complete the Kit"** — Positioned relatively high (after product info, before reviews) — shows complementary items (socks, shin guards, bags)
3. Product description/details
4. Reviews
5. **"You Might Also Like"** — Below reviews
6. **"More from {Brand}"** — Below that
7. **"Recently Viewed"** — Footer

### Selection Logic
- Same traction type (FG → other FG boots)
- Same brand (Nike boots → other Nike boots)
- Same price tier (±30%)
- Same sport (football only)
- Explicit exclusion of current product
- Manual override for new releases and featured products

---

## Sources

1. Builder.io blog post "Build buttery smooth carousels with pure CSS like Nike" (2025-10-03) — Confirms CSS scroll-snap technique, scrollIntoView(), component structure, arrow button behavior
2. KARL Mission article "Optimizing Apparel Product Pages for Conversions: Lessons from Adidas and Nike" (2025-10-21) — Confirms "Get Matching Items" cross-sell in sticky sidebar, "Best Seller" badges, reviews placement, delivery info placement, sticky mobile CTA
3. Direct observation from Adidas.com PDP (court-stabil-indoor-shoes/JR9541.html) — Confirms "You may also like" section with `pr=product_rr` parameter, "Complete the look" with `pr=pdpctl_rr`, ~48 items loaded
4. Nike.com category page `/w/complete-the-look-f6rs` — Confirms "Complete the look" as a named category/section
5. EngageBay blog "Cross-Selling Guide" — Confirms Adidas cross-sell pattern ("complete your look")
6. Mockplus article "30 Best Product Page Design Examples" — Confirms Nike PDP pattern, "You May Like" section
7. Athletica project research (areas/35-Product-Catalog.md) — Existing decision: Related products by model, brand, traction (3 carousels on PDP)
