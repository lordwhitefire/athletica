# PDP Related Product Sections — Comprehensive Research Report (Part 1/4)

## Project: Athletica (Football Boot E-commerce)
## Date: 2026-07-18
## Compiled By: Probe-Orion (Intelligence Team)
## Source Files:
1. `pdp-related-products-nike-adidas.md` — Probe-Orion (Nike & Adidas)
2. `pdp-asos-related-products.md` — Probe-Wren (ASOS)
3. `pdp-zalando-related-products.md` — Probe-Wren (Zalando)
4. `pdp-related-products-summary.md` — Probe-Wren (Cross-site summary)
5. `pdp-related-products-premium-amazon-part1.md` — Probe-Beacon (Mr Porter / Farfetch)
6. `pdp-related-products-premium-amazon-part2.md` — Probe-Beacon (Amazon)
7. `pdp-related-products-other-sports.md` — Probe-Sable (Puma, Decathlon, Foot Locker)
8. `pdp-related-products-other-sports-part2.md` — Probe-Sable (New Balance, Reebok + matrix)

---

## Table of Contents

- [Section 1: Nike.com](#section-1-nikecom)
- [Section 2: Adidas.com](#section-2-adidascom)
- [Section 3: ASOS.com](#section-3-asoscom)
- [Section 4: Zalando.com (Part 2)](#section-4-zalandocom)
- [Section 5: Mr Porter / Farfetch (Part 2)](#section-5-mr-porter--farfetch-premium-fashion)
- [Section 6: Amazon.com (Part 2)](#section-6-amazoncom)
- [Section 7: Other Sports/Fashion Sites (Part 3)](#section-7-other-sportsfashion-sites)
- [Section 8: Common Patterns (Part 3)](#section-8-common-patterns-across-all-sites)
- [Section 9: Recommended Approach (Part 4)](#section-9-recommended-approach-for-athletica)
- [Section 10: Best Section Titles (Part 4)](#section-10-best-section-titles-found)
- [Appendices (Part 4)](#appendices)

---

## Section 1: Nike.com

*Source: `pdp-related-products-nike-adidas.md` (Probe-Orion, 2026-07-18)*

### 1.1 Section Titles Used

Nike uses the following section titles on their product detail pages:

- **"You Might Also Like"** — The primary cross-sell section. Appears consistently across most PDPs.
- **"Complete the Look"** — A dedicated section for outfit-building (shoes + apparel). Nike has a dedicated category page at `/w/complete-the-look-f6rs`.
- **"More from {Collection Name}"** — (e.g., "More from Air Max", "More from Jordan Collection") — Appears when the product belongs to a named collection or lineup.
- **"Recently Viewed"** — Footer-level section based on the user's browsing history (personalized).
- **"Your bag is empty? Here's some inspiration"** — Appears on cart/checkout, not PDP.
- **"Member Product" / "Just In" / "Best Seller"** — These are labels/tags on product cards within related sections, not section titles themselves.

*Source: Nike.com PDP observation; Builder.io blog (2025-10-03); KARL Mission article (2025-10-21)*

### 1.2 Number of Products Per Section

- **Carousel sections ("You Might Also Like", "Complete the Look"):** ~8–12 products loaded, with 4 visible on desktop and 1.5–2 visible on mobile.
- **Collection sections ("More from..."):** Typically 4–8 products.

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
- Arrow buttons replaced by native swipe/drag behavior.

*Source: Builder.io blog (2025-10-03); KARL Mission article (2025-10-21)*

### 1.4 Vertical Positioning on the Page (Top-to-Bottom)

1. **Breadcrumb navigation**
2. **Product image gallery** (left) + **Product info** (right: title, price, size selector, color picker, Add to Bag CTA)
3. **Product description / details** section
4. **"Complete the Look"** — Appears relatively high, often right after or alongside the size/color selection area.
5. **Product details accordion** (description, specs, shipping info)
6. **Reviews & Ratings**
7. **"You Might Also Like"** — Below reviews
8. **"More from {Collection}"** — Below "You Might Also Like"
9. **"Recently Viewed"** — Footer area
10. **Footer**

*Note: Exact positioning varies by product category. For apparel, "Complete the Look" appears higher than for shoes.*

*Source: KARL Mission article (2025-10-21); Mockplus article*

### 1.5 Selection Logic (Best Guess Based on Research)

1. **Collaborative Filtering** — "You Might Also Like" based on what other users who viewed this product also viewed/purchased.
2. **Category Affinity** — Products from the same sport/category (e.g., soccer cleats → other soccer cleats).
3. **Collection/Lineage Matching** — "More from {Collection}" explicitly pulls from the same product line or collection.
4. **Outfit/Complement Matching** — "Complete the Look" pairs shoes with apparel that visually or functionally complement each other (matching colorways, same sport). Often manually curated or rule-based.
5. **Merchandising Rules** — Manual overrides for new releases, seasonal pushes, and collaborations.
6. **Price Range** — Recommendations stay within a similar price band (±30–40%).
7. **Explicit exclusion of current product** — The product being viewed is always excluded.

### 1.6 Notable UX Patterns

1. **CSS Scroll-Snap Carousel** — Pure CSS approach means no JavaScript library overhead, buttery smooth performance, and native touch support.
2. **Scroll-padding** — `scroll-padding: 0 18px` ensures cards don't hug the container edge.
3. **Arrow buttons that enable/disable based on scroll position** — Left arrow grays out when at the start, right arrow when at the end. State tracked via `scrollLeft`, `scrollWidth`, and `clientWidth`.
4. **Hover-reveal arrows** — Arrow buttons only appear on hover, reducing visual clutter.
5. **Color swatches on product cards** — Cards show available color variants as small swatches.
6. **Product labels/badges** — "Just In", "Best Seller", "Sustainable Materials", "Member Product" badges.
7. **"Just a few left. Order soon."** — Low-stock messaging on the PDP creates urgency.
8. **Automatic scroll to size selector** — If user clicks "Add to Bag" without selecting a size, page auto-scrolls to size picker.
9. **Sticky "Add to Bag" on mobile** — Ensures the CTA is always accessible.

---

## Section 2: Adidas.com

*Source: `pdp-related-products-nike-adidas.md` (Probe-Orion, 2026-07-18)*

### 2.1 Section Titles Used

Adidas uses the following section titles on their product detail pages:

- **"You May Also Like"** — The primary recommendation section. Observed with URL parameter `pr=product_rr`.
- **"Complete the Set"** (sometimes "Get Matching Items") — An outfit-building cross-sell. Adidas has a dedicated `/matching_set` category page. Observed with URL parameter `pr=pdpctl_rr`.
- **"More Products"** — General category-based recommendations.
- **"Recently Viewed"** — Footer-based browsing history section.
- **"Has Matching Item"** — A label/badge applied at the PLP level.

*Source: Adidas.com PDP observation (court-stabil-indoor-shoes/JR9541.html); KARL Mission article (2025-10-21); EngageBay cross-selling guide*

### 2.2 Number of Products Per Section

- **"You May Also Like":** ~24+ products loaded in an infinitely scrollable carousel (observed up to 48 items in some cases). 4 visible on desktop, 1.5–2 on mobile.
- **"Complete the Set" / "Get Matching Items":** 4 products shown in a grid (2×2 on desktop, or a single row of 4 cards).
- **"Recently Viewed":** Typically 8–12 products.

### 2.3 Presentation Format

**Desktop:**
- **"You May Also Like"** — Horizontal **carousel** with left/right arrow buttons. Similar to Nike, uses native scrolling. Cards show product image, name, price, color variants, and badges ("Best Seller", "New", "-X%" discount badges).
- **"Complete the Set"** — Two distinct presentation formats observed:
  1. **Inline in the sticky right sidebar** — A compact 2×2 grid of matching items rendered directly in the right-hand panel alongside the size selector and Add to Bag button.
  2. **Below the main product info** — A horizontal row of 4 products.
- **"Recently Viewed"** — Horizontal scrollable row near the footer.

**Mobile:**
- **"You May Also Like"** — Horizontal carousel, swipeable. Full-width cards, ~1.5 visible.
- **"Complete the Set"** — Horizontal scroll row, positioned between product info and reviews/details.
- No sticky sidebar (collapses on mobile), so cross-sells move inline.
- Sticky "Add to Bag" CTA at the bottom as the user scrolls.

*Source: Adidas.com direct observation; KARL Mission article (2025-10-21)*

### 2.4 Vertical Positioning on the Page (Top-to-Bottom)

1. **Breadcrumb navigation**
2. **Product image gallery** (left) + **Product info panel** (right: title, price, rating stars, color selector, size selector with guide)
3. **"Get Matching Items"** (Adidas calls this "Complete the Set") — Embedded in the **right-hand sticky panel** directly below the size selector and above delivery/returns info. Always visible while scrolling.
4. **Customer Reviews** — Placed directly beneath the image gallery (high priority — above technical details).
5. **Product details / accordion** (description, specs, materials)
6. **"You May Also Like"** — Full-width carousel section below the fold.
7. **"Recently Viewed"** — Footer area.
8. **Footer**

*Source: KARL Mission article (2025-10-21)*

### 2.5 Selection Logic (Best Guess)

1. **Collaborative Filtering** — "You May Also Like" based on co-viewing/co-purchase patterns. The `pr=product_rr` URL parameter suggests a "product recommendation" algorithm.
2. **Matching Set / Outfit Logic** — "Complete the Set" uses product metadata to find matching items. Likely rule-based: same sport + complementary category (e.g., shoes → socks/shin guards; jersey → shorts). The `pr=pdpctl_rr` parameter suggests "PDP complete the look" recommendations.
3. **Category Affinity** — Products from the same sport/category.
4. **Color/Material Matching** — Matching sets may use colorway information to suggest items with coordinated colors.
5. **Manual Merchandising** — New releases, featured collections, and collaborations likely have manual override capabilities.
6. **Price Range Matching** — Recommendations typically fall within a similar price tier.
7. **Explicit exclusion of current product.**

### 2.6 Notable UX Patterns

1. **Sticky sidebar cross-sell ("Get Matching Items")** — A standout pattern. Placed in the sticky right-hand panel so always visible while scrolling. Contextual placement encourages add-on purchases without requiring the user to scroll down.
2. **Delivery/Returns info under the CTA** — Free shipping and 30-day returns shown with icons right under the Add to Bag button reduces purchase anxiety.
3. **Bell icon for out-of-stock sizes** — When a size is unavailable, a bell icon appears allowing the user to sign up for restock notifications.
4. **Color swatches on cards** — Similar to Nike, showing available color variants directly on recommendation cards.
5. **"Has Matching Item" badge on PLP** — Signals that a complete outfit can be built, encouraging click-through.
6. **Reviews placed high** — Customer reviews appear directly beneath the image gallery, above technical details, prioritizing social proof.
7. **Product labels/badges:** "Best Seller", "New", "Has Matching Item", "Gift with Purchase", "-X%" discount tags.
8. **Breadcrumb navigation** — Always present on PDP for orientation and SEO.
9. **Size guide under size selector** — Placed exactly where users need it.

---

## Section 3: ASOS.com

*Source: `pdp-asos-related-products.md` (Probe-Wren, 2026-07-18)*

### 3.1 Section Titles Used

- **"YOU MIGHT ALSO LIKE"** (exact observed, uppercase) — The primary recommendation section.
- **"SIMILAR ITEMS"** (exact observed, uppercase) — Content-based similarity carousel.
- **"People also bought"** (exact observed, lowercase 'p') — Co-purchase bundling.
- **"Recently Viewed"** — Session-based footer carousel.
- **"Your Edit"** — Homepage personalised feed (not PDP).
- **"We found these for you in the sale"** — Promotional personalised feed.
- **"Similar vibes to your saved items"** — Personalised recommendations.
- **"Style Match"** — Visual search tool (not PDP section).
- **"AI Stylist"** — Conversational AI (not PDP section).

*Source: ASOS Tech Blog (Medium, Oct 2022); Live PDP observations (Dr Martens, Revolution Eyeliner, Jul 2026); XgenTech (Apr 2026)*

### 3.2 Number of Products Per Section

- **"YOU MIGHT ALSO LIKE":** 16 products in the carousel (per ASOS Tech Blog); up to 18 observed on live pages.
- **"SIMILAR ITEMS":** Typically 10–18 products (observed 18 on a boots PDP).
- **"People also bought":** Typically 3 products in a small inline grid.
- **"Recently Viewed":** Typically 5–8 products, scrollable.

### 3.3 Presentation Format

**Desktop:**
- **"YOU MIGHT ALSO LIKE"** — Horizontal **carousel** with left/right arrow navigation. 4–5 products visible at a time.
- **"SIMILAR ITEMS"** — Same horizontal carousel format.
- **"People also bought"** — Small **inline grid** (not a carousel) — usually 1×3 or 1×4 products with prices.
- **"Recently Viewed"** — Horizontal **carousel** with thumbnails.

**Mobile:**
- Carousels adapt to swipeable horizontal scroll, typically showing 1.5–2 products at a time.
- "People also bought" stacks to a single column.
- Sticky "Add to Bag" button on mobile.

*Source: Live PDP observations; DesignRush analysis (Jan 2025)*

### 3.4 Vertical Positioning on the Page (Top-to-Bottom)

1. **Product Images & Gallery**
2. **Product Title, Price, Colour/Size Selection, Add to Bag**
3. **Size & Fit / Product Details** (accordion)
4. **YOU MIGHT ALSO LIKE** — carousel (16 products)
5. **SIMILAR ITEMS** — carousel (10–18 products) [conditionally shown, especially for out-of-stock items]
6. **People also bought** — inline grid (3 products)
7. **Recently Viewed** — carousel (at very bottom)
8. **Footer**

*Note: Exact ordering varies slightly by product category and stock status.*

### 3.5 Selection Logic

1. **Neural Collaborative Filtering** — "YOU MIGHT ALSO LIKE" uses deep learning (TensorFlow 2, Azure ML). Takes a weighted average of the customer embedding and the hero product embedding, then calculates similarity against a candidate set filtered by business rules (same category). Embeddings pre-computed for sub-50ms latency.
2. **Content-Based Similarity** — "SIMILAR ITEMS" matches by brand, category, style attributes, colour, and price range. Used especially for cold-start products without interaction data.
3. **Co-Purchase Data / Association Rule Mining** — "People also bought" based on products that other customers have purchased together.
4. **Session-Based Tracking** — "Recently Viewed" items stored in browser cookies or user account.
5. **Profile Builder** — New customers take a style quiz (36 products from 36 clusters) to build their taste profile, feeding into all recommendation modules.

*Source: ASOS Tech Blog (Oct 2022); Harvard Business School AI Institute (Dec 2022)*

### 3.6 Notable UX Patterns

1. **Personalisation at scale**: Neural collaborative filtering for 100K+ products and 26M customers.
2. **Cold-start handling**: New products get embeddings from textual descriptions and images via a deep neural network.
3. **16-slot constraint**: "You Might Also Like" only has 16 slots, making ranking quality critical.
4. **Clean, white interface**: Minimal white background with high-quality imagery.
5. **No "Complete the Look" on PDP**: ASOS does NOT use an outfit-bundling section on PDPs. Instead, outfit recommendations go through "AI Stylist" (chat) and "Style Match" (visual search).
6. **SIMILAR ITEMS shown for out-of-stock products**: When a product is out of stock, "SIMILAR ITEMS" appears to offer alternatives.
7. **Mobile-first**: App and mobile web use the same recommendation engine with swipe-based carousel interactions.

---

*End of Part 1/4 — Continue to Part 2 for Zalando, Premium Fashion (Mr Porter/Farfetch), and Amazon.*
