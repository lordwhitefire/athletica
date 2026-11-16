# PDP Related Product Sections — Comprehensive Research Report (Part 2/4)

## Section 4: Zalando.com

*Source: `pdp-zalando-related-products.md` (Probe-Wren, 2026-07-18)*

### 4.1 Section Titles Used

- **"Complete the Look"** (exact, current branding) — Outfit-building cross-sell (formerly "Shop the Look").
- **"Similar items"** (exact observed, lowercase) — Content-based similarity carousel.
- **"Customers Also Viewed"** — Collaborative filtering section.
- **"Get the Look"** — Style-creator-curated outfits.
- **"You Might Also Like"** — General algorithmic recommendations.
- **"Shop the Look"** (legacy, launched 2015, now evolved into "Complete the Look").
- **"Zalon"** — Premium personal stylist service (external).

*Source: Zalando Corporate (Nov 2021); Zalando Design (Jun 2023); Zalando Partner docs*

### 4.2 Number of Products Per Section

- **"Complete the Look":** Typically 4–6 products; multiple outfit variations possible.
- **"Similar items":** Typically 20–50 products; scrollable carousel. First position often reserved for Sponsored Products.
- **"Customers Also Viewed" / "Get the Look":** Typically 8–12 products.
- **"You Might Also Like":** Typically 8–12 products.

### 4.3 Presentation Format

**Desktop:**
- All sections use horizontal **carousels** with arrow navigation.
- "Complete the Look" shows complementary items to build a full outfit. Items clickable, addable directly to cart.
- "Similar items" shows product cards (image, brand, name, price). First position may be sponsored.
- "Shop the Look" (legacy) appears as outfit jumplinks within product image carousel.

**Mobile:**
- Swipeable carousels. Sticky "Add to Bag" button.
- Simplified accordion layout; larger fonts and more whitespace (2022 migration).

*Source: Zalando Design (Jun 2023, Mar 2022); Anysite API docs; Zalando Partner Ad Manager (Apr 2026)*

### 4.4 Vertical Positioning on the Page (Top-to-Bottom)

1. **Product Images & Gallery** (may include outfit jumplinks)
2. **Product Title, Brand, Price, Colour/Size Selection**
3. **Size Advice & Fit Information**
4. **Add to Bag / Buy Now** (sticky on mobile)
5. **Accordion Sections** (Details, Material, Shipping, Returns)
6. **Complete the Look** — carousel (4–6 items)
7. **Similar Items** — carousel (20–50 items, first slot may be sponsored)
8. **Customers Also Viewed / You Might Also Like** — carousel (8–12 items)
9. **Get the Look** (style creator outfits) — carousel
10. **Recently Viewed** — at very bottom
11. **Footer**

### 4.5 Selection Logic

1. **Algorithmic Fashion Companion (AFC)** — Proprietary ML algorithm for "Complete the Look." Teaches itself "what makes a good outfit" based on stylist-created outfits and customer purchase data. Uses colour coordination, style compatibility, and pairing patterns. Real-time personalisation.
2. **Content-Based Similarity** — "Similar items" matches by category, brand, style, colour, price range.
3. **Collaborative Filtering** — "Customers Also Viewed" / "You Might Also Like" based on co-viewing.
4. **Sponsored Products** — First slot in "Similar Items" carousel can be a paid sponsored product placement.
5. **Human Stylist** — "Get the Look" uses Style Creator Program (+25% interactions per customer with creator outfits).
6. **Zalon** — Personal human stylist service (premium, external).

*Sources: Zalando Corporate (Nov 2021); AI Expert Network (Sep 2023); Zalando Partner Ad Manager (Apr 2026)*

### 4.6 Notable UX Patterns

1. **Algorithmic Fashion Companion (AFC)**: Proprietary ML algorithm combining human stylist knowledge with machine learning.
2. **Human-in-the-loop styling**: AFC supplemented by human stylists adjusting the algorithm for fashion trends.
3. **Progressive disclosure**: 2022 PDP migration added whitespace and removed visual noise. Information revealed progressively.
4. **Four PDP experience principles**: (1) Enable decision making, (2) Tailor the experience, (3) Encourage playful exploration, (4) Inspire trust.
5. **Sponsored Products**: First slot in "Similar Items" carousel can be a paid placement (Ad Manager monetisation).
6. **Size & Fit integration**: Size advice prominently featured before recommendations, reducing returns.
7. **Dynamic background colours**: Design system supports dynamic backgrounds with accessibility-aware contrast adjustments.

