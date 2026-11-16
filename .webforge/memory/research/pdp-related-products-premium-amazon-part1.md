# PDP Related Product Sections Research — Part 1: Premium Fashion (Mr Porter / Farfetch)

**Researcher:** Probe-Beacon (Intelligence Team)
**Date:** 2026-07-18
**Project:** Athletica — Football Boot E-Commerce Store

---

## 1. Mr Porter / Farfetch (Premium Luxury Fashion)

### 1.1 Section Titles Observed / Documented

| Section Title | Site(s) | Source |
|---|---|---|
| "You Might Also Like" | Mr Porter | Observed on Mr Porter PDPs via ShopMy.us mirror; yesplz.ai (2020) |
| "Complete the Look" | Farfetch | Farfetch PDP — intelistyle.com, prixvue.com, screensdesign.com, yesplz.ai |
| "Similar Products" / "You May Also Like" | Farfetch, Net-a-Porter | yesplz.ai (2020) |
| "More from this Designer" / "More from this Brand" | Farfetch, Mr Porter (implicit brand grouping) | yesplz.ai (2025) |
| "Recently Viewed" | Mr Porter (via Mr P. line) | limespot.com (2021) |
| "You May Also Like" | Both (common premium pattern) | Stylitics PDP Optimization 2026 |

**Note:** Mr Porter and Farfetch share patterns as part of the YOOX NET-A-PORTER group ecosystem.

### 1.2 Number of Products Per Section

| Section | Typical Count | Notes |
|---|---|---|
| "You Might Also Like" | 6–10 products | Horizontal scrollable row, 4 visible + scroll |
| "Complete the Look" | 3–4 products | Curated outfit around hero item |
| "More from this Designer" | 6–12 products | Varies by brand catalog depth |
| "Similar Products" | 4–8 products | Category/attribute similarity |
| "Recently Viewed" | 4–8 items | Sorted newest-first (ecomdesignpro.com, 2026) |

*Sources: Baymard Institute; Shopify PDP Guide 2026; Stylitics*

### 1.3 Presentation Format

| Section | Format | Details |
|---|---|---|
| "You Might Also Like" | **Horizontal carousel** | Single row, scrollable left/right with arrows; 4 visible on desktop |
| "Complete the Look" | **Spotlight/Bento layout** | Hero + 3–4 recommended items as cohesive outfit bundle; often "Add All to Cart" |
| "More from this Designer" | **Grid or horizontal row** | 2–4 column grid or scrollable carousel |
| "Similar Products" | **Horizontal carousel** | 4 visible, scrollable; product cards with image/name/brand/price |
| "Recently Viewed" | **Compact horizontal row** | Small thumbnails, swipeable on mobile, usually near page bottom |

*Sources: intelistyle.com (2021); yesplz.ai (2020, 2025); Stylitics (2026)*

### 1.4 Vertical Positioning on the Page (Top to Bottom)

**Mr Porter PDP order (typical):**
1. Breadcrumb navigation
2. Product images (left) + Product info/price/variants/Add to Cart (right)
3. Product description / details / accordion
4. **"You Might Also Like"** — horizontal carousel (early below-fold)
5. **"More from this Designer"** — brand-specific product grid
6. Shipping/returns info
7. Footer

**Farfetch PDP order (typical):**
1. Breadcrumb
2. Product images (left) + Product details/price/size/Add to Bag (right)
3. "The Details" (description, composition, model info)
4. **"Complete the Look"** — near the Add to Bag area (above fold or just below)
5. **"Similar Products" / "You May Also Like"** — carousel
6. Customer Reviews (often absent on Farfetch per prixvue.com)
7. Shipping/returns
8. Footer

*Sources: prixvue.com (2022); intelistyle.com (2021); screensdesign.com*

**Key Finding:** "Complete the Look" sits **near the Add to Bag area** on Farfetch — purchase intent is highest there. The hero product is shown again right alongside suggestions for comparison (intelistyle.com, 2021).

### 1.5 Selection Logic

| Section | Selection Logic | Source |
|---|---|---|
| "Complete the Look" | **AI visual compatibility + styling rules** — matched by category, color, style, occasion, material, vibe. Deep learning + LLM-based style understanding. | yesplz.ai (2024); valantic blog (2025); Walmart CTL model (2023) |
| "You Might Also Like" | **Collaborative filtering + visual similarity** — co-view patterns, category affinity, brand affinity, visual attributes | yesplz.ai (2020); Angadi Labs (2026) |
| "More from this Designer" | **Brand-based filtering** — all products from same brand/designer, ranked by popularity or newest | yesplz.ai (2025); InsiderOne academy docs |
| "Similar Products" | **Category + attribute matching** — same subcategory, similar price range, style attributes | yesplz.ai (2020) |
| "Recently Viewed" | **Session-based tracking** — products viewed in current/previous sessions, sorted by recency | ecomdesignpro.com (2026) |

