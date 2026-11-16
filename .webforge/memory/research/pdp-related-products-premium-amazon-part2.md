# PDP Related Product Sections Research — Part 2: Amazon.com & Cross-Site Analysis

**Researcher:** Probe-Beacon (Intelligence Team)
**Date:** 2026-07-18
**Project:** Athletica — Football Boot E-Commerce Store

---

## 2. Amazon.com

### 2.1 Section Titles Observed

| Section Title | Notes | Source |
|---|---|---|
| "Frequently Bought Together" | Bundle with "Add All to Cart"; 2–3 items | Amazon PDP; sellersnap.io (2021) |
| "Customers Who Bought This Item Also Bought" | Horizontal carousel; collaborative filtering | Amazon PDP; tinuiti.com (2023) |
| "Customers Who Viewed This Item Also Viewed" | Substitutable item recommendations | Arxiv 2102.00141; Amazon PDP |
| "Compare with Similar Items" | Side-by-side comparison; up to 5 products | dev.stemconnector.com (2026) |
| "Sponsored Products Related to This Item" | Paid placements; labeled "Sponsored" | Arxiv 2102.00141; litcommerce.com |
| "Products Related to This Item" | Organic; category-based | tinuiti.com (2023) |
| "Similar brands on Amazon" | Cross-brand discovery | litcommerce.com (2024) |
| "Your Recently Viewed Items" | Session-based tracking | sellersnap.io (2021) |
| "Recommended for You" | Personalized homepage + PDP bottom | AWS Personalize docs |
| "Buy It Again" | Return visitors — past purchases | Medium — Anupam Singh (2026) |
| "What Other Customers Are Looking at Now" | Real-time social proof | sellersnap.io (2021) |
| "Deals on Related Products" | Discount-driven cross-sell | tinuiti.com (2023) |
| "Related to Items You've Viewed" | Cross-session browsing history | sageseller.com |
| "Sponsored Products You May Like" | Paid ad placements | sageseller.com |

### 2.2 Number of Products Per Section

| Section | Typical Count | Notes |
|---|---|---|
| "Frequently Bought Together" | 2–4 products + main | Bundle with 2 add-ons + current product |
| "Customers Who Bought This Also Bought" | 8–16 (2 rows of 4) | Horizontal carousel, loads more on scroll |
| "Customers Who Viewed This Also Viewed" | 8–12 | Horizontal carousel |
| "Sponsored Products Related" | 4–6 | 1 row sponsored, labeled |
| "Compare with Similar Items" | Up to 5 | Comparison chart/table |
| "Products Related to This Item" | 6–12 | Carousel |
| "Similar Brands on Amazon" | 4–6 | Brand-filtered |
| "Your Recently Viewed" | 4–10 | Horizontal strip, session-based |

*Sources: Multiple Amazon PDP observations; sellersnap.io (2021); helium10.com (2022)*

### 2.3 Presentation Format

| Section | Format | Details |
|---|---|---|
| "Frequently Bought Together" | **Bundle layout** — "+" connecting icons, total price, single "Add All to Cart" CTA, individual checkboxes | Below Buy Box; most-copied recommendation pattern |
| "Customers Who Bought This Also Bought" | **Horizontal carousel** — 4 items visible, arrows, product cards: image/title/price/rating | Scrollable, lazy-loaded |
| "Customers Who Viewed This Also Viewed" | **Horizontal carousel** — same format | |
| "Sponsored Products Related" | **Horizontal carousel** — 4 visible, "Sponsored" label | Paid, 3rd-party or Amazon |
| "Compare with Similar Items" | **Comparison table grid** — side-by-side features/price/rating | Launches full comparison page |
| "Similar Brands on Amazon" | **Horizontal carousel** | |
| "Your Recently Viewed" | **Horizontal strip** with product thumbnails | Compact, often at page bottom |

*Sources: popupsmart.com (2024); Medium — Anupam Singh (2026)*

### 2.4 Vertical Positioning on the Page (Full Top-to-Bottom)

**Amazon PDP vertical order (desktop):**

1. Product title, rating stars, badges
2. Product images (left) + Buy Box (right) — price, variants, quantity, Add to Cart / Buy Now
3. **"Frequently Bought Together"** — directly below Buy Box (above fold or just below)
4. **"Sponsored Products Related to This Item"** — below FBT
5. Product description / "About This Item" — bullet points
6. Product information table — technical specs
7. **"Compare with Similar Items"** — link/button below product info
8. Customer Questions & Answers
9. Customer Reviews — star breakdown, verified reviews
10. **"Customers Who Bought This Item Also Bought"** — carousel below reviews
11. **"Customers Who Viewed This Item Also Viewed"** — carousel
12. **"Products Related to This Item"** — carousel
13. **"Similar brands on Amazon"** — carousel
14. **"Your Recently Viewed Items"** — at/near footer
15. Footer

*Sources: Amazon PDP; tinuiti.com (2023); estorefactory.com; litcommerce.com (2024)*

