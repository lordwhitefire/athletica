# ROLL-14: Affiliate config + CTA redirect + click measurement

## What and why

Build the affiliate redirect route and wire the product CTA so it actually goes somewhere. The CTA stays disabled ("Link coming soon") until the product has an ASIN **and** the Amazon tag/marketplace are supplied via env. When ready, clicking the CTA navigates to `/go/[id]?source=...`, which records the click server-side and then 302-redirects to the Amazon affiliate URL.

No `window.open`, no client-side affiliate URL derivation, no hardcoded `athletica-20` tag.

Depends on ROLL-12 (schema scoping + analytics helpers) and ROLL-13 (product page with source prop).

## What exists

- `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` — CTA button disabled ("Link coming soon"), accepts `source` prop, no price, no `window.open`, Amazon Associates disclosure present, `next/image` used.
- `rollout/src/app/product/[slug]/page.tsx` — passes `source` to `ProductDetailsClient`.
- `rollout/src/lib/affiliate/affiliate-service.ts` — **hardcoded** `tag: 'athletica-20'`, `marketplace: 'amazon.com'`, `locale: 'en_US'`. Must be replaced with env vars.
- `rollout/src/app/api/affiliate/route.ts` — exists, calls `getAffiliateUrl(productId)` and returns JSON. Not used by the CTA yet.
- `rollout/src/app/api/analytics/route.ts` — exists, calls `recordView(productId)` / `recordClick(productId)` without source/hash.
- `rollout/src/lib/analytics/analytics-service.ts` — `recordClick(productId, source, visitorHash)` accepts source/hash.
- ROLL-12 helpers: `normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`.
- `.env.example` — no `AMAZON_TAG`, `AMAZON_MARKETPLACE`, or `AMAZON_STORE` vars.
- No `rollout/src/app/go/[id]/route.ts` exists yet.

## Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Affiliate config source | `AMAZON_TAG` and `AMAZON_MARKETPLACE` from server env only. `affiliate-service.ts` reads `process.env.AMAZON_TAG` and `process.env.AMAZON_MARKETPLACE`. No hardcoded `athletica-20`. |
| 2 | Missing tag/ASIN behaviour | CTA button stays disabled ("Link coming soon") when product has no ASIN, or `AMAZON_TAG`/`AMAZON_MARKETPLACE` is missing. |
| 3 | Redirect route | New file `rollout/src/app/go/[id]/route.ts`. `GET /go/[id]?source=...` — look up product, derive affiliate URL, record click server-side, then 302 redirect. |
| 4 | Click recording | Server-side in `/go/[id]` route. Skip silently for bots, missing IP, missing salt, or rate-limited. Pass `source` + `visitorHash` to `recordClick`. |
| 5 | CTA navigation | Client-side navigation to `/go/${product.id}?source=${source}` (Next.js `router.push` or anchor). No `window.open`. |
| 6 | Source propagation | `page.tsx` already passes `source` to `ProductDetailsClient`. Client passes it as a query param to `/go/[id]`. |
| 7 | Env vars | Add `AMAZON_TAG` and `AMAZON_MARKETPLACE` to `.env.example` (blank). Owner adds real values to `.env.local` and Vercel Production. |

## Steps

Run from the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

### 1. Affiliate env vars — `rollout/.env.example`

Add:

```env
AMAZON_TAG=
AMAZON_MARKETPLACE=
```

Leave blank. Never add real values.

### 2. Affiliate service — `rollout/src/lib/affiliate/affiliate-service.ts`

Replace the hardcoded `AFFILIATE_CONFIG` with env reads:

```ts
const AFFILIATE_CONFIG = {
  tag: process.env.AMAZON_TAG,
  marketplace: process.env.AMAZON_MARKETPLACE,
  locale: 'en_US',
};
```

If `tag` or `marketplace` is missing, `getAffiliateUrl` and `getAffiliateUrlByAsin` return `{ url: null, error: 'Affiliate not configured' }`. Remove the `athletica-20` placeholder entirely.

