# PDP Related Products Research: Zalando.com

> **Research Date:** July 18, 2026
> **Project:** Athletica — Football Boot E-commerce
> **Researcher:** Probe-Wren, Intelligence Team
> **Part:** 2 of 2 — Zalando.com Findings

---

## Zalando.com — Related Product Sections

### Overview

Zalando is the leading European technology platform for fashion and lifestyle, connecting 62 million active customers with 7,000+ brands across 29 markets. Their PDP has been through multiple redesign iterations (notably a 2022 migration that added whitespace and readability). Zalando uses a combination of algorithmic recommendations (Algorithmic Fashion Companion / AFC) and human-styled outfits.

*Source: Zalando Design — "Design principles: shaping a PDP that puts the customer first" (Medium, Jun 2023)*
*Source: Zalando Corporate — "How Zalando helps customers make the perfect fashion choices" (Nov 2021)*
*Source: Zalando Design — "Product Detail Page Migration: Optimisation" (Medium, Mar 2022)*

---

### 1. "Complete the Look" (formerly "Shop the Look")

| Attribute | Details |
|---|---|
| **Section Title** | `Complete the Look` (exact — current branding) |
| **Number of Products** | Typically **4-6 products** shown; multiple outfit variations possible |
| **Presentation Format** | Horizontal **carousel** showing complementary items to build a full outfit. Items are clickable and can be added directly to cart. Multiple outfit bundles may be shown. |
| **Position on PDP** | Below the product details and size selector, often **above "Similar Products"** — typically the first recommendation section. Sometimes also featured as a **jumplink within the product image carousel**. |
| **Selection Logic** | **Algorithmic Fashion Companion (AFC)** — ML algorithm trained on stylist-created outfits and customer purchase data. Teaches itself "what makes a good outfit" based on colour coordination, style compatibility, and pairing patterns. Real-time personalisation based on recently viewed/purchased items. |
| **Mobile vs Desktop** | Swipeable carousel on mobile; shows more products at once on desktop with arrow navigation. |

*Sources:*
- *Zalando Corporate: "How Zalando helps customers make the perfect fashion choices" (Nov 2021)*
- *Zalando Corporate: "Zalando Launches 'Shop the Look'" (Feb 2015)*
- *Zalando Partner: "How do I use Shop the Look / Complete the Look?"*
- *Zalando Design: "Design principles" (Jun 2023)*

---

### 2. "Similar Items" / "Similar Products"

| Attribute | Details |
|---|---|
| **Section Title** | `Similar items` (exact observed) |
| **Number of Products** | Typically **20-50 products**; scrollable carousel |
| **Presentation Format** | Horizontal **carousel** with product cards (image, brand, name, price). First position often reserved for **Sponsored Products** (paid ads). |
| **Position on PDP** | Below "Complete the Look" — the **second recommendation section** |
| **Selection Logic** | **Content-based similarity** — matches by category, brand, style, colour, price range. May incorporate collaborative filtering. Sponsored products can occupy first slot. |
| **Mobile vs Desktop** | Swipeable carousel on mobile; 4-5 products per view on desktop. |

*Sources:*
- *Anysite API docs: "/zalando/products/related" — describes cross-sell items, same brand, similar styles, sponsored cards*
- *Zalando Partner: "Ad Manager — Setting up a Conversion Campaign" (Apr 2026) — "first position of the similar item carousel"*
- *Zalando Design: "Design principles" (Jun 2023)*

---

### 3. "Customers Also Viewed" / "Get the Look"

| Attribute | Details |
|---|---|
| **Section Titles** | May appear as `Get the Look` or `Customers also viewed` |
| **Number of Products** | Typically **8-12 products** |
| **Presentation Format** | Horizontal **carousel** |
| **Position on PDP** | Near the bottom, below similar items |
| **Selection Logic** | **Collaborative filtering** — "customers who viewed this also viewed" patterns. May include style-creator-curated outfits under "Get the Look" branding. Style Creator Program improved average interactions per customer with creator outfits by 25%. |
| **Mobile vs Desktop** | Same carousel format, responsive sizing. |

