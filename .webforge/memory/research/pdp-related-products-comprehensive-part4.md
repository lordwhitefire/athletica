# PDP Related Product Sections — Comprehensive Research Report (Part 4/5)

## Section 9: Recommended Approach for Athletica

*Based on synthesized findings from all 12 sites across all 8 research files.*

### 9.1 Recommended Sections (With Justification)

#### 1. "Complete the Kit" — Outfit Bundling (Boots + Socks + Shin Guards + Bag)
- **Rationale:** "Complete the Look" is the single most-validated cross-sell pattern across all fashion/sport sites. Used by Nike, Adidas, Zalando, Farfetch, Puma, Foot Locker, New Balance, and Reebok. Puma's Stylitics integration reported +3% AOV and +235% conversion (Retail TouchPoints, 2024). Forrester TEI (2024) reported +15% conversion lift and +10% AOV increase from CTL.
- **Inspiration:** Zalando's "Complete the Look" (AFC algorithm), Adidas's sticky sidebar "Get Matching Items", New Balance's "Goes Well With", Farfetch's FITB model.
- **Selection Logic:** Attribute-based matching (same sport: football; complementary category: boots + socks + shin guards + bag; color coordination; brand matching). For launch: manually curated bundles.
- **Presentation:** Horizontal carousel with 3–4 items. Optionally show "Add All to Cart" bundle pricing (Amazon pattern).
- **Position:** High on page, directly below Add to Cart / size selection area (Adidas, Farfetch pattern).

#### 2. "You Might Also Like" — Similar Boots
- **Rationale:** Universal standard. Used by 9 of 11 sites. Provides discovery and comparison shopping.
- **Inspiration:** Nike's CSS scroll-snap carousel, ASOS's 16-slot neural CF system, Amazon's "Customers Who Viewed This Also Viewed."
- **Selection Logic:** Hybrid collaborative filtering + content-based similarity. Same stud type (FG → FG), same price tier (±30%), same sport (football only). For new products: content-based fallback (ASOS cold-start pattern).
- **Presentation:** Horizontal scroll-snap carousel (CSS only — Nike pattern). 4 visible on desktop, 1.5–2 on mobile. 8–12 products loaded.
- **Position:** Below customer reviews.

#### 3. "Frequently Bought Together" — Co-Purchase Bundles
- **Rationale:** Amazon's most-copied pattern. Drives ~35% of Amazon sales (estorefactory.com). Uses anchoring bias — user already committed to main purchase.
- **Inspiration:** Amazon's format with "+" icons, total price, "Add All to Cart" CTA, individual checkboxes.
- **Selection Logic:** Co-purchase data (association rule mining). For launch phase without data: show curated bundles (boots + stud kit + boot bag + care kit).
- **Presentation:** Inline bundle format (not carousel). 2–3 items + current product. Combined pricing with "Add All to Cart."
- **Position:** Below "You Might Also Like" or alongside it. Can move higher once purchase data accumulates.

#### 4. "More from {Brand}" — Brand-Specific Recommendations
- **Rationale:** Brand loyalty is strong in football (Nike, Adidas, Puma, New Balance). Used by Nike ("More from {Collection}"), Farfetch/Mr Porter ("More from this Designer").
- **Inspiration:** Nike's "More from {Collection}" carousel, Farfetch's "More from this Designer."
- **Selection Logic:** Brand-based filtering. All products from same brand, ranked by popularity/newest.
- **Presentation:** Horizontal carousel. 4–8 products.
- **Position:** Below "Frequently Bought Together."

#### 5. "Recently Viewed" — Session History
- **Rationale:** Universal pattern across ALL 11 sites. Low effort, high utility.
- **Inspiration:** Every site observed. Reebok's checkout placement also worth noting.
- **Selection Logic:** Session/cookie tracking. Sorted by recency.
- **Presentation:** Compact horizontal carousel. 4–8 items. Small thumbnails.
- **Position:** Footer area.

### 9.2 Recommended Section Order on the PDP

1. **Breadcrumb navigation**
2. **Product images** (left/gallery) + **Product info** (right: title, price, variant selector, size selector)
3. **Add to Cart / Buy Now**
4. **"Complete the Kit"** — 3–4 complimentary items (socks, shin guards, bag) — Just below Add to Cart (high purchase intent zone — inspired by Adidas sticky sidebar, Farfetch CTL placement)
5. **Product description / details / accordion** (specs, materials, care)
6. **Customer Reviews & Ratings**
7. **"You Might Also Like"** — Similar boots (8–12 items, carousel)
8. **"Frequently Bought Together"** — Co-purchase bundles (2–3 items, bundle format)
9. **"More from {Brand}"** — Brand-specific recommendations (4–8 items)
10. **"Recently Viewed"** — Footer carousel (4–8 items)
11. **Footer**

### 9.3 Section Titles Tailored for a Football Boot Store

| Proposed Title | Rationale | Inspired By |
|---|---|---|
| **"Complete the Kit"** | Football-themed twist on "Complete the Look". "Kit" is football-specific for the full uniform. | Zalando "Complete the Look", Adidas "Complete the Set", Nike "Complete the Look" |
| **"You Might Also Like"** | Most widely used title across all sites. Natural, non-pushy. | Nike, ASOS, Mr Porter, Zalando |
| **"Frequently Bought Together"** | Data-driven authority language. Proven to drive conversions. | Amazon (core pattern) |
| **"More from {Brand}"** | e.g., "More from Nike", "More from Adidas". Clear and brand-focused. | Nike, Farfetch, Mr Porter |
| **"Recently Viewed"** | Universal, functional. | Every site |