Keep `getAmazonHost` logic unchanged (defaults to `www.amazon.com` when marketplace is unrecognized).

### 3. Redirect route — create `rollout/src/app/go/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products/product-service'; // or admin variant
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
  const product = await getProductById(id); // needs to be added to product-service
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
```

**Add `getProductById` to `rollout/src/lib/products/product-service.ts`** (public client, respects RSL):

```ts
export async function getProductById(id: string): Promise<ProductRow | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();
  if (error) return null;
  return data;
}
```

### 4. CTA — `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`

- Keep the button disabled when `!product.asin || !process.env.AMAZON_TAG || !process.env.AMAZON_MARKETPLACE`.
- When enabled, navigate to `/go/${product.id}?source=${encodeURIComponent(source ?? '')}` on click.
- No `window.open`. No `/api/affiliate` fetch.
- Keep `source?: AnalyticsSource | null` prop (already there from ROLL-13).
- Keep Amazon Associates disclosure.

Since `process.env` in a client component is not available unless prefixed with `NEXT_PUBLIC_`, pass a flag from the server page instead:

**In `page.tsx`**, compute `ctaEnabled` and pass it:

```ts
const ctaEnabled = Boolean(
  product.asin &&
  process.env.AMAZON_TAG &&
  process.env.AMAZON_MARKETPLACE
);

return <ProductDetailsClient product={product} source={source} ctaEnabled={ctaEnabled} />;
```

**In `ProductDetailsClient.tsx`**:

```ts
interface ProductDetailsClientProps {
  product: ProductRow;
  source?: AnalyticsSource | null;
  ctaEnabled?: boolean;
}
```

Button:
```tsx
<button
  className="pixel-shop-button"
  type="button"
  disabled={!ctaEnabled}
  onClick={ctaEnabled ? () => router.push(`/go/${product.id}?source=${encodeURIComponent(source ?? '')}`) : undefined}
>
  <span>{ctaEnabled ? 'SHOP PRODUCT' : 'Link coming soon'}</span>
  ...
</button>
```

Import `useRouter` from `next/navigation`.

### 5. Verify

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Static checks:

```bash
rg -n "athletica-20" rollout/src/lib/affiliate/affiliate-service.ts   # expect no matches
rg -n "window\.open" rollout/src/app/product/[slug]/                 # expect none
rg -n "AMAZON_TAG\|AMAZON_MARKETPLACE" rollout/.env.example          # expect both present
rg -n "getProductById" rollout/src/lib/products/product-service.ts   # expect present
ls rollout/src/app/go/[id]/route.ts                                  # expect exists
```

### 6. Stop

Do **not** commit or push. The owner reviews and commits. Do **not** build admin auth (ROLL-15), price changes (ROLL-16), Sentry (ROLL-17), or Vitest (ROLL-18).

## Benchmarks (what must be true after this change)

- `affiliate-service.ts` reads `AMAZON_TAG` and `AMAZON_MARKETPLACE` from env; no `athletica-20` anywhere.
- `/go/[id]/route.ts` exists, looks up product by id, derives affiliate URL, records click, 302 redirects.
- CTA disabled when no ASIN or no tag/marketplace; enabled otherwise, navigates to `/go/[id]?source=...`.
- No `window.open` in the product page or client component.
- Click recording skips silently for bots, missing IP, missing salt, or rate-limited.
- `recordClick(id, source, visitorHash)` called with source and hash.
- `.env.example` has `AMAZON_TAG` and `AMAZON_MARKETPLACE` blank.
- `npx tsc --noEmit` passes.
- No admin auth, price changes, Sentry, or test work.

## What is explicitly NOT done in this task

- Admin auth — ROLL-15.
- Price changes — ROLL-16.
- Sentry — ROLL-17.
- Vitest suite — ROLL-18.
- Any commit or push.
