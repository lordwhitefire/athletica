# Athletica Rollout 1 — Pixel-Match Product Details UI Patch

## Purpose

This patch updates the existing Rollout 1 Product Details implementation so the rendered page closely mirrors the supplied reference image.

Reference characteristics to preserve:

- Black canvas: `#000000`
- Lemon accent: `#d1fd40`
- White typography only
- No white UI surfaces
- No customer navigation
- No customer footer
- Minimal centered ATHLETICA header
- Maximum composition width: **1440px**
- Centered layout at every viewport
- No width expansion at 1680px / 1920px / 2560px+
- Editorial product-story presentation
- Hero split layout
- Large product image
- Four thumbnail images
- Lemon CTA
- Story + benefit-card section
- Technical details + gallery section
- Final “What’s inside the box” + collection strip

> Apply this patch to the existing Rollout 1 implementation. The CSS below is deliberately scoped to the Product Details page and can replace the current Product Details styling.

---

# 1. Replace `ProductDetailsPage.tsx`

```tsx
import { useState } from "react";
import "./rollout1-pixel-match.css";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  status: "published" | "unpublished";
  gender: string;
  color: string;
  price: number;
  collection: string;
  tagline: string;
  subtitle: string;
  intro: string;
  keyBenefits: { title: string; text: string; icon: "boot" | "bolt" | "target" | "speed" }[];
  technicalDetails: { label: string; value: string }[];
  images: string[];
};

const product: Product = {
  id: "GW8470",
  slug: "adidas-x-speedportal-3-ll-fg-light-blue",
  name: "X/SPEEDPORTAL.3-LL-FG",
  brand: "ADIDAS",
  status: "published",
  gender: "Unisex",
  color: "Light Blue Multicolor",
  price: 39.99,
  collection: "Al Rihla Pack",
  tagline: "Born from speed. Worn by creators.",
  subtitle:
    "Laceless football boots adidas FG for firm natural grass or latest-generation artificial turf - light blue multicolor",
  intro:
    "The adidas X Speedportal.3 LL FG are laceless speed boots from the iconic Al Rihla collection (2022 FIFA World Cup Qatar), built for players who live to accelerate. Its laceless construction wraps your foot in a secure, sock-like fit, delivering a clean striking surface and explosive freedom on firm ground. Lightweight. Fast. Unstoppable.",
  keyBenefits: [
    {
      title: "LACELESS SECURE FIT",
      text: "Elastic textile upper hugs the foot for a sock-like feel and clean striking area.",
      icon: "boot",
    },
    {
      title: "SUPERIOR TRACTION",
      text: "FG soleplate with arrow-shaped studs provides grip on natural and long-pile artificial grass.",
      icon: "bolt",
    },
    {
      title: "ENHANCED BALL CONTROL",
      text: "Texturized finish on the upper improves grip and precision during fast play.",
      icon: "target",
    },
    {
      title: "LIGHTWEIGHT SPEED DESIGN",
      text: "Built for wingers and forwards who prioritize acceleration and quick changes of direction.",
      icon: "speed",
    },
  ],
  technicalDetails: [
    { label: "ADJUSTMENT", value: "Laceless" },
    { label: "RANGE", value: "Entry / League level (third tier in the X Speedportal line)" },
    { label: "SOLE TYPE", value: "FG (Firm Ground)" },
    { label: "UPPER MATERIAL", value: "Textile with elastic textile" },
    { label: "TRACTION", value: "FG (Firm Ground)" },
    { label: "GENDER", value: "Unisex" },
    { label: "COLOR", value: "Light Blue Multicolor" },
  ],
  images: [
    "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1600&q=90",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=90",
  ],
};

function BenefitIcon({ type }: { type: Product["keyBenefits"][number]["icon"] }) {
  if (type === "bolt") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M18.8 2 7 18h8.2L13.5 30 26 13.4h-8.3L18.8 2Z" />
      </svg>
    );
  }

  if (type === "target") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="10.5" />
        <circle cx="16" cy="16" r="5" />
        <path d="M16 2v6M16 24v6M2 16h6M24 16h6" />
      </svg>
    );
  }

  if (type === "speed") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 10h17M3 16h23M5 22h17" />
        <path d="m24 7 5 3-5 3M27 13l3 3-3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 25c4-2 5-7 5-13V7l6-2 7 5-2 8c-1 5-5 9-10 10-3 1-5-1-6-3Z" />
      <path d="M12 8c4 4 8 5 13 2" />
    </svg>
  );
}

export default function ProductDetailsPage() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <main className="pixel-product-page">
      <header className="pixel-product-header">
        <div className="pixel-product-header__inner">
          <div className="pixel-logo">ATHLETICA</div>
        </div>
      </header>

      <article className="pixel-product-shell">
        <section className="pixel-hero">
          <div className="pixel-gallery">
            <div className="pixel-main-image">
              <img
                src={product.images[activeImage]}
                alt={product.name}
              />
              <div className="pixel-image-counter">
                {activeImage + 1} / {product.images.length}
              </div>
            </div>

            <div className="pixel-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`pixel-thumbnail ${
                    activeImage === index ? "is-active" : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-product-summary">
            <div className="pixel-brand">{product.brand}</div>

            <h1>{product.name}</h1>

            <div className="pixel-tagline">
              LACELESS SPEED. CLEAN STRIKES.
            </div>

            <p className="pixel-subtitle">{product.subtitle}</p>

            <div className="pixel-price">
              €{product.price.toFixed(2)}
            </div>

            <div className="pixel-meta">
              <span>{product.gender}</span>
              <i>•</i>
              <span>{product.color}</span>
            </div>

            <div className="pixel-cta-rule" />

            <button className="pixel-shop-button" type="button">
              <span>SHOP PRODUCT</span>
              <span className="pixel-arrow" aria-hidden="true">
                ↗
              </span>
            </button>

            <p className="pixel-retailer-note">
              Availability and final pricing may vary at the retailer.
            </p>
          </div>
        </section>

        <section className="pixel-story-benefits">
          <div className="pixel-story">
            <div className="pixel-section-label">THE STORY</div>
            <h2>{product.tagline}</h2>
            <p>{product.intro}</p>
          </div>

          <div className="pixel-benefits">
            <div className="pixel-section-label">KEY BENEFITS</div>

            <div className="pixel-benefit-grid">
              {product.keyBenefits.map((benefit) => (
                <article className="pixel-benefit-card" key={benefit.title}>
                  <div className="pixel-benefit-icon">
                    <BenefitIcon type={benefit.icon} />
                  </div>

                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pixel-details-gallery">
          <div className="pixel-details">
            <div className="pixel-section-label">TECHNICAL DETAILS</div>

            <div className="pixel-spec-list">
              {product.technicalDetails.map((detail) => (
                <div className="pixel-spec-row" key={detail.label}>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="pixel-product-gallery">
            <div className="pixel-section-label">PRODUCT GALLERY</div>

            <div className="pixel-gallery-grid">
              {product.images.slice(1).map((image, index) => (
                <button
                  type="button"
                  className="pixel-gallery-item"
                  key={image}
                  onClick={() => setActiveImage(index + 1)}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 2}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pixel-bottom-strip">
          <div className="pixel-bottom-item">
            <div className="pixel-bottom-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <path d="M4 13 20 4l16 9-16 9L4 13Z" />
                <path d="M4 13v17l16 8 16-8V13M20 22v16" />
                <path d="m28 9-5 3 6 4 5-3" />
              </svg>
            </div>

            <div>
              <div className="pixel-bottom-label">WHAT'S INSIDE THE BOX</div>
              <p>1 x Pair of adidas X Speedportal.3 LL FG</p>
              <p>Care instructions leaflet</p>
            </div>
          </div>

          <div className="pixel-bottom-item">
            <div className="pixel-bottom-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" />
                <path d="M5 20h30M20 5c5 5 7 10 7 15s-2 10-7 15M20 5c-5 5-7 10-7 15s2 10 7 15M8 11h24M8 29h24" />
              </svg>
            </div>

            <div>
              <div className="pixel-bottom-label">COLLECTION</div>
              <p>Al Rihla Pack</p>
              <p>2022 FIFA World Cup Qatar™</p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
```

---

# 2. Add `rollout1-pixel-match.css`

```css
:root {
  --pixel-black: #000000;
  --pixel-lemon: #d1fd40;
  --pixel-white: #ffffff;
  --pixel-muted: #a5a5a5;
  --pixel-line: #303030;
  --pixel-panel: #070707;
  --pixel-max: 1440px;
}

/* =========================================================
   RESET
   ========================================================= */

.pixel-product-page,
.pixel-product-page *,
.pixel-product-page *::before,
.pixel-product-page *::after {
  box-sizing: border-box;
}

.pixel-product-page {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  background: var(--pixel-black);
  color: var(--pixel-white);
  font-family:
    Inter,
    Arial,
    Helvetica,
    sans-serif;
  overflow-x: hidden;
}

.pixel-product-page button {
  font: inherit;
}

.pixel-product-page img {
  display: block;
  max-width: 100%;
}

.pixel-product-page button {
  cursor: pointer;
}

/* =========================================================
   HEADER
   Reference:
   - very small centered logo
   - thin lemon rule
   - no nav
   ========================================================= */

.pixel-product-header {
  width: 100%;
  background: var(--pixel-black);
}

.pixel-product-header__inner {
  width: min(calc(100% - 104px), var(--pixel-max));
  height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid var(--pixel-lemon);
}

.pixel-logo {
  color: var(--pixel-lemon);
  font-size: 18px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.24em;
  transform: translateX(0.12em);
}

/* =========================================================
   GLOBAL 1440PX COMPOSITION
   ========================================================= */

.pixel-product-shell {
  width: min(calc(100% - 104px), var(--pixel-max));
  margin-inline: auto;
}

/*
  IMPORTANT:
  This is the only desktop width boundary.

  Never replace 1440px with 1560px, 1680px, 1920px, etc.
  At wider viewports the entire composition remains centered.
*/

@media (min-width: 1440px) {
  .pixel-product-shell,
  .pixel-product-header__inner {
    width: 1440px;
    max-width: 1440px;
  }
}

/* =========================================================
   HERO
   ========================================================= */

.pixel-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(390px, 1fr);
  gap: 34px;
  padding: 40px 0 36px;
  border-bottom: 1px solid var(--pixel-lemon);
}

.pixel-gallery {
  min-width: 0;
}

.pixel-main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #111111;
}

.pixel-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.pixel-image-counter {
  display: none;
}

.pixel-thumbnails {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-top: 10px;
}

.pixel-thumbnail {
  width: 100%;
  aspect-ratio: 1.18 / 1;
  padding: 0;
  border: 1px solid transparent;
  background: #111111;
  overflow: hidden;
}

.pixel-thumbnail.is-active {
  border-color: var(--pixel-lemon);
}

.pixel-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pixel-product-summary {
  min-width: 0;
  padding: 19px 0 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.pixel-brand,
.pixel-section-label,
.pixel-bottom-label {
  color: var(--pixel-lemon);
  font-weight: 700;
  letter-spacing: 0.035em;
}

.pixel-brand {
  font-size: 13px;
  line-height: 1;
  margin-bottom: 18px;
}

.pixel-product-summary h1 {
  max-width: 100%;
  margin: 0;
  color: var(--pixel-white);
  font-size: clamp(42px, 4.8vw, 70px);
  line-height: 0.91;
  font-weight: 900;
  letter-spacing: -0.055em;
  text-transform: uppercase;
}

.pixel-tagline {
  color: var(--pixel-lemon);
  margin-top: 20px;
  font-size: 17px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.pixel-subtitle {
  max-width: 590px;
  margin: 18px 0 0;
  color: var(--pixel-white);
  font-size: 14px;
  line-height: 1.48;
}

.pixel-price {
  margin-top: 24px;
  color: var(--pixel-lemon);
  font-size: 32px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.pixel-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--pixel-white);
  font-size: 12px;
}

.pixel-meta i {
  color: var(--pixel-lemon);
  font-style: normal;
}

.pixel-cta-rule {
  width: 100%;
  height: 1px;
  margin-top: 20px;
  background: var(--pixel-lemon);
}

.pixel-shop-button {
  width: 100%;
  min-height: 57px;
  margin-top: 24px;
  padding: 0 20px;
  border: 0;
  background: var(--pixel-lemon);
  color: var(--pixel-black);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.01em;
}

.pixel-shop-button:hover {
  filter: brightness(1.05);
}

.pixel-arrow {
  position: absolute;
  right: 19px;
  top: 50%;
  transform: translateY(-52%);
  font-size: 30px;
  line-height: 1;
  font-weight: 400;
}

.pixel-retailer-note {
  margin: 16px 0 0;
  color: var(--pixel-muted);
  font-size: 10px;
  line-height: 1.3;
}

/* =========================================================
   STORY + BENEFITS
   ========================================================= */

.pixel-story-benefits {
  display: grid;
  grid-template-columns: 0.98fr 1.12fr;
  gap: 46px;
  padding: 31px 0 28px;
  border-bottom: 1px solid var(--pixel-lemon);
}

.pixel-section-label {
  font-size: 13px;
  line-height: 1;
}

.pixel-story h2 {
  margin: 17px 0 13px;
  color: var(--pixel-white);
  font-size: 15px;
  line-height: 1.35;
  font-weight: 500;
}

.pixel-story p {
  max-width: 500px;
  margin: 0;
  color: var(--pixel-white);
  font-size: 13px;
  line-height: 1.56;
}

.pixel-benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin-top: 15px;
}

.pixel-benefit-card {
  min-height: 124px;
  border: 1px solid #4a4a4a;
  background: var(--pixel-black);
  padding: 15px 13px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
}

.pixel-benefit-icon {
  width: 29px;
  height: 29px;
  color: var(--pixel-lemon);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.pixel-benefit-icon svg {
  width: 29px;
  height: 29px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pixel-benefit-card h3 {
  margin: 1px 0 9px;
  color: var(--pixel-white);
  font-size: 10px;
  line-height: 1.15;
  font-weight: 700;
}

.pixel-benefit-card p {
  margin: 0;
  color: #bcbcbc;
  font-size: 10px;
  line-height: 1.42;
}

/* =========================================================
   TECHNICAL DETAILS + PRODUCT GALLERY
   ========================================================= */

.pixel-details-gallery {
  display: grid;
  grid-template-columns: 0.72fr 1.28fr;
  gap: 42px;
  padding: 20px 0 29px;
  border-bottom: 1px solid var(--pixel-lemon);
}

.pixel-spec-list {
  margin-top: 14px;
  border-top: 1px solid #353535;
}

.pixel-spec-row {
  min-height: 32px;
  display: grid;
  grid-template-columns: 0.86fr 1.14fr;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid #353535;
}

.pixel-spec-row span {
  color: var(--pixel-white);
  font-size: 9px;
  line-height: 1.2;
  font-weight: 500;
}

.pixel-spec-row strong {
  color: var(--pixel-white);
  font-size: 9px;
  line-height: 1.25;
  font-weight: 500;
}

.pixel-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  margin-top: 14px;
}

.pixel-gallery-item {
  width: 100%;
  aspect-ratio: 1 / 0.96;
  padding: 0;
  border: 1px solid #353535;
  background: #111111;
  overflow: hidden;
}

.pixel-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pixel-gallery-item:hover {
  border-color: var(--pixel-lemon);
}

/* =========================================================
   BOTTOM INFORMATION STRIP
   ========================================================= */

.pixel-bottom-strip {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 70px;
  padding: 24px 0 28px;
  border-bottom: 1px solid var(--pixel-lemon);
}

.pixel-bottom-item {
  display: grid;
  grid-template-columns: 43px minmax(0, 1fr);
  gap: 13px;
  align-items: start;
}

.pixel-bottom-icon {
  width: 35px;
  height: 35px;
  color: var(--pixel-lemon);
}

.pixel-bottom-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pixel-bottom-label {
  font-size: 12px;
  line-height: 1.15;
  margin-bottom: 13px;
}

.pixel-bottom-item p {
  margin: 0 0 5px;
  color: var(--pixel-white);
  font-size: 11px;
  line-height: 1.3;
}

/* =========================================================
   TABLET
   ========================================================= */

@media (max-width: 900px) {
  .pixel-product-shell,
  .pixel-product-header__inner {
    width: min(calc(100% - 48px), 1440px);
  }

  .pixel-hero {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .pixel-product-summary {
    padding-top: 0;
  }

  .pixel-product-summary h1 {
    max-width: 850px;
    font-size: clamp(48px, 8vw, 72px);
  }

  .pixel-story-benefits,
  .pixel-details-gallery {
    grid-template-columns: 1fr;
  }

  .pixel-story p {
    max-width: 850px;
  }
}

/* =========================================================
   PHONE
   ========================================================= */

@media (max-width: 600px) {
  .pixel-product-header__inner {
    width: calc(100% - 32px);
    height: 62px;
  }

  .pixel-product-shell {
    width: calc(100% - 32px);
  }

  .pixel-logo {
    font-size: 15px;
    letter-spacing: 0.2em;
  }

  .pixel-hero {
    padding-top: 22px;
    padding-bottom: 28px;
    gap: 25px;
  }

  .pixel-main-image {
    aspect-ratio: 1 / 0.86;
  }

  .pixel-thumbnails {
    gap: 6px;
    margin-top: 7px;
  }

  .pixel-product-summary h1 {
    font-size: clamp(40px, 13vw, 58px);
    line-height: 0.91;
  }

  .pixel-brand {
    margin-bottom: 13px;
  }

  .pixel-tagline {
    margin-top: 17px;
    font-size: 14px;
  }

  .pixel-subtitle {
    font-size: 12px;
    line-height: 1.5;
  }

  .pixel-price {
    margin-top: 21px;
    font-size: 29px;
  }

  .pixel-shop-button {
    min-height: 54px;
  }

  .pixel-story-benefits {
    gap: 30px;
    padding-top: 28px;
  }

  .pixel-benefit-grid {
    grid-template-columns: 1fr;
  }

  .pixel-benefit-card {
    min-height: 105px;
  }

  .pixel-details-gallery {
    gap: 31px;
    padding-top: 22px;
  }

  .pixel-spec-row {
    min-height: 39px;
  }

  .pixel-gallery-grid {
    grid-template-columns: 1fr 1fr;
  }

  .pixel-gallery-item:last-child {
    grid-column: 1 / -1;
  }

  .pixel-bottom-strip {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-bottom: 34px;
  }
}

/* =========================================================
   VERY SMALL PHONES
   ========================================================= */

@media (max-width: 390px) {
  .pixel-product-shell,
  .pixel-product-header__inner {
    width: calc(100% - 24px);
  }

  .pixel-product-summary h1 {
    font-size: 39px;
  }

  .pixel-benefit-card {
    grid-template-columns: 31px minmax(0, 1fr);
    padding: 13px 10px;
  }

  .pixel-benefit-icon {
    width: 25px;
    height: 25px;
  }

  .pixel-benefit-icon svg {
    width: 25px;
    height: 25px;
  }
}

/* =========================================================
   WIDE DESKTOP — DO NOT EXPAND THE COMPOSITION
   ========================================================= */

/*
  Deliberately no 1680px / 1920px / 2560px width rules.

  The shell is already capped at 1440px.
  Larger screens receive additional black breathing room only.
*/

@media (min-width: 1441px) {
  .pixel-product-shell,
  .pixel-product-header__inner {
    width: 1440px;
    max-width: 1440px;
  }
}
```

---

# 3. Remove the old Product Details CSS

The old Product Details rules in `rollout1.css` can conflict with this patch.

Remove or stop importing the following old Product Details selectors:

```text
.product-page
.product-header
.product-header__brand
.product-shell
.product-hero
.product-gallery
.product-gallery__main
.product-gallery__counter
.product-gallery__thumbs
.gallery-thumb
.product-summary
.product-summary__brand
.product-summary__meta
.product-price
.product-subtitle
.product-collection
.shop-button
.product-note
.product-section
.section-label
.product-description
.benefits-grid
.benefit-card
.benefit-number
.spec-table
.spec-row
.large-gallery
.large-gallery__item
```

The admin and analytics styles from `rollout1.css` can remain.

---

# 4. Route remains unchanged

```tsx
import ProductDetailsPage from "./ProductDetailsPage";

if (window.location.pathname.startsWith("/product/")) {
  return <ProductDetailsPage />;
}
```

---

# 5. Pixel-match layout measurements

The supplied reference is approximately 1122px wide. At that reference width the visual composition should behave approximately like this:

```text
Viewport
┌──────────────────────────────────────────────────────────────┐
│                         ATHLETICA                             │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌─────────────────────────┐   ADIDAS                        │
│  │                         │   X/SPEEDPORTAL.3-LL-FG         │
│  │                         │   LACELESS SPEED. CLEAN STRIKES │
│  │     PRODUCT IMAGE       │   subtitle                      │
│  │                         │   €39.99                        │
│  │                         │   Unisex • Light Blue Multicolor│
│  └─────────────────────────┘   ───────────────────────────── │
│  [thumb] [thumb] [thumb] [thumb]   SHOP PRODUCT ↗           │
│                                                              │
│──────────────────────────────────────────────────────────────│
│ THE STORY                         KEY BENEFITS                │
│ story copy                       ┌────────┐ ┌────────┐       │
│                                  │ benefit│ │ benefit│       │
│                                  └────────┘ └────────┘       │
│                                  ┌────────┐ ┌────────┐       │
│                                  │ benefit│ │ benefit│       │
│                                  └────────┘ └────────┘       │
│──────────────────────────────────────────────────────────────│
│ TECHNICAL DETAILS                PRODUCT GALLERY             │
│ ───────────────                  ┌────┐ ┌────┐ ┌────┐       │
│ adjustment                       │img │ │img │ │img │       │
│ range                            └────┘ └────┘ └────┘       │
│ sole type                                                     │
│ upper material                                                │
│ traction                                                       │
│ gender                                                         │
│ color                                                          │
│──────────────────────────────────────────────────────────────│
│ [box icon] WHAT'S INSIDE THE BOX       [globe] COLLECTION    │
│           product details                       Al Rihla Pack │
│──────────────────────────────────────────────────────────────│
```

---

# 6. Responsive behavior

## 1440px+

Use:

```css
width: 1440px;
max-width: 1440px;
margin-inline: auto;
```

Never allow the customer-facing composition to become:

```text
1560px
1680px
1800px
1920px
```

The surrounding viewport remains black.

Example:

```text
1920px viewport

        240px black
             ↓
    ┌──────────────────────────────┐
    │      1440px ATHLETICA UI     │
    │                              │
    │       PRODUCT CONTENT        │
    │                              │
    └──────────────────────────────┘
             ↑
        240px black
```

## Tablet

At `<= 900px`:

- Hero becomes one column.
- Product image remains first.
- Product information follows.
- Story and benefits become vertical.
- Technical details and gallery become vertical.

## Phone

At `<= 600px`:

- 16px outer margin.
- Logo remains centered.
- Hero image fills the content width.
- Four thumbnails remain in one row.
- Product title becomes large but wraps naturally.
- Benefits become one card per row.
- Specifications remain two-column label/value rows.
- Gallery becomes two columns, with the final image allowed to span the row.
- Bottom information becomes one column.

---

# 7. Color enforcement

The customer-facing Product Details page must use only:

```css
--pixel-black: #000000;
--pixel-lemon: #d1fd40;
--pixel-white: #ffffff;
```

Muted white/gray is allowed for secondary text where needed, but **there must be no white surfaces**.

Do not add:

```text
white cards
white backgrounds
gray page backgrounds
light input surfaces
blue
green
red
purple
orange
gradients
```

The visual hierarchy comes from:

```text
BLACK
  ↓
WHITE TYPOGRAPHY
  ↓
LEMON ACCENTS
  ↓
THIN DARK BORDERS
```

---

# 8. Interaction requirements

The page remains visually minimal but must function.

### Thumbnail selection

Clicking a thumbnail must:

```text
thumbnail click
    ↓
activeImage changes
    ↓
main hero image changes
    ↓
active thumbnail receives lemon border
```

### Gallery selection

Clicking a gallery image must:

```text
gallery image click
    ↓
activeImage changes
    ↓
hero image changes
```

### Shop Product

The CTA remains a functional button.

When the real Amazon Affiliate Service is connected, replace its action with the generated affiliate URL.

Do not construct Amazon URLs directly inside this component.

---

# 9. Do not alter the admin pages

This patch is specifically for:

```text
/product/:slug
```

Do not redesign:

```text
/admin/products
/admin/analytics
```

Their existing implementation remains unchanged.

---

# 10. Final acceptance criteria

The implementation is accepted only if:

- [ ] Product page background is pure black.
- [ ] Lemon accent is exactly `#d1fd40`.
- [ ] ATHLETICA is centered.
- [ ] Header contains no navigation.
- [ ] There is no customer footer.
- [ ] Hero is split into image + product information on desktop.
- [ ] Hero collapses responsively on tablet/mobile.
- [ ] Four thumbnails appear beneath the hero image.
- [ ] Active thumbnail has a lemon border.
- [ ] CTA is lemon with black text.
- [ ] Story and benefits share a horizontal section on desktop.
- [ ] Benefits use four bordered cards in a 2×2 grid.
- [ ] Technical details and product gallery share a horizontal section on desktop.
- [ ] Final information strip contains “WHAT'S INSIDE THE BOX” and “COLLECTION”.
- [ ] No white surface exists anywhere.
- [ ] Customer page has no navigation, cart, search, account, breadcrumbs, or storefront chrome.
- [ ] Main shell is exactly capped at **1440px**.
- [ ] At 1680px viewport the shell remains 1440px.
- [ ] At 1920px viewport the shell remains 1440px.
- [ ] At 2560px viewport the shell remains 1440px.
- [ ] Larger viewport space becomes black breathing room rather than enlarged UI.
- [ ] No CSS media query increases the shell beyond 1440px.
- [ ] The implementation remains usable on phone widths down to approximately 320px.