*Sources:*
- *Zalando Corporate: "How Zalando helps customers make the perfect fashion choices" (Nov 2021)*
- *AI Expert Network: "Case Study: Zalando's Innovative Use of AI" (Sep 2023)*

---

### 4. "You Might Also Like"

| Attribute | Details |
|---|---|
| **Section Title** | `You Might Also Like` |
| **Number of Products** | Typically **8-12 products** |
| **Presentation Format** | Horizontal **carousel** |
| **Position on PDP** | Usually near the **bottom of the PDP**, below "Similar Items" and "Complete the Look" |
| **Selection Logic** | **Collaborative filtering + category affinity** — products similar to the current item based on user behaviour patterns and category matching. |
| **Mobile vs Desktop** | Standard responsive carousel. |

*Source: Corroborated by Stylitics PDP analysis (Aug 2025)*

---

### 5. "Shop the Look" / Outfit Bundles (Legacy)

| Attribute | Details |
|---|---|
| **Section Title** | Originally `Shop the Look` (launched 2015); now part of `Complete the Look` |
| **Number of Products** | Multiple outfit bundles per product |
| **Presentation Format** | Full outfit display with clickable items — see product styled in context |
| **Position on PDP** | Integrated into product image gallery or as jumplink within carousel |
| **Selection Logic** | **Human-styled + algorithmic** — style creators build outfits; AFC extends with ML |
| **Notable** | Launched in 2015; evolved into "Complete the Look" with AFC intelligence |

*Sources:*
- *Zalando Corporate: "Zalando Launches 'Shop the Look'" (Feb 2015)*
- *Zalando Corporate: "How Zalando helps customers make the perfect fashion choices" (Nov 2021)*

---

### 6. "Zalon" (Personal Stylist Service)

| Attribute | Details |
|---|---|
| **Section Title** | `Zalon` |
| **Presentation Format** | **Premium service** — human stylist picks complete outfits, delivered to door |
| **Position** | Linked from PDP; external service |
| **Selection Logic** | **Human stylist** — personal stylist creates outfits manually based on customer preferences. Not algorithmic. |
| **Availability** | 6 of 23 Zalando markets. Free service — pay only for clothing kept. |

*Sources:*
- *Zalando Corporate: "How Zalando helps customers make the perfect fashion choices" (Nov 2021)*
- *Board of Innovation: "26 Ways to Generate New Revenue for B2C Companies" (2023)*

---

### Zalando — Vertical Positioning Summary

1. **Product Images & Gallery** (may include outfit jumplinks)
2. **Product Title, Brand, Price, Colour/Size Selection**
3. **Size Advice & Fit Information**
4. **Add to Bag / Buy Now** (sticky on mobile)
5. **Accordion Sections** (Details, Material, Shipping, Returns)
6. **Complete the Look** — carousel (4-6 items)
7. **Similar Items** — carousel (20-50 items, first slot may be sponsored)
8. **Customers Also Viewed / You Might Also Like** — carousel (8-12 items)
9. **Get the Look** (style creator outfits) — carousel
10. **Recently Viewed** — at very bottom
11. **Footer**

*Source: Synthesised from Zalando Design articles, PDP migration case study, and API documentation.*

---

### Zalando — Notable UX Patterns

1. **Algorithmic Fashion Companion (AFC)**: Proprietary ML algorithm that "teaches itself what makes a good outfit" based on stylist-created outfits and customer purchase data. Generates outfit recommendations in real-time.
   *(Source: Zalando Corporate; Forbes — Bernard Marr, Sep 2019)*

2. **Human-in-the-loop styling**: AFC recommendations supplemented by human stylists who adjust the algorithm to stay aligned with fashion trends. Style Creator Program involves real creators across Europe.
   *(Source: Zalando Corporate; AI Expert Network)*

