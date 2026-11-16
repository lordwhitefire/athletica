# PDP Related Products Research: ASOS.com

> **Research Date:** July 18, 2026
> **Project:** Athletica — Football Boot E-commerce
> **Researcher:** Probe-Wren, Intelligence Team
> **Part:** 1 of 2 — ASOS.com Findings

---

## ASOS.com — Related Product Sections

### Overview

ASOS is a UK-based fashion e-tailer serving 26.7 million customers across 200+ markets. Their PDP is known for clean, white layouts with multiple related-product carousels and recommendation modules positioned below the product details. ASOS uses a deep-learning-based personalisation system (neural collaborative filtering) that generates billions of personalised product recommendations daily.

*Source: ASOS Tech Blog — "Getting personal at ASOS" (Medium, Oct 2022)*
*Source: Grokipedia — "Asos" (Mar 2026)*
*Source: RE•WORK presentation — "Personalising Product Recommendations at ASOS" (YouTube, Apr 2023)*

---

### 1. "YOU MIGHT ALSO LIKE"

| Attribute | Details |
|---|---|
| **Section Title** | `YOU MIGHT ALSO LIKE` (exact observed) |
| **Number of Products** | **16 products** in the carousel (per ASOS Tech Blog); observed up to 18 products on live pages |
| **Presentation Format** | Horizontal **carousel** with left/right arrow navigation |
| **Position on PDP** | Below the product image gallery, description, and Add to Bag button — generally the **first recommendation carousel** after the main product info |
| **Selection Logic** | **Personalised neural collaborative filtering** — takes a weighted average of the customer embedding and the hero (current) product embedding, then calculates similarity against a candidate set filtered by business rules (same category). Uses deep learning embeddings from customer interaction data (views, purchases, add-to-bag, save-for-later). |
| **Mobile vs Desktop** | On mobile: carousel adapts to swipeable horizontal scroll, typically showing 1.5-2 products at a time. On desktop: shows 4-5 products at once with navigation arrows. Content remains the same. |

*Sources:*
- *ASOS Tech Blog: "Getting personal at ASOS" (Medium, Oct 2022) — states "In our 'You Might Also Like' carousel we only have 16 slots"*
- *Live PDP observation: ASOS Dr Martens PDP (Jul 2026) — confirmed "SIMILAR ITEMS" carousel with 18 items*
- *Live PDP observation: ASOS Revolution Eyeliner PDP (Jul 2026) — confirmed "YOU MIGHT ALSO LIKE" section*
- *XgenTech: "6 Ways ASOS Is Using AI to Redefine Ecommerce" (Apr 2026)*

---

### 2. "SIMILAR ITEMS"

| Attribute | Details |
|---|---|
| **Section Title** | `SIMILAR ITEMS` (exact observed) |
| **Number of Products** | Typically **10-18 products** (observed 18 on a boots PDP) |
| **Presentation Format** | Horizontal **carousel** with arrow navigation |
| **Position on PDP** | Appears in the same area as "YOU MIGHT ALSO LIKE" — can replace or follow it depending on product category. On some products, "SIMILAR ITEMS" appears when the product is out of stock. |
| **Selection Logic** | Content-based similarity — products matched by brand, category, style attributes, colour, and price range. May also use collaborative filtering signals. |
| **Mobile vs Desktop** | Same carousel format, responsive sizing. |

*Sources:*
- *Live PDP observation: ASOS Dr Martens Quad 14 eye western boots PDP (Jul 2026) — out of stock product; "SIMILAR ITEMS" carousel shown*
- *XgenTech: "6 Ways ASOS Is Using AI to Redefine Ecommerce" (Apr 2026)*

---

### 3. "People also bought"

| Attribute | Details |
|---|---|
| **Section Title** | `People also bought` (exact observed, lowercase 'p') |
| **Number of Products** | Typically **3 products**, sometimes more in a small grid |
| **Presentation Format** | Small **inline grid** (not a carousel) — usually 1×3 or 1×4 products with prices |
| **Position on PDP** | Below the "YOU MIGHT ALSO LIKE" carousel, at the very bottom of the PDP before the footer |
| **Selection Logic** | **Collaborative filtering / "Frequently Bought Together"** — based on products that other customers have purchased together with the current item. Association rule mining on purchase data. |
| **Mobile vs Desktop** | Stacks to a single column on mobile; shows 3-4 items in a row on desktop. |

*Sources:*
- *Live PDP observation: ASOS Revolution Eyeliner PDP (Jul 2026) — confirmed "People also bought" section with 3 products*
- *XgenTech: "6 Ways ASOS Is Using AI to Redefine Ecommerce" (Apr 2026)*
- *Alibaba.com: "AI Fashion Stylists on Apps Like Zara or ASOS" (Feb 2026)*

