import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products/product-service';
import { getAffiliateUrlByAsin } from '@/lib/affiliate/affiliate-service';
import { recordClick } from '@/lib/analytics/analytics-service';
import { normalizeSource } from '@/lib/analytics/source';
import { getClientIp, getVisitorHash } from '@/lib/analytics/visitor';
import { isBotUserAgent } from '@/lib/analytics/bots';
import { checkAnalyticsRateLimit } from '@/lib/analytics/rate-limit';
import { headers } from 'next/headers';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;
  const source = normalizeSource(search.get('source'));

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const userAgent = headersList.get('user-agent') ?? '';

  // Look up product to get ASIN
  const product = await getProductById(id);
  if (!product || !product.asin) {
    return NextResponse.json({ error: 'Product or ASIN not found' }, { status: 404 });
  }

  // Derive affiliate URL
  const affiliate = await getAffiliateUrlByAsin(product.asin);
  if (!affiliate.url) {
    return NextResponse.json({ error: affiliate.error }, { status: 404 });
  }

  // Record click server-side — skip silently for bots, missing IP, missing salt, or rate-limited.
  if (ip && !isBotUserAgent(userAgent)) {
    try {
      const visitorHash = getVisitorHash(ip, userAgent);
      const rateLimit = await checkAnalyticsRateLimit(visitorHash);
      if (rateLimit.success) {
        recordClick(id, source, visitorHash).catch(() => {
          // swallow — redirect must not break
        });
      }
    } catch {
      // missing salt or other error — skip recording silently
    }
  }

  // 302 redirect to affiliate URL
  return NextResponse.redirect(affiliate.url, 302);
}