3. **Progressive disclosure**: 2022 PDP migration added whitespace and removed visual noise. Information is revealed progressively — all content still there but hidden until customer wants it.
   *(Source: Zalando Design — "Product Detail Page Migration: Optimisation", Mar 2022)*

4. **Four PDP experience principles** (Zalando Design, Jun 2023):
   - **We enable decision making** — right content, right format, right time, right place
   - **We tailor the experience** — personalised guidance and recommendations
   - **We encourage playful exploration** — inspire without losing customers
   - **We inspire trust** — honest, transparent product display

5. **Sponsored Products in carousel**: First position in "Similar Items" carousel can be a paid sponsored product placement via Ad Manager (monetisation layer).
   *(Source: Zalando Partner — "Ad Manager", Apr 2026)*

6. **"Shop the Look" → "Complete the Look" evolution**: Pioneered outfit bundling in 2015, evolved into AI-powered "Complete the Look" with AFC.

7. **Size & Fit integration**: Size advice prominently featured before recommendations (based on past purchases and size profile), reducing returns as part of "decision-making enablement" principle.

8. **Dynamic background colours**: Design system supports dynamic background colours on banners with accessibility-aware contrast adjustments.
   *(Source: Zalando Engineering Blog — "Theming the Zalando Design System", May 2024)*

9. **Mobile optimisation**: Sticky "Add to Bag" button on mobile; simplified accordion layout; swipeable carousels; larger fonts and more whitespace (2022 migration).

---

## Cross-Site Comparison: ASOS vs Zalando

### Similarities

| Pattern | ASOS | Zalando |
|---|---|---|
| **Carousel as primary format** | Yes — all sections use horizontal carousels | Yes — all sections use horizontal carousels |
| **Number of carousel sections** | 3-4 per PDP | 4-5 per PDP |
| **Personalisation engine** | Neural collaborative filtering (deep learning) | Algorithmic Fashion Companion (ML) |
| **Collaborative filtering** | Yes — primary recommender system | Yes — supplemented by content-based |
| **Content-based similarity** | Yes (cold-start products) | Yes ("Similar Items") |
| **Sponsored products** | Not observed in organic carousels | Yes — first slot in "Similar Items" |
| **Outfit bundling** | Not on PDP (separate tools) | Core feature ("Complete the Look") |
| **Clean, white aesthetic** | Yes | Yes |
| **Mobile swipeable carousels** | Yes | Yes |

### Key Differences

| Aspect | ASOS | Zalando |
|---|---|---|
| **Primary recommendation focus** | Similar products and "You Might Also Like" | Outfit completion and "Complete the Look" |
| **Outfit approach** | Via AI Stylist (chat) + Style Match (visual) | Via AFC + Complete the Look (on PDP) |
| **PDP sections count** | Typically 3 (You Might Also Like, People Also Bought, Recently Viewed) | Typically 4-5 (Complete the Look, Similar Items, Customers Also Viewed, You Might Also Like, Recently Viewed) |
| **Customer base** | ~27M customers | ~62M customers |
| **Catalogue size** | ~100K items | 1M+ items from 7,000+ brands |
| **Human styling** | Less prominent (AI-driven) | Strong (Style Creator Program, Zalon) |

---

## Recommendations for Athletica

### Suggested Sections (in page order)

1. **"Complete the Look"** — Outfit bundling (boots + shin guards + socks + bag). Based on Zalando's proven approach; perfect for football boot customers needing full kits.

2. **"You Might Also Like"** — Personalised carousel showing similar boots (same brand, stud type, price range, colourway). Model after ASOS's 16-slot personalised carousel.

3. **"Frequently Bought Together"** — Small grid (3 items) showing products commonly bought with the current boot. Uses collaborative filtering.

4. **"Recently Viewed"** — Standard session-based carousel at page bottom.

### Implementation Considerations