---

## Section 5: Mr Porter / Farfetch (Premium Fashion)

*Source: `pdp-related-products-premium-amazon-part1.md` (Probe-Beacon, 2026-07-18)*

### 5.1 Section Titles Used

| Section Title | Site(s) | Source |
|---|---|---|
| "You Might Also Like" | Mr Porter | Observed via ShopMy.us mirror; yesplz.ai (2020) |
| "Complete the Look" | Farfetch | intelistyle.com, prixvue.com, screensdesign.com, yesplz.ai |
| "Similar Products" / "You May Also Like" | Farfetch, Net-a-Porter | yesplz.ai (2020) |
| "More from this Designer" / "More from this Brand" | Farfetch, Mr Porter | yesplz.ai (2025) |
| "Recently Viewed" | Mr Porter (via Mr P. line) | limespot.com (2021) |
| "You May Also Like" | Both (common premium pattern) | Stylitics PDP Optimization 2026 |

### 5.2 Number of Products Per Section

| Section | Count | Notes |
|---|---|---|
| "You Might Also Like" | 6–10 | Horizontal scrollable, 4 visible + scroll |
| "Complete the Look" | 3–4 | Curated outfit around hero item |
| "More from this Designer" | 6–12 | Varies by brand catalog depth |
| "Similar Products" | 4–8 | Category/attribute similarity |
| "Recently Viewed" | 4–8 | Sorted newest-first |

### 5.3 Presentation Format

| Section | Format | Details |
|---|---|---|
| "You Might Also Like" | **Horizontal carousel** | Single row, arrows, 4 visible on desktop |
| "Complete the Look" | **Spotlight/Bento layout** | Hero + 3–4 items as outfit bundle; "Add All to Cart" |
| "More from this Designer" | **Grid or horizontal row** | 2–4 column grid or scrollable carousel |
| "Similar Products" | **Horizontal carousel** | 4 visible, cards: image/name/brand/price |
| "Recently Viewed" | **Compact horizontal row** | Small thumbnails, swipeable on mobile |

*Sources: intelistyle.com (2021); yesplz.ai (2020, 2025); Stylitics (2026)*

### 5.4 Vertical Positioning on the Page (Top-to-Bottom)

**Mr Porter PDP order (typical):**
1. Breadcrumb → 2. Product images (left) + Info (right) → 3. Description/details → 4. **"You Might Also Like"** carousel → 5. **"More from this Designer"** grid → 6. Shipping/returns → 7. Footer

**Farfetch PDP order (typical):**
1. Breadcrumb → 2. Product images (left) + Details/price/size/Add to Bag (right) → 3. "The Details" (description, composition) → 4. **"Complete the Look"** (near Add to Bag area) → 5. **"Similar Products"** carousel → 6. Reviews (often absent) → 7. Shipping/returns → 8. Footer

*Key: "Complete the Look" sits near Add to Bag — highest purchase intent zone. Hero product is shown alongside suggestions for comparison.*

*Sources: prixvue.com (2022); intelistyle.com (2021); screensdesign.com*

### 5.5 Selection Logic

| Section | Logic | Source |
|---|---|---|
| "Complete the Look" | **AI visual compatibility + styling rules** — category, color, style, occasion, material, vibe. Deep learning + LLM-based style understanding. "Fill-in-the-blank" (FITB) approach. | yesplz.ai (2024); valantic (2025); Walmart CTL (2023); Springer VISUM (2021) |
| "You Might Also Like" | **Collaborative filtering + visual similarity** — co-view patterns, category/brand affinity | yesplz.ai (2020); Angadi Labs (2026) |
| "More from this Designer" | **Brand-based filtering** — all products from same brand/designer | yesplz.ai (2025) |
| "Similar Products" | **Category + attribute matching** — same subcategory, price range, style | yesplz.ai (2020) |
| "Recently Viewed" | **Session-based tracking** — sorted by recency | ecomdesignpro.com (2026) |

### 5.6 Notable UX Patterns