---

### 4. "Recently Viewed"

| Attribute | Details |
|---|---|
| **Section Title** | `Recently Viewed` (exact observed) |
| **Number of Products** | Typically **5-8 products**, scrollable |
| **Presentation Format** | Horizontal **carousel** with thumbnails |
| **Position on PDP** | Usually at the **very bottom of the PDP**, below all other recommendation modules, before the footer |
| **Selection Logic** | Session-based — items the specific user has previously viewed. Stored in browser cookies or user account. |
| **Mobile vs Desktop** | Swipeable carousel on mobile; arrow-navigated on desktop. |

---

### 5. "Your Edit" / "For You" (Homepage/Feed)

| Attribute | Details |
|---|---|
| **Section Titles** | `Your Edit`, `We found these for you in the sale`, `Similar vibes to your saved items` |
| **Number of Products** | Varies — 20+ products in scrollable feeds |
| **Presentation Format** | **Infinite scroll feed** of product cards with images and prices |
| **Position** | Primarily on the **homepage and "For You" tab** in the app; not typically on the PDP itself |
| **Selection Logic** | **Highly personalised** — uses customer embeddings from neural collaborative filtering. Profile Builder feature (36 sample products) helps learn style preferences via clustering (36 clusters, one product per cluster). |
| **Mobile vs Desktop** | Optimised for mobile infinite scroll; grid layout on desktop |

*Sources:*
- *ASOS Tech Blog: "Getting personal at ASOS" (Medium, Oct 2022) — describes "For You" tab with personalised carousels*
- *Harvard Business School AI Institute: "ASOS: Optimizing customer preference using ML" (Dec 2022) — describes Profile Builder and 36-product clustering*
- *XgenTech: "6 Ways ASOS Is Using AI to Redefine Ecommerce" (Apr 2026)*

---

### 6. "Style Match" (Visual Search) & "AI Stylist" (Conversational)

| Section | Description | Selection Logic |
|---|---|---|
| **Style Match** | Visual search — upload an image, AI finds similar products via computer vision | Deep learning on product images for visual similarity |
| **AI Stylist** | Conversational chat interface (Azure OpenAI) — understands natural language queries like "a wedding in May" or "city break outfit" | Generative AI + personalisation; builds on customer embeddings |

*Sources:*
- *Grokipedia: "Asos" (Mar 2026) — describes AI-powered Style Match visual search*
- *Microsoft UK Stories: "ASOS: Redesigning online fashion at the speed of AI" (Apr 2026)*
- *Varshith R: "Case Study: AI-Powered Personalization at ASOS with Azure" (2025)*

---

### ASOS — Vertical Positioning Summary

1. **Product Images & Gallery**
2. **Product Title, Price, Colour/Size Selection, Add to Bag**
3. **Size & Fit / Product Details** (accordion)
4. **YOU MIGHT ALSO LIKE** — carousel (16 products)
5. **SIMILAR ITEMS** — carousel (10-18 products) [conditionally shown, especially for out-of-stock]
6. **People also bought** — inline grid (3 products)
7. **Recently Viewed** — carousel (at very bottom)
8. **Footer**

*Note: Exact ordering varies slightly by product category and stock status.*

---

### ASOS — Notable UX Patterns

1. **Personalisation at scale**: Neural collaborative filtering (TensorFlow 2, Azure ML) for 100K+ products and 26M customers. Embeddings pre-computed for sub-50ms latency.

2. **Cold-start handling**: New products without interaction data get embeddings from textual descriptions and images via a deep neural network (content-based filtering).

3. **16-slot constraint**: "You Might Also Like" only has 16 slots, making ranking quality critical. Uses weighted average of customer + hero product embeddings.

4. **Clean, white interface**: Minimal white background with high-quality imagery — recommendation carousels maintain this aesthetic with small product cards, prices, and brand names.

5. **No "Complete the Look" on PDP**: ASOS does NOT use an outfit-bundling section on PDPs. Instead, outfit recommendations go through "AI Stylist" (chat) and "Style Match" (visual search).

6. **Profile Builder**: New customers take a style quiz (36 products from 36 clusters) to build their taste profile, feeding into all recommendation modules.

7. **Mobile-first**: App and mobile web use the same recommendation engine with swipe-based carousel interactions and simplified card layouts.

*Sources:*
- *ASOS Tech Blog (Oct 2022)*
- *Harvard Business School AI Institute (Dec 2022)*
- *DesignRush: "ASOS eCommerce App Design Analysis" (Jan 2025)*
