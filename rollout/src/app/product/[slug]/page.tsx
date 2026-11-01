import { getProductBySlug } from '@/lib/products/product-service';
import { recordView } from '@/lib/analytics/analytics-service';
import { normalizeSource } from '@/lib/analytics/source';
import { getClientIp, getVisitorHash } from '@/lib/analytics/visitor';
import { isBotUserAgent } from '@/lib/analytics/bots';
import { checkAnalyticsRateLimit } from '@/lib/analytics/rate-limit';
import ProductDetailsClient from './ProductDetailsClient';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product not found' };
  }

  return {
    title: product.name,
    description: product.tagline ?? product.intro ?? '',
    openGraph: {
      images: product.main_image ? [{ url: product.main_image }] : undefined,
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.status !== 'published') {
    notFound();
  }

  const searchParamsResolved = await searchParams;
  const rawSource = searchParamsResolved.source;
  const source = normalizeSource(
    Array.isArray(rawSource) ? rawSource[0] : rawSource
  );

  const ctaEnabled = Boolean(
    product.asin && process.env.AMAZON_TAG && process.env.AMAZON_MARKETPLACE
  );

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const userAgent = headersList.get('user-agent') ?? '';

  // Record view server-side — skip silently for bots, missing IP, missing salt, or rate-limited.
  // Page must render regardless of analytics outcome.
  if (ip && !isBotUserAgent(userAgent)) {
    try {
      const visitorHash = getVisitorHash(ip, userAgent);
      const rateLimit = await checkAnalyticsRateLimit(visitorHash);
      if (rateLimit.success) {
        recordView(product.id, source, visitorHash).catch(() => {
          // swallow — page must not break
        });
      }
    } catch {
      // missing salt or other error — skip recording silently
    }
  }

  return <ProductDetailsClient product={product} source={source} ctaEnabled={ctaEnabled} />;
}
