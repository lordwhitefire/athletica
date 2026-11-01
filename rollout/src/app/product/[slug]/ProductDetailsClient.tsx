'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductRow, AnalyticsSource } from '@/lib/database.types';

type BenefitIconType = 'boot' | 'bolt' | 'target' | 'traction' | 'shield';

interface ProductDetailsClientProps {
  product: ProductRow;
  source?: AnalyticsSource | null;
  ctaEnabled?: boolean;
}

function normalizeIcon(icon: string): BenefitIconType {
  const value = icon.toLowerCase();
  if (value.includes('bolt')) return 'bolt';
  if (value.includes('target')) return 'target';
  if (value.includes('boot') || value.includes('shoe')) return 'boot';
  if (value.includes('traction') || value.includes('speed')) return 'traction';
  return 'boot';
}

function BenefitIcon({ type }: { type: BenefitIconType }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (type === 'target') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="10" />
        <circle cx="16" cy="16" r="4" />
        <path d="M16 2v5M16 25v5M2 16h5M25 16h5" />
      </svg>
    );
  }

  if (type === 'shield') {
    return (
      <svg {...common}>
        <path d="M16 3 26 7v7c0 7-4.5 11.5-10 15-5.5-3.5-10-8-10-15V7l10-4Z" />
        <path d="m10 16 4 4 8-9" />
      </svg>
    );
  }

  if (type === 'bolt') {
    return (
      <svg {...common}>
        <path d="M18 2 6 18h9l-1 12 12-17h-9l1-11Z" />
      </svg>
    );
  }

  if (type === 'traction') {
    return (
      <svg {...common}>
        <path d="M4 16h17M15 8l8 8-8 8" />
        <path d="M7 7H4M7 25H4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 22c5-1 7-5 9-10l2-7 10 3-2 11c-1 6-6 9-13 9H5v-6Z" />
      <path d="m13 12 9 3" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#d1fd40]">
      {children}
    </p>
  );
}

const HERO_LABELS = ['Main view', 'Side view', 'Perspective view', 'Sole plate view'];

/**
 * The page's 8 image slots, sourced from the product row:
 *   images[0..3] hero + thumbnails · images[4] story · images[5..7] gallery.
 * Falls back to a neutral placeholder when the row has fewer than 8, so the layout
 * never collapses for a product with thin data.
 */
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#111411"/></svg>'
  );

function slotAt(images: string[], index: number): string {
  const value = images[index];
  return value && value.trim() !== '' ? value : PLACEHOLDER;
}

function buildSlots(images: string[]) {
  const slots = Array.from({ length: 8 }, (_, i) => slotAt(images, i));
  return {
    hero: slots.slice(0, 4).map((src, i) => ({ src, alt: `View ${i + 1}`, label: HERO_LABELS[i] })),
    story: { src: slots[4], alt: 'Product in play' },
    gallery: slots.slice(5, 8).map((src, i) => ({ src, alt: `Detail view ${i + 1}` })),
  };
}