### 9.4 Selection Logic for Each Section

| Section | Selection Logic | Attributes to Match |
|---|---|---|
| **"Complete the Kit"** | Attribute-based + rule-based: boot type (FG/AG/TF) → complementary categories (socks, shin guards, bag). Color coordination. Same sport (football). | `sport: football`, `complementary_category`, `color_match`, `brand_match` |
| **"You Might Also Like"** | Hybrid: collaborative filtering + content-based. Same stud type, price tier, sport. Exclude current product. Fallback: brand + category similarity. | `stud_type`, `ground_type`, `price_tier`, `brand`, `exclude: current_product` |
| **"Frequently Bought Together"** | Co-purchase data (association rules). For new store: manually curated bundles (boots + boot bag + care kit). | `co_purchase_frequency` |
| **"More from {Brand}"** | Brand filter. All products from same manufacturer. Rank by popularity/newest. Exclude current product. | `brand`, `exclude: current_product` |
| **"Recently Viewed"** | Session cookies. Sorted by recency. | `view_timestamp` |

### 9.5 Presentation Format

| Section | Desktop Format | Mobile Format | Products |
|---|---|---|---|
| **"Complete the Kit"** | Horizontal carousel or bundle row (with "Add All to Cart") | Swipeable carousel | 3–4 items |
| **"You Might Also Like"** | CSS scroll-snap carousel, 4 visible, hover arrows | Swipeable, 1.5–2 visible | 8–12 items |
| **"Frequently Bought Together"** | Bundle layout: items + "+" icons + total price + "Add All to Cart" | Stacked bundle layout | 2–3 + current |
| **"More from {Brand}"** | Horizontal carousel, 4 visible | Swipeable, 1.5–2 visible | 4–8 items |
| **"Recently Viewed"** | Compact horizontal strip | Swipeable strip | 4–8 items |

**Product Card Design:**
- Image (high quality)
- Product Name
- Brand Logo/Name
- Price
- Color Swatches (available variants)
- Traction Type Badge (FG, SG, AG, TF, MG — football-specific)
- Badges: "Best Seller", "New", "Sale" (when applicable)

**Carousel Implementation:**
- CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: start` (Nike pattern).
- `scroll-padding: 0 18px` for edge breathing room.
- `overflow-x: auto` with `display: flex` for track.
- Arrow buttons that enable/disable based on scroll position (Nike pattern).
- Left arrow grays out at start, right arrow at end.
- No JavaScript carousel library needed.

### 9.6 Mobile Considerations

- **Sticky "Add to Cart" CTA** at bottom — universal pattern across all sites.
- All carousels use **native touch swipe** — no custom drag handlers.
- **1.5–2 cards visible** per carousel on mobile.
- Sections stack vertically (single column).
- **Full-width product cards** with larger touch targets.
- **Progressive disclosure** — accordion/toggle for details sections (Zalando 2022 migration pattern).
- **High-contrast section headers** — bold colors "pop" better on mobile (Stylitics, 2026).

### 9.7 Out-of-Stock Handling

- **"Complete the Kit"**: If recommended item is OOS, replace with visually similar alternative (Farfetch FITB pattern). Do NOT skip the slot.
- **"You Might Also Like"**: OOS products can still appear but show OOS label. Alternatively, show in-stock alternatives (ASOS "SIMILAR ITEMS" pattern).
- **"Frequently Bought Together"**: Only show items that are in stock. Bundle must be purchasable.
- **"More from {Brand}"**: Filter out OOS products or show with "Notify Me" (Adidas bell icon pattern).

### 9.8 Personalization Approach

| Level | Data Required | Sections Affected |
|---|---|---|
| **Session-based** (no login) | Cookies, current session browsing | Recently Viewed, You Might Also Like |
| **Member-based** (logged in) | Purchase history, browsing history, saved items | All sections ranked by relevance |
| **Profile-based** (quiz) | Style/preference questionnaire (ASOS Profile Builder) | Complete the Kit, You Might Also Like |
| **Behavioral** (learning) | Accumulated interactions (views, clicks, add-to-cart) | All sections improve over time |

**Launch Phase Recommendation:**
- Start with content-based + rule-based logic (no user history needed).
- Add collaborative filtering once purchase data reaches critical mass (100+ orders).
- Consider a "Profile Builder" style quiz (36 samples, ASOS pattern) for early personalization.

### 9.9 Performance Data Summary

| Metric | Source | Value |
|---|---|---|
| Amazon sales from recommendations | estorefactory.com | ~35% |
| Puma Stylitics AOV increase | Retail TouchPoints (2024) | +3% |
| Puma Stylitics conversion lift | Retail TouchPoints (2024) | +235% |
| Puma Stylitics session duration lift | Retail TouchPoints (2024) | +334% |
| Decathlon Insider AOV increase (web push) | Insider case study (2024) | +8% |
| Decathlon Insider AOV (checkout) | Insider case study (2024) | +14% |
| Zalando Style Creator interaction increase | AI Expert Network (2023) | +25% |
| Farfetch FITB dataset | Springer VISUM (2021) | 128,398 outfits |
| Forrester TEI CTL conversion lift | Stylitics citing Forrester (2024) | +15% |
| Forrester TEI CTL AOV increase | Stylitics citing Forrester (2024) | +10% |

---

*End of Part 4/5 — Continue to Part 5 for Best Section Titles and Appendices.*