1. **Hero Product Reiteration (Farfetch)** — Query garment shown beside CTL suggestions. Shoppers compare without scrolling. *Source: intelistyle.com (2021)*
2. **Out-of-Stock Handling (Farfetch)** — OOS products in CTL replaced with visually similar alternatives. *Source: yesplz.ai (2020)*
3. **Soft Language (Mr Porter)** — "You Might Also Like..." — suggestive, not pushy.
4. **Product Card Format** — Image → Product Name → Brand → Price. Clean, minimal.
5. **Carousel Controls** — Dot indicators + arrow buttons. Smooth mouse drag scrolling. *Source: Stylitics (2026)*
6. **Farfetch FITB Dataset** — 128,398 outfits, 2–14 items per outfit. Louvain method product graph communities. *Source: Springer VISUM (2021)*

### 5.7 Mobile vs Desktop Differences

| Aspect | Desktop | Mobile |
|---|---|---|
| Layout | Side-by-side: images left, details right | Single column: images full-width, details below |
| CTL | 4 products in a row | 2 per row or swipeable carousel |
| "You Might Also Like" | Horizontal carousel, 4 visible | Swipeable, 1.5–2.5 cards visible |
| "More from this Designer" | 4-column grid | 2-column grid |
| Recently Viewed | Right rail or bottom row | Collapsible accordion or swipeable strip |
| Add to Cart | Standard button | Sticky bottom bar |

---

## Section 6: Amazon.com

*Source: `pdp-related-products-premium-amazon-part2.md` (Probe-Beacon, 2026-07-18)*

### 6.1 Section Titles Observed

Most extensive set of related-product sections of any site researched:

| Section Title | Notes | Source |
|---|---|---|
| "Frequently Bought Together" | Bundle with "Add All to Cart"; 2–3 items | Amazon PDP; sellersnap.io (2021) |
| "Customers Who Bought This Item Also Bought" | Carousel; collaborative filtering | Amazon PDP; tinuiti.com (2023) |
| "Customers Who Viewed This Item Also Viewed" | Substitutable item recs | Arxiv 2102.00141 |
| "Compare with Similar Items" | Side-by-side comparison; up to 5 | dev.stemconnector.com (2026) |
| "Sponsored Products Related to This Item" | Paid placements; "Sponsored" label | Arxiv 2102.00141 |
| "Products Related to This Item" | Organic; category-based | tinuiti.com (2023) |
| "Similar brands on Amazon" | Cross-brand discovery | litcommerce.com (2024) |
| "Your Recently Viewed Items" | Session-based tracking | sellersnap.io (2021) |
| "Recommended for You" | Personalized homepage + PDP | AWS Personalize docs |
| "Buy It Again" | Past purchases repurchase | Medium — Singh (2026) |
| "What Other Customers Are Looking at Now" | Real-time social proof | sellersnap.io (2021) |
| "Deals on Related Products" | Discount-driven cross-sell | tinuiti.com (2023) |
| "Related to Items You've Viewed" | Cross-session browsing | sageseller.com |
| "Sponsored Products You May Like" | Paid ad placements | sageseller.com |

### 6.2 Number of Products Per Section

| Section | Count | Notes |
|---|---|---|
| "Frequently Bought Together" | 2–4 + main | Bundle with add-ons + current product |
| "Customers Who Bought This Also Bought" | 8–16 (2 rows of 4) | Carousel, loads more on scroll |
| "Customers Who Viewed This Also Viewed" | 8–12 | Carousel |
| "Sponsored Products Related" | 4–6 | 1 row sponsored, labeled |
| "Compare with Similar Items" | Up to 5 | Comparison table |
| "Products Related to This Item" | 6–12 | Carousel |
| "Similar Brands on Amazon" | 4–6 | Brand-filtered |
| "Your Recently Viewed" | 4–10 | Horizontal strip |

### 6.3 Presentation Format

| Section | Format | Details |
|---|---|---|
| "Frequently Bought Together" | **Bundle layout** — "+" icons, total price, "Add All to Cart", checkboxes | Below Buy Box; most-copied pattern |
| "Customers Who Bought This Also Bought" | **Horizontal carousel** — 4 visible, arrows, image/title/price/rating | Scrollable, lazy-loaded |
| "Customers Who Viewed This Also Viewed" | **Horizontal carousel** — same format | |
| "Sponsored Products Related" | **Horizontal carousel** — 4 visible, "Sponsored" | Paid |
| "Compare with Similar Items" | **Comparison table grid** — features/price/rating | Launches comparison page |
| "Your Recently Viewed" | **Horizontal strip** — thumbnails | Compact, page bottom |