**Critical Placement Insights:**
- **"Frequently Bought Together"** sits directly below the Buy Box — this is the zone of highest purchase intent (post-decision, pre-checkout)
- Recommendation modules are **never above the Buy Box** — they respect the primary decision zone
- The page is server-configured — what appears in each zone can change without a release cycle
- *Source: Medium — Anupam Singh, "Amazon's Embedded Upsell Strategy" (July 2026)*

### 2.5 Selection Logic

| Section | Selection Logic | Source |
|---|---|---|
| "Frequently Bought Together" | **Item-to-item collaborative filtering** — co-purchase data, millions of transaction pairs. Considers co-view patterns and sequential purchasing. Requires minimum purchase history. | sellersnap.io (2021); saecomfbapro.com (2026); sageseller.com (2024) |
| "Customers Who Bought This Also Bought" | **Item-to-item collaborative filtering** — cross-shopping patterns. Includes temporal sequence weighting. | sageseller.com (2024); rechargebyvtu.com (2026) |
| "Customers Who Viewed This Also Viewed" | **Session similarity** — products viewed in same session. The most "organic" recommendation type. | Arxiv 2102.00141 |
| "Sponsored Products Related" | **Paid PPC** — sellers bid on product targeting; matched by category, brand, price, rating | Amazon Sponsored Products guide; litcommerce.com (2024) |
| "Compare with Similar Items" | **Attribute-based** — same subcategory, compare features/price/rating | dev.stemconnector.com (2026) |
| "Similar Brands on Amazon" | **Brand-based filtering** — competitor/complementary brands | litcommerce.com (2024) |
| "Your Recently Viewed" | **Session/cookie tracking** — viewed products, sorted by recency | sellersnap.io (2021) |
| "Buy It Again" | **Purchase history** — past purchases eligible for repurchase | Medium — Anupam Singh (2026) |
| "Recommended for You" | **Personalized** — full browsing history, purchases, demographics | AWS Personalize docs |

**Amazon's Core Algorithm — Item-to-Item Collaborative Filtering:**
- Compares product relationships rather than customer similarities
- Calculates correlation coefficients between products based on co-purchase frequency, co-view patterns, sequential purchasing
- Uses "contextual co-occurrence weighting" — distinguishes different purchase contexts (first-time buyer vs. established practitioner vs. medical recommendation)
- Accounts for ~35% of all Amazon sales (estorefactory.com; sellerapp.com)
- *Source: sageseller.com (2024)*

### 2.6 Notable UX Patterns & Creative Touches

**1. "Frequently Bought Together" — Most-Copied Recommendation Pattern**
- Below Buy Box in "near-committed" intent zone
- 2-3 items connected by "+" icons, single "Add All to Cart" button
- **Anchoring bias** — customer already committed to main product spend; add-ons feel inexpensive
- Individual checkboxes for deselection (reduces friction)
- Uses data-derived authority ("frequently bought together") not "you might like"
- *Sources: popupsmart.com (2024); Medium — Anupam Singh (2026)*

**2. Multiple Recommendation Surfaces, One Page (5+ modules)**
Each serves a different intent signal:
- FBT = "complete my purchase"
- "Customers also bought" = collaborative filtering exploration
- "Customers also viewed" = comparison shopping
- "Buy it again" = returning user repurchase
- "Sponsored" = paid discovery
- *Source: Medium — Anupam Singh (2026)*

**3. Server-Configured Page Architecture**
- Not a static template — configurable surface per user/product
- What appears in each zone changes without release cycle
- Enables rapid A/B testing of recommendation placement
- *Source: Medium — Anupam Singh (2026)*

**4. Sponsored Label Research — No Effect on CTR**
- Academic study (NHSJS, 2025) found "Sponsored" labels do NOT significantly affect CTR
- **Position** has significant effect — Row 1 > Row 2 > Row 3
- Leftmost position advantage varies by product type
- *Source: NHSJS (2025) — Mark Chang*

**5. Cart Recommendation Strip (Completion Bias)**
- Inside cart view: items commonly bought alongside what user already has
- Uses completion bias — user wants the cart to feel complete
- *Source: Medium — Anupam Singh (2026)*

**6. Protection Plan Inline for High-Value Items**
- Insurance/warranty as selectable option inside Buy Box
- Catches risk anxiety at its most active moment
- Inline format outperforms post-checkout popup
- *Source: Medium — Anupam Singh (2026)*

**7. "Overall Pick" and "Best Seller" Badges**
- Algorithmically determined badges boost CTR
- *Source: NHSJS (2025)*

### 2.7 Mobile vs Desktop Differences

| Aspect | Desktop | Mobile |
|---|---|---|
| Buy Box | Fixed right column | Sticky Add to Cart bar after scroll |
| "Frequently Bought Together" | Visible below Buy Box | Below "Add to Cart", often collapsed |
| Carousels | 4 items visible, arrow nav | 1.5–2 visible, swipeable |
| "Compare with Similar Items" | Dedicated comparison page | Simpler comparison table |
| "Customers Also Bought" | 2 rows visible | 1 row, scrollable |
| Recently Viewed | Bottom strip | Footer/accordion |
| Page layout | 2-column | Single column, accordion sections |