**Farfetch CTL Logic Detail:**
- Uses "fill-in-the-blank" (FITB) approach: given a partial outfit (current product), AI fills missing categories
- If a recommended item is out of stock, replaces with visually similar alternative — does NOT skip the slot
- Product communities (via Louvain method on product graphs) constrain sampling
- Dataset: 128,398 outfits, 2–14 products per outfit, from Farfetch catalog
- *Sources: Springer VISUM paper (2021); Farfetch dataset*

### 1.6 Notable UX Patterns & Creative Touches

**1. Hero Product Reiteration (Farfetch — CTL)**
- Farfetch shows query garment right next to suggestions in the CTL module
- Shoppers compare without scrolling back up
- *Source: intelistyle.com (2021)*

**2. Out-of-Stock Handling (Farfetch)**
- OOS products in CTL are replaced with visually similar alternatives
- Prevents dead-end shopping experiences
- *Source: yesplz.ai (2020)*

**3. Soft Section Language (Mr Porter)**
- Uses "You Might Also Like..." — suggestive, not pushy
- Visually prominent header but not aggressive
- *Source: Observed via ShopMy.us data*

**4. Product Card Format**
- Image → Product Name → Brand → Price
- Clean, minimal, no clutter
- *Source: Observed across multiple product pages*

**5. Carousel Controls**
- Dot indicators + arrow buttons
- Smooth scrolling with mouse drag
- *Source: Stylitics (2026)*

**6. No Customer Reviews on Farfetch**
- Intentionally omitted (likely to protect brand relationships with luxury designers)
- Focus on detailed product descriptions, size guides, model info
- *Source: prixvue.com (2022)*

### 1.7 Mobile vs Desktop Differences

| Aspect | Desktop | Mobile |
|---|---|---|
| Layout | Side-by-side: images left, details right | Single column: images full-width, details below |
| CTL | 4 products in a row | 2 per row or swipeable carousel |
| "You Might Also Like" | Horizontal carousel, 4 visible | Swipeable carousel, 1.5–2.5 cards visible |
| "More from this Designer" | 4-column grid | 2-column grid |
| Recently Viewed | Right rail or bottom row | Collapsible accordion or swipeable strip |
| Add to Cart | Standard button | Sticky bottom bar |
| Image carousel | Click thumbnails or arrow keys | Swipe gestures |

*Sources: Stylitics (2026); Shopify PDP Guide (2026); ecomdesignpro.com (2026)*

---

## Sources for Part 1

| Source | Publication | Key Contribution |
|---|---|---|
| intelistyle.com (2021) | "Complete The Look Recommendations" | Farfetch CTL analysis; hero product reiteration |
| prixvue.com (2022) | "The best ecommerce product detail pages" | Farfetch PDP review; missing reviews |
| screensdesign.com | "FARFETCH - Shop Luxury Fashion UI Breakdown" | CTL feature; Add to Bag animation |
| yesplz.ai (2020, 2024, 2025) | Multiple articles | Farfetch similarity recs; CTL AI logic; outfit types |
| Stylitics (2026) | "PDP Optimization for Fashion in 2026" | CTL vs YMAL performance data; placement guidance |
| Stylitics (2025) | "Fashion PDP Examples" | JD Sports, PUMA, Finish Line case studies |
| Angadi Labs (2026) | "Complete the Look vs Frequently Bought Together" | CTL vs FBT for fashion; ASOS research |
| Walmart Global Tech (2023) | "Personalized CTL model" | CTL architecture 5-step process |
| valantic (2025) | "Complete-the-Look: cross-selling with AI" | AI-based CTL; vector database approach |
| Baymard Institute | Product page research | PDP best practices |
| Shopify (2024, 2026) | PDP guides | Best practices; mobile optimization |
| Springer VISUM (2021) | "Fill in the blank for fashion" | Farfetch FITB dataset; 128,398 outfits |
| ecomdesignpro.com (2026) | "Recently Viewed Products UX" | Recently viewed best practices |
| limespot.com (2021) | "40+ product recommendation examples" | Luxury recently viewed placement |
