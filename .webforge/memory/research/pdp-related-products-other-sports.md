# Research Report: PDP Related Product Sections — Puma, Decathlon, Foot Locker, New Balance, Reebok (Part 1/2)

**Agent:** Probe-Sable
**Task ID:** task-research-pdp-sections-001-sable
**Date:** 2026-07-18
**Project:** Athletica (football boot e-commerce)

---

## Executive Summary

This report covers five major sports/fashion retail sites and how they handle related product sections on PDPs. All use multi-section approaches with 2–4 distinct recommendation types. Puma stands out with AI-powered "How to Wear It" styling. Decathlon uses a standardized approach. Foot Locker focuses on brand/category-based bundling. New Balance shows "Complete the Look" + "Goes Well With." Reebok uses "Complete the Look" + "Recently Viewed" at checkout.

---

## 1. Puma.com — PDP Related Product Sections

### 1.1 Section Titles Used
- **"How to Wear It"** — Styling tool showing product in multiple outfits (powered by Stylitics AI).
- **"You May Also Like"** — Algorithmic general recommendations.
- **"Frequently Bought Together"** — Bundling suggestions based on co-purchase data.
- **"Shop the Model" / "Shop the Look"** — Links products worn by model in hero image.
- **"Complete the Look"** — Curated complementary products. Puma has a dedicated page at `/collections/lifestyle/complete-the-look`.
- **"Recently Viewed"** — Footer-level browsing history.

*Source: Stylitics blog "Fashion PDP Examples" (2025-08-13); Retail TouchPoints article (2024-01-08); Puma.com page observation.*

### 1.2 Number of Products Per Section
- **"How to Wear It":** 4–6 styled looks, 3–6 products per look.
- **"You May Also Like":** ~8–12 loaded, 4 visible on desktop carousel, 1.5–2 on mobile.
- **"Frequently Bought Together":** 3–4 products in bundle format.
- **"Complete the Look":** 4–8 products in carousel.

### 1.3 Presentation Format
**Desktop:** "How to Wear It" is a carousel of styled outfit images (studio photography). Products in each look are clickable. "You May Also Like" — horizontal carousel with arrows, showing image, name, price, color swatches, badges. "Frequently Bought Together" — grid row with combined pricing + "Add all to cart."

**Mobile:** Same sections, full-width carousels, touch swipe. Sticky "Add to Bag" CTA at bottom.

### 1.4 Vertical Positioning
1. Breadcrumb → 2. Gallery + Info panel → 3. **"How to Wear It"** (high, below CTA) → 4. Product details → 5. **"You May Also Like"** → 6. **"Frequently Bought Together"** → 7. Reviews → 8. Recently Viewed → 9. Footer

### 1.5 Selection Logic
1. **AI-Powered Styling (Stylitics)** — Automatically outfits products with complementary items considering style, color, trends, inventory.
2. **Collaborative Filtering** — "You May Also Like" from co-viewing/co-purchase.
3. **Co-Purchase Data** — "Frequently Bought Together" from transactions.
4. **Manual Merchandising** — Can boost specific items to front of carousels.
5. **Shop the Model** — Exact product matching from hero image.
6. **Post-Purchase Personalization** — Outfit recs in post-purchase emails.

