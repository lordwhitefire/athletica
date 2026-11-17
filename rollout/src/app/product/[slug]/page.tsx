// FM-03: Product detail page — Server Component.
//
// 3-condition publish gate: status='active' AND deleted_at IS NULL AND available_on <= now.
// Missing/unpublished/future → plain 404 (notFound()).
// No price displayed anywhere (Amazon Associates policy).
// JSON-LD schema.org/Product + AggregateOffer (availability flips with availableForSale).
// generateMetadata with fallbacks (seo.title || title); tag-based visibility (HIDDEN_PRODUCT_TAG → noindex).
// Server-side view recording (source from utm_source, visitor_hash from the analytics pipeline, bots skipped).
//
// Intent, not instructions: the component achieves the benchmarks. The Builder's
// helpers (product-service.getProductBySlug, analytics.recordView) are assumed to exist
// or be created alongside; this file is the page composition.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/products/product-service';
import { recordView } from '@/lib/analytics/analytics-service';
import { isBotRequest } from '@/lib/analytics/bot-filter';
import { resolveVisitorHash } from '@/lib/analytics/visitor-hash';
import { resolveIp } from '@/lib/analytics/ip-chain';
import ProductDetailsClient from './ProductDetailsClient';

const HIDDEN_PRODUCT_TAG = 'hidden';

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ utm_source?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const seo = (product.meta as { seo?: { title?: string; description?: string } } | null)?.seo ?? {};
  const indexable = !(product.tags ?? []).includes(HIDDEN_PRODUCT_TAG);
  const ogImage = product.main_image
    ? { url: product.main_image, width: 1200, height: 1200, alt: product.name }
    : undefined;

  return {
    title: seo.title || product.name,
    description: seo.description || product.intro || product.name,
    robots: { index: indexable, follow: indexable, googleBot: { index: indexable, follow: indexable } },
    openGraph: ogImage ? { images: [ogImage] } : undefined,
  };
}

export default async function ProductPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { utm_source } = await searchParams;
  const product = await getProductBySlug(slug);

  // 3-condition publish gate is enforced inside getProductBySlug (returns null otherwise).
  if (!product) notFound();

  // Server-side view recording — bots skipped, identity hashed, no raw IP stored.
  const headers = await headersPromise();
  const ua = headers.get('user-agent') ?? '';
  if (!isBotRequest(ua)) {
    const ip = resolveIp(headers);
    const visitorHash = resolveVisitorHash({ ua, ip, domain: headers.get('host') ?? '' });
    // Fire-and-forget via waitUntil — the page must not block on the analytics write.
    // recordView handles EU redaction + dedup internally.
    void recordView({
      productId: product.id,
      source: utm_source ?? null,
      visitorHash,
    }).catch(() => {
      // Silently skip — a stats-write failure must never break the page.
    });
  }

  // JSON-LD structured data — availability flips with the cache state (FM-21 enriches this).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.intro || product.name,
    image: product.main_image ? [product.main_image] : [],
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      // No price here — Amazon policy forbids hand-typed prices. The live price is on Amazon.
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailsClient product={product} />
    </>
  );
}

// Helper: Next.js headers() is async in App Router 16.
import { headers as headersFn } from 'next/headers';
function headersPromise() {
  return headersFn();
}
