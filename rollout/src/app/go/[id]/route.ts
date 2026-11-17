// FM-04: /go/[id] redirect + click pipeline.
//
// Intent: send the visitor to Amazon (302 + X-Robots-Tag: noindex), record the click
// asynchronously (waitUntil + Promise.allSettled) so the redirect never fails on a
// stats-write outage. 6-layer bot filter on the click path (bots still redirected;
// only the click is suppressed). Identity hash dedup (1h). EU IP redaction.
//
// The Amazon URL is NEVER stored — derived here from ASIN + tag + marketplace (geo-routing
// in FM-19; for now uses the product's default marketplace).

import { NextResponse, type NextRequest } from 'next/server';
import { after } from 'next/server'; // waitUntil in App Router 16
import { getProductById } from '@/lib/products/product-service';
import { deriveAmazonUrl } from '@/lib/affiliate/affiliate-service';
import { isBotRequest } from '@/lib/analytics/bot-filter';
import { resolveVisitorHash } from '@/lib/analytics/visitor-hash';
import { resolveIp, isEuCountry, resolveCountry } from '@/lib/analytics/ip-chain';
import { dedupClick } from '@/lib/analytics/dedup';
import { recordClick } from '@/lib/analytics/analytics-service';
import { checkRedirectRateLimit } from '@/lib/analytics/rate-limit-policies';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = req.headers;

  // Explicit redirect rate-limit policy (Dub doesn't have one — affiliate bots are aggressive).
  const ip = resolveIp(headers);
  const { ok } = await checkRedirectRateLimit(ip).catch(() => ({ ok: true })); // fail-open
  if (!ok) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const product = await getProductById(id);
  if (!product || !product.asin) {
    // No product or no ASIN → branded not-found (not a bare 404, not a broken Amazon redirect).
    return new NextResponse('Not found', { status: 404 });
  }

  // Derive the Amazon URL at click time. NEVER stored.
  const tag = process.env.AMAZON_ASSOCIATES_TAG || '';
  const marketplace = product.default_marketplace || 'US';
  const destination = deriveAmazonUrl({ asin: product.asin, tag, marketplace });

  if (!destination) {
    return new NextResponse('Link coming soon', { status: 404 });
  }

  const ua = headers.get('user-agent') ?? '';
  const referer = headers.get('referer') ?? '';
  const country = resolveCountry(headers);

  // Bot check runs on the CLICK path — bots still get redirected; only the click is suppressed.
  const isBot = isBotRequest(ua);

  // Asynchronous click write — fire-and-forget. The redirect returns immediately.
  after(async () => {
    if (isBot) return; // suppress the click row, but the redirect already happened.

    const visitorHash = resolveVisitorHash({ ua, ip, domain: headers.get('host') ?? '' });

    // Dedup: 1 click per identity per link per hour. If deduped, skip the write.
    const deduped = await dedupClick({
      identityHash: visitorHash,
      linkId: id,
      trackerId: null, // FM-16 wires the tracker id from /go/[tracker-id]
    }).catch(() => false); // Redis down → don't block; allow the write (best-effort).

    if (deduped) return; // already counted this hour

    await recordClick({
      productId: product.id,
      source: null, // utm_source not available on /go; the storefront CTA passes it through
      visitorHash,
      trackerId: null,
      ip: isEuCountry(country) ? '' : ip, // EU redaction
      country,
      ua,
      referer,
      bot: false,
    }).catch(() => {
      // Silently skip — a stats-write failure must never break the redirect.
    });
  });

  // 302 (user-editable affiliate link) + X-Robots-Tag: noindex.
  return NextResponse.redirect(destination, { status: 302, headers: { 'X-Robots-Tag': 'noindex' } });
}