*Sources: Amazon direct observation; various seller guides*

---

## 3. Cross-Site Patterns & Recommendations for Athletica

### 3.1 Key Takeaways from Premium Fashion (Mr Porter / Farfetch)

1. **"Complete the Look" is the highest-value cross-sell for fashion** — increases AOV 10%+ (Forrester TEI, 2024), reduces decision fatigue.
2. **Position CTL near Add to Cart** — highest purchase intent (intelistyle.com; Shopify guide).
3. **Show hero product alongside recommendations** — shoppers need visual context (Farfetch pattern).
4. **Use AI-based style compatibility** — co-purchase is a weak signal for fashion (ASOS research via Angadi Labs, 2026).
5. **"You Might Also Like" and "Complete the Look" were top performers** across fashion PDP tests (Stylitics, 2026).
6. **Handle OOS gracefully** — replace with visually similar alternatives (Farfetch pattern).
7. **Limit CTL to 3–4 items**, YMAL to 6–10 to avoid choice paralysis.

### 3.2 Key Takeaways from Amazon

1. **"Frequently Bought Together"** is most effective bundle format — but requires purchase data. For new stores, AI styling (CTL) is more practical.
2. **Multiple recommendation modules serve different intent signals** — separate modules for "complete outfit," "similar items," "same brand," "recently viewed."
3. **Never put recommendations above the Buy Box** — respect primary purchase decision zone.
4. **Use data-driven authority** in headers ("Frequently Bought Together" > "You Might Like").
5. **Bundle pricing with single "Add All to Cart"** CTA reduces friction and boosts AOV (popupsmart.com).
6. **Server-configured pages enable rapid testing** — build flexible recommendation system for A/B testing placement.
7. **35% of Amazon sales from recommendation sections** (estorefactory.com).

### 3.3 Recommended Section Order for Athletica PDP (Football Boots)

1. **Product Images + Details** (above fold)
2. **"Complete the Look" / "Match These Boots"** — 3–4 items (socks, shin guards, jerseys matching boot color/style) — JUST below Add to Cart
3. **"You Might Also Like"** — 6–8 similar boots (same category, similar price, different brand/color)
4. **"More from This Brand"** — other boots/gear from same manufacturer
5. **"Recently Viewed"** — session tracking at bottom (compact)
6. **"Customers Also Bought"** — collaborative filtering (once enough purchase data exists)

### 3.4 Mobile Considerations for Athletica

- All recommendation sections should be swipeable carousels on mobile
- CTL should show 2 per row or swipeable carousel
- Sticky Add to Cart bar must not conflict with recommendation modules
- Recently Viewed: compact horizontal strip
- High-contrast section headers (not gray) — bold colors "pop" better (Stylitics, 2026)

### 3.5 Selection Logic Recommendations

| Section | Recommended Logic for Athletica | Why |
|---|---|---|
| "Complete the Look" | Attribute-based AI: match by sport type, boot color, boot type (FG/AG/TF), brand. Suggest: socks, shin guards, jerseys, bags. | Style coordination drives purchases; same principle applies to football gear |
| "You Might Also Like" | Category + attribute similarity: same boot category (FG Firm Ground), similar price, different brands | Helps comparison shopping |
| "More from This Brand" | Brand filter: all products from same manufacturer | Brand loyalty is strong in football |
| "Recently Viewed" | Session cookie: products viewed in current/last session | Resume browsing without friction |
| "Customers Also Bought" | Collaborative filtering: co-purchase data (requires minimum order volume) | Data-driven authority; start with content-based fallback |

---

## Sources Index for Part 2

| Source | Key Contribution |
|---|---|
| popupsmart.com (2024) | Amazon FBT analysis; Sephora comparison |
| Medium — Anupam Singh (Jul 2026) | Amazon intent zones; FBT placement psychology; server-configured pages |
| sellersnap.io (2021) | FBT mechanics; collaborative filtering explanation |
| sageseller.com (2024) | Contextual co-occurrence weighting; item-to-item filtering |
| saecomfbapro.com (2026) | FBT strategy; complementarity analysis |
| helium10.com (2022) | FBT data analysis for sellers |
| estorefactory.com | 35% of Amazon sales from recommendations |
| tinuiti.com (2023) | Amazon PDP anatomy overview |
| litcommerce.com (2024) | Amazon PDP sections order |
| Arxiv 2102.00141 (2021) | Organic vs sponsored recommendations; RIN analysis |
| NHSJS (2025) — Mark Chang | Sponsored label has no CTR effect; position matters |
| rechargebyvtu.com (2026) | Collaborative filtering explanation |
| dev.stemconnector.com (2026) | "Compare with Similar Items" functionality |
| AWS Personalize docs | Frequently bought together recipe; recommendation types |
| Forrester TEI (2024, via Stylitics) | 15% lift in conversion, 10% AOV increase |
| Angadi Labs (2026) | CTL vs FBT for fashion; ASOS co-purchase research |
| Stylitics (2026) | Fashion PDP optimization; module performance data |
| ecomdesignpro.com (2026) | Recently viewed UX best practices |