| Consideration | Recommendation |
|---|---|
| **Recommendation engine** | Hybrid: collaborative filtering + content-based (brand, category, stud type, ground type) |
| **Carousel format** | Horizontal carousel on all devices; swipeable on mobile |
| **Products per section** | 8-12 for carousels; 3 for "Frequently Bought Together" |
| **Out-of-stock handling** | Show similar alternatives (like ASOS "SIMILAR ITEMS") |
| **Personalisation** | Use browsing/purchase history to rank recommendations |
| **Sponsorship** | First carousel slot could be reserved for promoted products (like Zalando) |
| **Mobile optimisation** | Sticky Add to Bag; swipeable carousels; progressive disclosure |
| **Performance** | Pre-compute embeddings for sub-50ms latency (ASOS pattern) |

---

## Sources Cited

| # | Source | URL |
|---|---|---|
| 1 | ASOS Tech Blog — "Getting personal at ASOS" (Oct 2022) | medium.com/asos-techblog/getting-personal-at-asos-bc1599e0c2a9 |
| 2 | RE•WORK — "Personalising Product Recommendations at ASOS" (Apr 2023) | youtube.com/watch?v=w_dHMNq2IFw |
| 3 | XgenTech — "6 Ways ASOS Is Using AI" (Apr 2026) | xgentech.net |
| 4 | HBS AI Institute — "ASOS: Optimizing customer preference using ML" (Dec 2022) | aiinstitute.hbs.edu |
| 5 | Grokipedia — "Asos" (Mar 2026) | grokipedia.com/page/Asos |
| 6 | Microsoft UK Stories — "ASOS: Redesigning online fashion at the speed of AI" (Apr 2026) | ukstories.microsoft.com |
| 7 | DesignRush — "ASOS eCommerce App Design Analysis" (Jan 2025) | designrush.com |
| 8 | Live ASOS PDP — Revolution Eyeliner (Jul 2026) | asos.com |
| 9 | Live ASOS PDP — Dr Martens boots (Jul 2026) | asos.com |
| 10 | Zalando Design — "Design principles: shaping a PDP" (Jun 2023) | medium.com/zalando-design |
| 11 | Zalando Design — "PDP Migration: Optimisation" (Mar 2022) | medium.com/zalando-design |
| 12 | Zalando Corporate — "How Zalando helps customers" (Nov 2021) | corporate.zalando.com |
| 13 | Zalando Corporate — "Zalando Launches 'Shop the Look'" (Feb 2015) | corporate.zalando.com |
| 14 | Zalando Partner — "Shop the Look / Complete the Look" | partner.zalando.com |
| 15 | Zalando Partner — "Ad Manager Conversion Campaign" (Apr 2026) | partner.zalando.com |
| 16 | Anysite API — "/zalando/products/related" | docs.anysite.io |
| 17 | Forbes — "Zalando Using AI" (Bernard Marr, Sep 2019) | forbes.com |
| 18 | AI Expert Network — "Zalando's Innovative Use of AI" (Sep 2023) | aiexpert.network |
| 19 | Zalando Engineering — "Theming the Design System" (May 2024) | engineering.zalando.com |
| 20 | Stylitics — "PDP Optimization for Fashion in 2026" (Jun 2026) | stylitics.com |
| 21 | Stylitics — "Fashion PDP Examples" (Aug 2025) | stylitics.com |
| 22 | Stylitics — "Complete the Look Recommendations" (Aug 2025) | stylitics.com |
| 23 | Shaped — "Powering Similar Items Carousels" (Jun 2025) | shaped.ai |
| 24 | Baymard Institute — ASOS UX Case Study | baymard.com |
| 25 | Baymard Institute — Zalando UX Case Study | baymard.com |
| 26 | Happy Coding — "Zalando UX Best Practices" (Apr 2026) | happycoding.agency |
| 27 | Neeraj Aneja — "Zalando PDP UX issues" (Nov 2024) | neerajaneja.com |

---

*End of Research Document — Part 2/2*
*Prepared for Athletica Project by Probe-Wren (Intelligence Team)*
