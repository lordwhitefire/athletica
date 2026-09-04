'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductRow } from '@/lib/database.types';
import './rollout1-pixel-match.css';

type BenefitIconType = 'boot' | 'bolt' | 'target' | 'speed';

type ShopState = 'idle' | 'loading' | 'opened' | 'error';

interface ProductDetailsClientProps {
  product: ProductRow;
}

function normalizeIcon(icon: string): BenefitIconType {
  const value = icon.toLowerCase();
  if (value.includes('bolt') || value.includes('speed')) return 'bolt';
  if (value.includes('target')) return 'target';
  if (value.includes('boot') || value.includes('shoe')) return 'boot';
  return 'boot';
}

function BenefitIcon({ type }: { type: BenefitIconType }) {
  if (type === 'bolt') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M18.8 2 7 18h8.2L13.5 30 26 13.4h-8.3L18.8 2Z" />
      </svg>
    );
  }

  if (type === 'target') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="10.5" />
        <circle cx="16" cy="16" r="5" />
        <path d="M16 2v6M16 24v6M2 16h6M24 16h6" />
      </svg>
    );
  }

  if (type === 'speed') {
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

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const images = product.images && product.images.length > 0 ? product.images : (product.main_image ? [product.main_image] : []);

  const [activeImage, setActiveImage] = useState(0);
  const [shopState, setShopState] = useState<ShopState>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLButtonElement[]>([]);

  const safeIndex = images.length === 0 ? 0 : ((activeIndex % images.length) + images.length) % images.length;
  const selected = images.length === 0 ? null : images[safeIndex];

  // Keyboard gallery controls: ArrowLeft, ArrowRight, Home, End
  const move = useCallback(
    (direction: number) => {
      if (images.length === 0) return;
      setActiveIndex((prev) => (prev + direction + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          move(1);
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(images.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move, images.length]);

  useEffect(() => {
    setActiveImage(safeIndex);
  }, [safeIndex]);

  useEffect(() => {
    thumbnailsRef.current[safeIndex]?.focus();
  }, [safeIndex]);

  const handleShop = async () => {
    if (shopState === 'loading') return;

    setShopState('loading');
    try {
      const response = await fetch(`/api/affiliate?productId=${encodeURIComponent(product.id)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to open shop link');
      }
      const data = await response.json();
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setShopState('opened');

      // Record click (fire and forget) — only when the affiliate URL was derived and opened
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, eventType: 'click' }),
      }).catch(console.error);
    } catch {
      setShopState('error');
    }
  };

  const shopLabel =
    shopState === 'loading'
      ? 'OPENING...'
      : shopState === 'opened'
        ? 'OPENED'
        : shopState === 'error'
          ? 'TRY AGAIN'
          : 'SHOP PRODUCT';

  const technicalDetails =
    product.technical_details && product.technical_details.length > 0
      ? product.technical_details
      : [
          { label: 'ADJUSTMENT', value: product.adjustment ?? '—' },
          { label: 'RANGE', value: product.range ?? '—' },
          { label: 'SOLE TYPE', value: product.sole_type ?? '—' },
          { label: 'UPPER MATERIAL', value: product.upper_material ?? '—' },
          { label: 'TRACTION', value: product.traction ?? '—' },
        ];

  const keyBenefits = product.key_benefits ?? [];

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
            {selected ? (
              <div className="pixel-main-image">
                <img src={selected} alt={product.name} />
                <div className="pixel-image-counter">{safeIndex + 1} / {images.length}</div>
              </div>
            ) : (
              <div className="pixel-image-unavailable">IMAGE UNAVAILABLE</div>
            )}

            {images.length > 0 && (
              <div className="pixel-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    ref={(el) => {
                      thumbnailsRef.current[index] = el as HTMLButtonElement;
                    }}
                    className={`pixel-thumbnail ${safeIndex === index ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pixel-product-summary">
            <h1>{product.name}</h1>

            {product.tagline ? (
              <div className="pixel-tagline">{product.tagline}</div>
            ) : (
              product.collection && <div className="pixel-tagline">{product.collection}</div>
            )}

            {product.subtitle && <p className="pixel-subtitle">{product.subtitle}</p>}

            {typeof product.price === 'number' && (
              <div className="pixel-price">${product.price.toFixed(2)}</div>
            )}

            {(product.gender || product.color) && (
              <div className="pixel-meta">
                {product.gender && <span>{product.gender}</span>}
                {product.gender && product.color && <i>•</i>}
                {product.color && <span>{product.color}</span>}
              </div>
            )}

            <div className="pixel-cta-rule" />

            <button className="pixel-shop-button" type="button" onClick={handleShop} disabled={shopState === 'loading'}>
              <span>{shopLabel}</span>
              <span className="pixel-arrow" aria-hidden="true">
                ↗
              </span>
            </button>

            <p className="pixel-retailer-note">
              Availability and final pricing may vary at the retailer.
            </p>
          </div>
        </section>

        {(product.intro || keyBenefits.length > 0) && (
          <section className="pixel-story-benefits">
            {product.intro && (
              <div className="pixel-story">
                <div className="pixel-section-label">THE STORY</div>
                <h2>{product.tagline || product.collection}</h2>
                <p>{product.intro}</p>
              </div>
            )}

            {keyBenefits.length > 0 && (
              <div className="pixel-benefits">
                <div className="pixel-section-label">KEY BENEFITS</div>
                <div className="pixel-benefit-grid">
                  {keyBenefits.map((benefit, index) => (
                    <article className="pixel-benefit-card" key={benefit.title + index}>
                      <div className="pixel-benefit-icon">
                        <BenefitIcon type={normalizeIcon(benefit.icon)} />
                      </div>
                      <div>
                        <h3>{benefit.title}</h3>
                        <p>{benefit.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="pixel-details-gallery">
          <div className="pixel-details">
            <div className="pixel-section-label">TECHNICAL DETAILS</div>
            <div className="pixel-spec-list">
              {technicalDetails.map((detail) => (
                <div className="pixel-spec-row" key={detail.label}>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {images.length > 1 && (
            <div className="pixel-product-gallery">
              <div className="pixel-section-label">PRODUCT GALLERY</div>
              <div className="pixel-gallery-grid">
                {images.slice(1).map((image, index) => (
                  <button
                    type="button"
                    className="pixel-gallery-item"
                    key={image + index}
                    onClick={() => setActiveIndex(index + 1)}
                  >
                    <img src={image} alt={`${product.name} view ${index + 2}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
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
              <div className="pixel-bottom-label">WHAT&apos;S INSIDE THE BOX</div>
              <p>{product.name}</p>
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
              <p>{product.collection || product.name}</p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
