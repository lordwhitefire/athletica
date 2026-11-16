# PDP Related Products: Executive Summary

> **Quick reference** for Athletica. Full details in:
> - `research/pdp-asos-related-products.md` (ASOS findings)
> - `research/pdp-zalando-related-products.md` (Zalando findings)

## ASOS.com — Key Findings

**Sections found:**
1. **YOU MIGHT ALSO LIKE** — 16-slot personalised carousel (neural collaborative filtering)
2. **SIMILAR ITEMS** — 10-18 product carousel (shown especially for out-of-stock)
3. **People also bought** — 3-product inline grid (frequently bought together)
4. **Recently Viewed** — 5-8 product carousel at bottom
5. **Your Edit / For You** — homepage personalised feeds
6. **Style Match** — visual search tool
7. **AI Stylist** — conversational AI (Azure OpenAI)

**Key takeaway:** ASOS uses deep learning (TensorFlow 2, Azure ML) for all recommendations. No "Complete the Look" on PDP — that's handled through chat/visual search instead.

## Zalando.com — Key Findings

**Sections found:**
1. **Complete the Look** — 4-6 item outfit carousel (Algorithmic Fashion Companion ML)
2. **Similar Items** — 20-50 product carousel (content-based; first slot sponsored)
3. **Customers Also Viewed / Get the Look** — 8-12 product carousel (collaborative filtering)
4. **You Might Also Like** — 8-12 product carousel
5. **Shop the Look** (legacy) — outfit bundles in image gallery
6. **Zalon** — human stylist service (external)

**Key takeaway:** Zalando pioneered outfit bundling. Their AFC algorithm combines human-stylist knowledge with ML. Sponsored products in recommendation slots.

## Cross-Site Comparison

| Aspect | ASOS | Zalando |
|---|---|---|
| Primary focus | Similar products | Outfit completion |
| Tech | Neural CF (TensorFlow) | AFC (proprietary ML) |
| PDP sections | 3-4 | 4-5 |
| Sponsored slots | No | Yes |
| Human styling | Minimal | Strong (Style Creator Program) |
| Customer base | ~27M | ~62M |

## Recommendations for Athletica

1. **"Complete the Look"** — outfit bundling (boots + accessories)
2. **"You Might Also Like"** — personalised boot carousel
3. **"Frequently Bought Together"** — 3-item grid
4. **"Recently Viewed"** — session-based footer carousel

**27 sources cited** across both research files.
