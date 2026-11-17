// affiliate-service.ts — CANONICAL Amazon URL derivation.
//
// FIX (audit 4.6): the old version derived URLs from a GLOBAL env tag
// (AMAZON_ASSOCIATES_TAG + AMAZON_MARKETPLACE) and only knew 4 marketplaces.
// This version reads the per-marketplace tag + domain from the `marketplaces`
// table. There is now ONE authoritative URL-derivation path.
//
// The Amazon URL is NEVER stored. Derived at click time only.
// Tags are admin-owned (per marketplace), never affiliate-owned.

import { createServiceClient } from '@/lib/supabase/server';

export interface DeriveUrlInput {
  asin: string;
  marketplace: string;  // marketplace slug: 'US', 'UK', 'DE', ...
}

export interface DeriveUrlResult {
  url: string | null;
  /** The marketplace slug actually used (may differ from input if the input had no tag → fallback). */
  resolvedMarketplace: string;
  /** Why no URL was derived, if applicable. */
  reason?: string;
}

/**
 * Derive the canonical Amazon URL for an ASIN in a marketplace.
 * Reads the domain + tag from the `marketplaces` table.
 * If the requested marketplace has no tag configured, falls back to the
 * default marketplace (is_default=true). If that also has no tag, returns null.
 */
export async function deriveAmazonUrl(input: DeriveUrlInput): Promise<DeriveUrlResult> {
  const sb = createServiceClient();

  // Try the requested marketplace first.
  let { data: mp } = await sb.from('marketplaces').select('slug,domain,tag').eq('slug', input.marketplace).maybeSingle();
  let m = mp as { slug: string; domain: string; tag: string | null } | null;

  // No tag for the requested marketplace → fall back to the default.
  if (!m || !m.tag) {
    const { data: def } = await sb.from('marketplaces').select('slug,domain,tag').eq('is_default', true).maybeSingle();
    m = (def as { slug: string; domain: string; tag: string | null } | null) ?? m;
  }

  if (!m || !m.domain || !m.tag) {
    return { url: null, resolvedMarketplace: m?.slug ?? input.marketplace, reason: 'no tag configured for this marketplace or the default' };
  }

  const url = `https://${m.domain}/dp/${encodeURIComponent(input.asin)}?tag=${encodeURIComponent(m.tag)}`;
  return { url, resolvedMarketplace: m.slug };
}

/**
 * Derive a URL for a product + visitor's resolved marketplace.
 * Convenience wrapper: looks up the product's ASIN + default marketplace,
 * then calls deriveAmazonUrl. Used by the /go/[id] route.
 */
export async function deriveAmazonUrlForProduct(args: {
  productId: string;
  visitorMarketplace?: string | null;  // from geo-routing (FM-19)
}): Promise<DeriveUrlResult & { asin: string | null }> {
  const sb = createServiceClient();
  const { data: product } = await sb.from('products').select('asin,default_marketplace').eq('id', args.productId).maybeSingle();
  const p = product as { asin: string | null; default_marketplace: string | null } | null;
  if (!p || !p.asin) {
    return { url: null, resolvedMarketplace: args.visitorMarketplace ?? p?.default_marketplace ?? 'US', reason: 'no ASIN', asin: p?.asin ?? null };
  }
  const marketplace = args.visitorMarketplace ?? p.default_marketplace ?? 'US';
  const result = await deriveAmazonUrl({ asin: p.asin, marketplace });
  return { ...result, asin: p.asin };
}

// ---- Legacy wrappers (deprecated — delegate to the canonical path) ----
// Kept so any old import still compiles; they now go through the DB-driven path.

/** @deprecated Use deriveAmazonUrlForProduct or resolveAmazonUrlForVisitor instead. */
export async function getAffiliateUrl(productId: string): Promise<{ url: string | null; error?: string }> {
  const r = await deriveAmazonUrlForProduct({ productId });
  return { url: r.url, error: r.reason };
}

/** @deprecated Use deriveAmazonUrl instead. */
export async function getAffiliateUrlByAsin(asin: string, marketplace = 'US'): Promise<{ url: string | null; error?: string }> {
  const r = await deriveAmazonUrl({ asin, marketplace });
  return { url: r.url, error: r.reason };
}