### 1.6 Notable UX Patterns
1. "How to Wear It" styling tool — unique, shows product in multiple fully-styled outfits.
2. "Shop the Model" — first Stylitics image shows exact products from hero image.
3. AI-driven inventory management — sold-out items auto-replaced.
4. Post-purchase email outfits for retention.
5. Seasonal merchandising boosts (e.g., Mother's Day).
6. Reported: +3% AOV, +235% conversion, +334% session duration among Stylitics users.

### 1.7 Mobile vs Desktop
- Desktop: side-by-side outfit carousels with arrows.
- Mobile: vertical stack, swipeable carousels, sticky CTA.
- Stylitics modules are responsive.

*Source: Retail TouchPoints (2024-01-08); Stylitics blog (2025-08-13).*

---

## 2. Decathlon — PDP Related Product Sections

### 2.1 Section Titles Used
- **"You might also like"** — Alternative/similar products.
- **"Customers also viewed"** — Social proof-based recs.
- **"Complete your gear"** — Complementary equipment for same sport.
- **"Frequently bought together"** — Bundling suggestions.
- **"Recently viewed"** — Footer browsing history.
- **"Related products"** — Generic category-based recs.

*Decathlon US uses Shopify. Section titles may vary by region.*

*Source: Direct observation of Decathlon.com; Insider case study (2024-09-16).*

### 2.2 Number of Products Per Section
- "You might also like": 4–8. "Customers also viewed": 4–6. "Frequently bought together": 3–4. "Complete your gear": 4–8.

### 2.3 Presentation Format
**Desktop:** Horizontal carousel with arrows. Cards show image, name, price, star rating, review count. "Frequently bought together" includes combined pricing + "Add all to cart."

**Mobile:** Single-column scroll rows, touch swipe, full-width cards.

### 2.4 Vertical Positioning
1. Banner → 2. Breadcrumb → 3. Gallery + Info → 4. Short description → 5. **"You might also like"** (high) → 6. Product details → 7. Reviews → 8. **"Frequently bought together"** → 9. Recently Viewed → 10. Footer

### 2.5 Selection Logic
1. **Category-Based** — Products from same sport (dominant logic).
2. **Co-Viewing / Co-Purchase** — "Customers also viewed"/"Frequently bought together."
3. **In-House Brand Cross-Selling** — Stays within same passion brand (Quechua, Forclaz, Kiprun).
4. **Insider Smart Recommender** — Micro-segmentation, dynamic attributes, behavioral data.
5. **Manual Merchandising** — Seasonal boosts.
6. **Price Range Affinity** — Same price tier.

### 2.6 Notable UX Patterns
1. Clean, functional cards with ratings for social proof.
2. Bundle pricing with one-click "Add all to cart."
3. Heavily favors in-house brands.
4. Insider personalization: 8% AOV increase via web push, 14% via checkout optimization.

### 2.7 Mobile vs Desktop
- Desktop: multi-column, arrows on carousels.
- Mobile: single-column, swipe, sticky "Add to Cart" button.

*Source: Insider case study (2024-09-16); Decathlon.com observation.*

---

## 3. Foot Locker — PDP Related Product Sections

### 3.1 Section Titles Used
- **"Complete the Look"** — Outfit cross-sell (shoes + apparel/accessories).
- **"Recommended For You"** — Personalized recs on dedicated page.
- **"Customers Also Viewed"** — Social proof suggestions.
- **"You May Also Like"** — Algorithmic recommendations.
- **"More Colors Available"** — Color variant indicator.
- **"Related Pages"** — Category-level navigation links.

*Source: Foot Locker.com observation; Baymard UX case study.*

### 3.2 Number of Products Per Section
- "Complete the Look": 4. "You May Also Like": 4–8. "Customers Also Viewed": 4–8.

### 3.3 Presentation Format
**Desktop:** Horizontal carousels with arrows. Cards show image, brand name, product name, price, star rating, color swatches.

**Mobile:** Single-row horizontal scroll, touch swipe. Baymard ranks Foot Locker mobile PDP in **top 1%** for UX performance.

### 3.4 Vertical Positioning
1. Banner → 2. Breadcrumb → 3. Gallery + Info panel → 4. Shipping info → 5. Product details → 6. **"Complete the Look"** → 7. **"Customers Also Viewed"** → 8. Reviews → 9. **"You May Also Like"** → 10. Recently Viewed → 11. Footer

### 3.5 Selection Logic
1. **Brand Affinity** — Nike → more Nike, Jordan → more Jordan.
2. **Category Matching** — Shoes → matching apparel/accessories.
3. **Co-Purchase Data** — "Customers Also Viewed."
4. **Colorway Coordination** — Outfit-building with color matching.
5. **Price Range Consistency** — Same price tier.
6. **FLX Rewards Personalization** — Member-based recommendations.

### 3.6 Notable UX Patterns
1. Mobile PDP ranked top 1% by Baymard (Dec 2024).
2. "More Colors Available" with direct links to alternate colorways.
3. Size out-of-stock "Notify Me" interface.
4. "Pick Up in Store" option.
5. FLX Rewards integration with member pricing.
6. Color swatches on rec cards.
7. "Shop All" links for extended browsing.

### 3.7 Mobile vs Desktop
- Desktop: multi-column, arrows, full detail panels.
- Mobile: single-column, swipe, sticky CTA. Top 1% UX.

*Source: Baymard UX case study; Foot Locker.com observation.*
