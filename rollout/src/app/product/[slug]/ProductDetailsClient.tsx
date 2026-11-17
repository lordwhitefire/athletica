'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products/types';

type Benefit = { icon?: string; title?: string; text?: string };
type Detail = { label?: string; value?: string };

function ProductIcon({ name }: { name?: string }) {
  const svg = { viewBox: '0 0 32 32', 'aria-hidden': true as const, focusable: false as const };
  if (name === 'bolt') return <svg {...svg}><path d="M18.5 3 7 17h7l-1 12 12-16h-7z" /></svg>;
  if (name === 'target') return <svg {...svg}><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="6" /><circle cx="16" cy="16" r="1.5" /></svg>;
  if (name === 'speed') return <svg {...svg}><path d="M5 22a12 12 0 1 1 22 0M16 17l6-7M8 22h16" /><circle cx="16" cy="17" r="1.5" /></svg>;
  return <svg {...svg}><path d="M5 20.5c4.2 0 6.8-1.1 8.2-4.2l1.4-5.1 4.1 1.2 1.1 5.1 7.2 3.1v4H5zM5 20.5v4M12 22h3m2 0h3m2 0h3" /></svg>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function ProductDetailsClient({ product }: { product: Product }) {
  const images = Array.from(new Set(
    [product.main_image, ...asArray<string>(product.images)]
      .filter((src): src is string => typeof src === 'string' && src.trim().length > 0),
  ));
  const [activeImage, setActiveImage] = useState(images[0] ?? null);
  const benefits = asArray<Benefit>(product.key_benefits).filter((item) => item && (item.title || item.text));
  const savedDetails = asArray<Detail>(product.technical_details).filter((item) => item?.label && item.value);
  const details = savedDetails.length ? savedDetails : [
    ['Adjustment', product.adjustment], ['Range', product.range], ['Sole type', product.sole_type],
    ['Upper material', product.upper_material], ['Traction', product.traction],
  ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => ({ label, value }));
  const boxContents = Array.isArray(product.box_contents)
    ? product.box_contents.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : typeof product.box_contents === 'string' && product.box_contents.trim() ? [product.box_contents] : [];
  const galleryImages = images.filter((src) => src !== activeImage);
  const unavailable = product.availableForSale === false;

  return (
    <main className="pixel-product-page">
      <header className="pixel-product-header">
        <div className="pixel-product-header__inner">
          <span className="pixel-logo">ATHLETICA</span>
        </div>
      </header>

      <div className="pixel-product-shell">
        <section className="pixel-hero" aria-labelledby="product-title">
          <div className="pixel-gallery">
            <div className="pixel-main-image">
              {activeImage ? (
                <Image src={activeImage} alt={product.name} fill priority unoptimized sizes="(max-width: 900px) 100vw, 55vw" />
              ) : <div className="pixel-image-unavailable">IMAGE UNAVAILABLE</div>}
              <span className="pixel-image-counter" aria-hidden="true">
                {images.length ? '01 / ' + String(images.length).padStart(2, '0') : ''}
              </span>
            </div>

            {images.length > 1 && (
              <div className="pixel-thumbnails" aria-label="Product images">
                {images.slice(0, 4).map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    className={'pixel-thumbnail' + (src === activeImage ? ' is-active' : '')}
                    onClick={() => setActiveImage(src)}
                    aria-label={'Show product image ' + (index + 1)}
                    aria-pressed={src === activeImage}
                  >
                    <Image src={src} alt={product.name + ' view ' + (index + 1)} fill unoptimized sizes="(max-width: 600px) 22vw, 13vw" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pixel-product-summary">
            <span className="pixel-brand">{product.collection || 'ATHLETICA'}</span>
            <h1 id="product-title">{product.name}</h1>
            {product.tagline && <p className="pixel-tagline">{product.tagline}</p>}
            {product.subtitle && <p className="pixel-subtitle">{product.subtitle}</p>}

            {(product.gender || product.color || unavailable) && (
              <div className="pixel-meta" aria-label="Product attributes">
                {product.gender && <span>{product.gender}</span>}
                {product.gender && product.color && <i aria-hidden="true">·</i>}
                {product.color && <span>{product.color}</span>}
                {(product.gender || product.color) && unavailable && <i aria-hidden="true">·</i>}
                {unavailable && <span>Currently unavailable</span>}
              </div>
            )}

            <div className="pixel-cta-rule" />
            {product.asin && !unavailable ? (
              <Link href={'/go/' + product.id} className="pixel-shop-button">
                SHOP PRODUCT <span className="pixel-arrow" aria-hidden="true">→</span>
              </Link>
            ) : (
              <button type="button" className="pixel-shop-button" disabled>
                {unavailable ? 'CURRENTLY UNAVAILABLE' : 'LINK COMING SOON'}
              </button>
            )}
            <p className="pixel-retailer-note">
              You’ll be redirected to the retailer’s website to complete your purchase. Product availability may change.
            </p>
          </div>
        </section>

        {(product.intro || benefits.length > 0) && (
          <section className="pixel-story-benefits">
            {product.intro && (
              <div className="pixel-story">
                <span className="pixel-section-label">PRODUCT OVERVIEW</span>
                <div dangerouslySetInnerHTML={{ __html: product.intro }} />
              </div>
            )}
            {benefits.length > 0 && (
              <div className="pixel-benefits">
                <span className="pixel-section-label">KEY BENEFITS</span>
                <div className="pixel-benefit-grid">
                  {benefits.map((benefit, index) => (
                    <article className="pixel-benefit-card" key={(benefit.title || 'benefit') + '-' + index}>
                      <span className="pixel-benefit-icon"><ProductIcon name={benefit.icon} /></span>
                      <div>
                        {benefit.title && <h3>{benefit.title}</h3>}
                        {benefit.text && <p>{benefit.text}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {(details.length > 0 || galleryImages.length > 0 || (product.sizes_detail || asArray<string>(product.sizes).length > 0)) && (
          <section className="pixel-details-gallery">
            {(details.length > 0 || product.sizes_detail || asArray<string>(product.sizes).length > 0) && (
              <div className="pixel-details">
                <span className="pixel-section-label">TECHNICAL DETAILS</span>
                <div className="pixel-spec-list">
                  {details.map((detail, index) => (
                    <div className="pixel-spec-row" key={detail.label + '-' + index}>
                      <span>{detail.label}</span><strong>{detail.value}</strong>
                    </div>
                  ))}
                  {product.sizes_detail && <div className="pixel-spec-row"><span>Sizes</span><strong>{product.sizes_detail}</strong></div>}
                  {asArray<string>(product.sizes).length > 0 && (
                    <div className="pixel-spec-row"><span>Available sizes</span><strong>{asArray<string>(product.sizes).join(', ')}</strong></div>
                  )}
                </div>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="pixel-product-gallery">
                <span className="pixel-section-label">PRODUCT GALLERY</span>
                <div className="pixel-gallery-grid">
                  {galleryImages.slice(0, 6).map((src, index) => (
                    <button
                      className="pixel-gallery-item"
                      type="button"
                      key={src}
                      onClick={() => { setActiveImage(src); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      aria-label={'View gallery image ' + (index + 1)}
                    >
                      <Image src={src} alt={product.name + ' gallery image ' + (index + 1)} fill unoptimized sizes="(max-width: 600px) 45vw, 24vw" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="pixel-bottom-strip">
          <div className="pixel-bottom-item">
            <span className="pixel-bottom-icon"><ProductIcon name="target" /></span>
            <div>
              <div className="pixel-bottom-label">SHOP WITH CONFIDENCE</div>
              <p>Athletica connects you to the retailer. Orders, payment and delivery are handled by the retailer.</p>
              <p>As an Amazon Associate, Athletica earns from qualifying purchases.</p>
            </div>
          </div>

          {boxContents.length > 0 && (
            <div className="pixel-bottom-item">
              <span className="pixel-bottom-icon"><ProductIcon name="boot" /></span>
              <div>
                <div className="pixel-bottom-label">BOX CONTENTS</div>
                <ul className="pixel-box-list">
                  {boxContents.map((item, index) => <li key={item + '-' + index}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProductDetailsClient;
