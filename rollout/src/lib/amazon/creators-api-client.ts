// FM-20: Amazon Creators API client — OPTIONAL booster, soft-fail.
//
// FIX (audit 4.7): the partner tag now comes from the `marketplaces` table
// (per-marketplace, admin-owned), NOT a global env var. The Creators API
// request uses the tag matching the product's marketplace/locale.
//
// Own-data-first (Option B). Enabled only when credentials + eligibility exist.
// Caches offers ≤ 1h, other data ≤ 1d. Retries with backoff on 429/5xx.
// Auth: OAuth credential ID + secret (NOT AWS keys — PA-API 5 is dead).

import { createServiceClient } from '@/lib/supabase/server';

const CREDENTIAL_ID = process.env.AMAZON_CREATORS_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREATORS_CREDENTIAL_SECRET;
const SCOPE = 'creatorsapi::default';
const BASE = 'https://api.amazon.com/creators/1.0';

function isEnabled(): boolean {
  return Boolean(CREDENTIAL_ID && CREDENTIAL_SECRET);
}

interface CacheRow {
  product_id: string;
  asin: string;
  locale: string;
  expiration_time: string;
  availability: string | null;
  rating: number | null;
  review_count: number | null;
  review_samples: unknown;
  error: string | null;
}

/** Resolve the admin-owned partner tag for a marketplace from the DB. */
async function getTagForMarketplace(marketplace: string): Promise<string | null> {
  const sb = createServiceClient();
  // Try the requested marketplace; fall back to the default.
  let { data: mp } = await sb.from('marketplaces').select('tag').eq('slug', marketplace).maybeSingle();
  let tag = (mp as { tag: string | null } | null)?.tag ?? null;
  if (!tag) {
    const { data: def } = await sb.from('marketplaces').select('tag').eq('is_default', true).maybeSingle();
    tag = (def as { tag: string | null } | null)?.tag ?? null;
  }
  return tag;
}

/** Fetch product data from the Creators API. Soft-fails (returns null on any error). */
export async function fetchProductFromCreators(asin: string, locale: string): Promise<CacheRow | null> {
  if (!isEnabled()) return null;

  const cacheKey = `${asin}_${locale}|en|USD`;
  const sb = createServiceClient();

  const { data: cached } = await sb.from('amazon_product_cache').select('*').eq('product_id', cacheKey).maybeSingle();
  const c = cached as (CacheRow & { modified_time: string }) | null;
  if (c && !c.error && new Date(c.expiration_time) > new Date()) {
    return c;
  }

  // FIX: get the per-marketplace tag from the DB, not a global env var.
  const partnerTag = await getTagForMarketplace(locale);
  if (!partnerTag) {
    await upsertCacheError(cacheKey, asin, locale, 'no tag configured for marketplace');
    return null;
  }

  let attempt = 0;
  while (attempt < 3) {
    try {
      const token = await getOAuthToken();
      const res = await fetch(`${BASE}/products/${asin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-amz-creators-scope': SCOPE,
        },
        body: JSON.stringify({ partnerTag, locale, resources: ['offers.listings.availability', 'customerReviews'] }),
      });
      if (res.status === 429 || res.status >= 500) { await backoff(++attempt); continue; }
      if (!res.ok) { await upsertCacheError(cacheKey, asin, locale, `HTTP ${res.status}`); return null; }
      const json = await res.json() as {
        offers?: { listings?: { availability?: { type?: string } }[] };
        customerReviews?: { summary?: { rating?: number; count?: number }; samples?: { title: string; body: string }[] };
      };
      const availability = json.offers?.listings?.[0]?.availability?.type ?? null;
      const rating = json.customerReviews?.summary?.rating ?? null;
      const reviewCount = json.customerReviews?.summary?.count ?? null;
      const samples = json.customerReviews?.samples ?? [];

      const row = {
        product_id: cacheKey, asin, locale,
        modified_time: new Date().toISOString(),
        expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        availability, rating, review_count: reviewCount, review_samples: samples, error: null,
      };
      await sb.from('amazon_product_cache').upsert(row, { onConflict: 'product_id' });
      return row as CacheRow;
    } catch {
      await backoff(++attempt);
    }
  }
  await upsertCacheError(cacheKey, asin, locale, 'persistent error');
  return null;
}

async function getOAuthToken(): Promise<string> {
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CREDENTIAL_ID!,
      client_secret: CREDENTIAL_SECRET!,
      scope: SCOPE,
    }),
  });
  if (!res.ok) throw new Error('OAuth failed');
  return (await res.json() as { access_token: string }).access_token;
}

function backoff(attempt: number): Promise<void> {
  return new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 8000)));
}

async function upsertCacheError(cacheKey: string, asin: string, locale: string, error: string): Promise<void> {
  const sb = createServiceClient();
  await sb.from('amazon_product_cache').upsert({
    product_id: cacheKey, asin, locale,
    modified_time: new Date().toISOString(),
    expiration_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    error,
  }, { onConflict: 'product_id' });
}

export const creatorsApiStatus = { enabled: isEnabled() };