### 6.4 Vertical Positioning (Top-to-Bottom)

1. Product title, rating stars, badges
2. Product images (left) + Buy Box (right): price, variants, quantity, Add to Cart / Buy Now
3. **"Frequently Bought Together"** — directly below Buy Box (above fold or just below)
4. **"Sponsored Products Related to This Item"** — below FBT
5. Product description / "About This Item" — bullet points
6. Product information table — technical specs
7. **"Compare with Similar Items"** — link/button
8. Customer Questions & Answers
9. Customer Reviews
10. **"Customers Who Bought This Item Also Bought"** — carousel
11. **"Customers Who Viewed This Item Also Viewed"** — carousel
12. **"Products Related to This Item"** — carousel
13. **"Similar brands on Amazon"** — carousel
14. **"Your Recently Viewed Items"** — at/near footer
15. Footer

**Critical Insight:** "Frequently Bought Together" sits directly below Buy Box — highest purchase intent zone. Recommendation modules are **never above the Buy Box**. Page is server-configured for A/B testing.

### 6.5 Selection Logic

| Section | Logic | Source |
|---|---|---|
| "Frequently Bought Together" | **Item-to-item collaborative filtering** — co-purchase data, sequential purchasing, minimum history required | sellersnap.io (2021); sageseller.com (2024) |
| "Customers Who Bought This Also Bought" | **Item-to-item CF** — temporal sequence weighting | sageseller.com (2024) |
| "Customers Who Viewed This Also Viewed" | **Session similarity** — most organic rec type | Arxiv 2102.00141 |
| "Sponsored Products Related" | **Paid PPC** — bid on product targeting | Amazon Sponsored Products guide |
| "Compare with Similar Items" | **Attribute-based** — same subcategory | dev.stemconnector.com (2026) |
| "Your Recently Viewed" | **Session/cookie tracking** — recency sort | sellersnap.io (2021) |
| "Buy It Again" | **Purchase history** — past purchases | Medium — Singh (2026) |

**Amazon's Core Algorithm:** Item-to-item collaborative filtering. Compares product relationships (not customer similarities). Uses "contextual co-occurrence weighting." Accounts for ~35% of Amazon sales. *Source: sageseller.com (2024); estorefactory.com*

### 6.6 Notable UX Patterns

1. **"Frequently Bought Together"** — Most-copied pattern. Below Buy Box, anchoring bias (add-ons feel inexpensive after main purchase). Checkboxes for deselection reduce friction. *Sources: popupsmart.com (2024); Medium — Singh (2026)*
2. **Multiple Recommendation Surfaces** — FBT ("complete purchase"), "Customers also bought" (exploration), "Customers also viewed" (comparison), "Buy it again" (repurchase), "Sponsored" (paid discovery).
3. **Server-Configured Pages** — Not static; configurable per user/product. Enables rapid A/B testing. *Source: Medium — Singh (2026)*
4. **Sponsored Label Study** — Labels do NOT significantly affect CTR; **position** matters (Row 1 > Row 2 > Row 3). *Source: NHSJS (2025)*
5. **Cart Recommendation Strip** — Completion bias: items commonly bought alongside what user already has in cart.
6. **Protection Plan Inline** — Insurance/warranty inside Buy Box for high-value items.
7. **"Overall Pick" / "Best Seller" Badges** — Algorithmic badges boost CTR. *Source: NHSJS (2025)*

### 6.7 Mobile vs Desktop

| Aspect | Desktop | Mobile |
|---|---|---|
| Buy Box | Fixed right column | Sticky Add to Cart bar after scroll |
| "Frequently Bought Together" | Below Buy Box | Below "Add to Cart", often collapsed |
| Carousels | 4 visible, arrow nav | 1.5–2 visible, swipeable |
| "Compare with Similar Items" | Comparison page | Simpler comparison table |
| Recently Viewed | Bottom strip | Footer/accordion |
| Page layout | 2-column | Single column, accordion sections |

---

*End of Part 2/4 — Continue to Part 3 for Sports Sites (Puma, Decathlon, Foot Locker, New Balance, Reebok) and Common Patterns.*