export default function ProductDetailsClient({
  product,
  source,
  ctaEnabled,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);

  const slots = buildSlots(product.images ?? []);

  const keyBenefits = product.key_benefits ?? [];

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

  return (
    <main className="min-h-screen overflow-hidden bg-[#050605] text-white">
      {/* Static brand identity — intentionally not a navigation link. */}
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-center px-5 py-6 sm:px-8 lg:px-12">
        <span className="text-[13px] font-bold tracking-[0.32em] text-[#d1fd40]">
          ATHLETICA
        </span>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 pb-16 sm:px-8 lg:px-12">
        {/* HERO */}
        <section className="grid gap-8 border-t border-white/15 pt-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:pt-9">
          <div className="min-w-0">
            <div className="group relative aspect-[1.12/1] overflow-hidden bg-[#111411] sm:aspect-[1.25/1] lg:aspect-[1.16/1]">
              <img
                src={slots.hero[activeImage].src}
                alt={slots.hero[activeImage].alt}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/[0.03]" />
              <span className="absolute bottom-4 left-4 text-[9px] uppercase tracking-[0.2em] text-white/70">
                {slots.hero[activeImage].label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
              {slots.hero.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show ${image.label}`}
                  aria-pressed={activeImage === index}
                  className={`relative aspect-square overflow-hidden border transition-colors ${
                    activeImage === index
                      ? 'border-[#d1fd40]'
                      : 'border-white/15 hover:border-white/50'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center py-2 lg:py-8">
            <p className="mb-5 text-[12px] uppercase tracking-[0.25em] text-white/45">
              {product.collection}
            </p>
            <h1 className="max-w-[680px] text-[clamp(2.5rem,5.3vw,5.8rem)] font-semibold uppercase leading-[0.91] tracking-[-0.065em]">
              {product.name}
            </h1>
            <p className="mt-6 max-w-xl text-[18px] font-semibold leading-6 text-[#d1fd40] sm:text-[20px]">
              {product.tagline}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/65 sm:text-[16px]">
              {product.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/70">
              <span>{product.gender}</span>
              <span className="h-1 w-1 rounded-full bg-[#d1fd40]" />
              <span>{product.color}</span>
            </div>
            <div className="my-7 h-px w-full bg-[#d1fd40]/70" />
            <button
              type="button"
              disabled={!ctaEnabled}
              aria-disabled={!ctaEnabled}
              className="flex min-h-14 w-full cursor-not-allowed items-center justify-between bg-[#d1fd40] px-5 text-sm font-medium text-black/80 opacity-80"
              onClick={
                ctaEnabled
                  ? () => router.push(`/go/${product.id}?source=${encodeURIComponent(source ?? '')}`)
                  : undefined
              }
            >
              <span>{ctaEnabled ? 'SHOP PRODUCT' : 'Link coming soon'}</span>
              <span aria-hidden="true" className="text-2xl leading-none">
                ↗
              </span>
            </button>
            <p className="mt-3 text-[13px] leading-5 text-white/50">
              As an Amazon Associate, I earn from qualifying purchases.
            </p>
          </div>
        </section>

        {/* STORY */}
        <section className="mt-16 grid border-t border-white/15 pt-8 md:mt-24 md:grid-cols-2 md:items-center md:gap-12">
          <div className="relative -mx-5 mb-8 aspect-[1.35/1] overflow-hidden sm:-mx-8 md:mx-0 md:mb-0 md:aspect-[1.1/1]">
            <img
              src={slots.story.src}
              alt={slots.story.alt}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/65" />
          </div>
          <div className="py-2 md:py-10">
            <SectionLabel>The story</SectionLabel>
            <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              {product.tagline || 'Built for total control'}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">
              {product.intro}
            </p>
          </div>
        </section>

        {/* KEY BENEFITS */}
        <section className="mt-16 border-t border-white/15 pt-8 md:mt-24">
          <SectionLabel>Key benefits</SectionLabel>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {keyBenefits.map((benefit) => (
              <article
                key={benefit.title}
                className="group border-white/15 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="mb-5 text-[#d1fd40] transition-transform duration-300 group-hover:-translate-y-1">
                  <BenefitIcon type={normalizeIcon(benefit.icon)} />
                </div>
                <p className="text-[16px] font-semibold sm:text-[17px]">
                  {benefit.title}
                </p>
                <p className="mt-3 max-w-xs text-[14px] leading-5 text-white/55 sm:text-[15px]">
                  {benefit.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* TECHNICAL DETAILS + PRODUCT SPECIFICATIONS */}
        <section className="mt-16 grid gap-10 border-t border-white/15 pt-8 md:mt-24 md:grid-cols-2 md:gap-12">
          <div>
            <SectionLabel>Technical details</SectionLabel>
            <dl>
              {technicalDetails.map((detail) => (
                <div
                  key={detail.label}
                  className="grid grid-cols-[minmax(105px,0.8fr)_1.2fr] gap-4 border-t border-white/15 py-4 first:border-t-white/30"
                >
                  <dt className="text-[12px] font-medium uppercase tracking-wide text-white/55">
                    {detail.label}
                  </dt>
                  <dd className="text-[14px] leading-5 text-white/85 sm:text-[15px]">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:border-l md:border-white/15 md:pl-10">
            <SectionLabel>Product specifications</SectionLabel>
            <dl>
              <div className="grid grid-cols-[minmax(105px,0.8fr)_1.2fr] gap-4 border-t border-white/15 py-4 first:border-t-white/30">
                <dt className="text-[12px] font-medium uppercase tracking-wide text-white/55">
                  Gender
                </dt>
                <dd className="text-[14px] leading-5 text-white/85 sm:text-[15px]">{product.gender}</dd>
              </div>
              <div className="grid grid-cols-[minmax(105px,0.8fr)_1.2fr] gap-4 border-t border-white/15 py-4">
                <dt className="text-[12px] font-medium uppercase tracking-wide text-white/55">
                  Color
                </dt>
                <dd className="text-[14px] leading-5 text-white/85 sm:text-[15px]">{product.color}</dd>
              </div>
              <div className="grid grid-cols-[minmax(105px,0.8fr)_1.2fr] gap-4 border-t border-white/15 py-4">
                <dt className="text-[12px] font-medium uppercase tracking-wide text-white/55">
                  Collection
                </dt>
                <dd className="text-[14px] leading-5 text-white/85 sm:text-[15px]">{product.collection}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* SUPPORTING GALLERY */}
        <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.gallery.map((image) => (
            <div key={image.src} className="relative aspect-[1.5/1] overflow-hidden bg-[#111411]">
              <img
                src={image.src}
                alt={image.alt}
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
        </section>

        {/* Static brand signature, not footer navigation. */}
        <footer className="mt-16 border-t border-white/15 pt-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] text-[#d1fd40]">
            ATHLETICA
          </p>
          <p className="mt-3 text-[9px] uppercase tracking-[0.25em] text-white/40">
            Built around the game.
          </p>
        </footer>
      </div>
    </main>
  );
}
