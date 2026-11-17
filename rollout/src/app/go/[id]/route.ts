// FM-04: /go/[id] redirect + click pipeline.
//
// FIX (audit 4.6/4.7): uses the CANONICAL per-marketplace URL derivation
// (deriveAmazonUrlForProduct) which reads the tag from the `marketplaces` table,
// NOT a global env tag. The visitor's marketplace is resolved via geo-routing
// (resolveCountry → marketplace lookup), with fallback to the product's default.
//
// Click pipeline: 6-layer bot filter on click path (bots still redirected),
// identity hash dedup (1h), EU IP redaction, async write (never blocks redirect).

import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server';
import { getPublicProductById } from '@/lib/products/product-service';
import { deriveAmazonUrlForProduct } from '@/lib/affiliate/affiliate-service';
import { isBotRequest } from '@/lib/analytics/bot-filter';
import { resolveVisitorHash } from '@/lib/analytics/visitor-hash';
import { resolveIp, isEuCountry, resolveCountry } from '@/lib/analytics/ip-chain';
import { dedupClick } from '@/lib/analytics/dedup';
import { recordClick } from '@/lib/analytics/analytics-service';
import { checkRedirectRateLimit } from '@/lib/analytics/rate-limit-policies';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = req.headers;

  // Explicit redirect rate-limit policy (fail-open).
  const ip = resolveIp(headers);
  const { ok } = await checkRedirectRateLimit(ip).catch(() => ({ ok: true }));
  if (!ok) return new NextResponse('Too Many Requests', { status: 429 });

  // FIX (audit 4.9): use the PUBLIC product fetch (applies the publish gate).
  // A draft/archived/deleted/future product cannot be redirected.
  const product = await getPublicProductById(id);
  if (!product || !product.asin) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Resolve the visitor's marketplace from their country (geo-routing, FM-19).
  const country = resolveCountry(headers);
  let visitorMarketplace: string | null = null;
  if (country) {
    const sb = createServiceClient();
    const { data: mp } = await sb.from('marketplaces').select('slug').eq('country_code', country.toUpperCase()).maybeSingle();
    visitorMarketplace = (mp as { slug: string } | null)?.slug ?? null;
  }

  // Derive the Amazon URL at click time via the CANONICAL per-marketplace path.
  const result = await deriveAmazonUrlForProduct({ productId: product.id, visitorMarketplace });
  if (!result.url) {
    return new NextResponse('Link coming soon', { status: 404 });
  }

  const ua = headers.get('user-agent') ?? '';
  const referer = headers.get('referer') ?? '';
  const isBot = isBotRequest(ua);

  // Async click write — never blocks the redirect.
  after(async () => {
    if (isBot) return;
    const visitorHash = resolveVisitorHash({ ua, ip, domain: headers.get('host') ?? '' });
    const deduped = await dedupClick({ identityHash: visitorHash, linkId: id, trackerId: null }).catch(() => false);
    if (deduped) return;
    await recordClick({
      productId: product.id,
      source: null,
      visitorHash,
      trackerId: null,
      ip: isEuCountry(country) ? '' : ip,
      country,
      ua,
      referer,
      bot: false,
    }).catch(() => { /* never break the redirect */ });
  });

  return NextResponse.redirect(result.url, { status: 302, headers: { 'X-Robots-Tag': 'noindex' } });
}
