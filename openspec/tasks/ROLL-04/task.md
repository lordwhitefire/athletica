# ROLL-04: Rollout Amazon Affiliate Service + RLS Policies

## What and why

The Rollout system needs an Amazon affiliate service to derive affiliate URLs from product ASINs. This service will be used by:
- The customer product details page (ROLL-05) — to generate the Shop Product link

Additionally, this task adds the missing RLS INSERT policy for `rollout.analytics` so the customer page can record views/clicks.

## Hard rules

1. **Use the existing Supabase client** — import from `rollout/src/lib/supabase/server.ts`
2. **Use the existing types** — import from `rollout/src/lib/database.types.ts`
3. **Backend only** — the frontend requests the URL, never constructs it
4. **ASIN stored, URL derived** — only store the ASIN, generate the URL at click time
5. **RLS INSERT policy** — add the missing policy for `anon` to insert analytics events

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Create the Affiliate Service

Create `rollout/src/lib/affiliate/affiliate-service.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/server';

// Affiliate configuration (stored in code for Rollout 1)
// In production, this could move to a config table or env vars
const AFFILIATE_CONFIG = {
  tag: 'athletica-20',
  marketplace: 'amazon.com',
  locale: 'en_US',
};

function getAmazonHost(locale: string, marketplace: string): string {
  if (locale === 'en_GB' || /amazon\.co\.uk/i.test(marketplace)) return 'www.amazon.co.uk';
  if (locale === 'en_CA' || /amazon\.ca/i.test(marketplace)) return 'www.amazon.ca';
  if (locale === 'de_DE' || /amazon\.de/i.test(marketplace)) return 'www.amazon.de';
  return 'www.amazon.com';
}

export interface AffiliateUrlResult {
  url: string | null;
  error?: string;
}

export async function getAffiliateUrl(productId: string): Promise<AffiliateUrlResult> {
  const supabase = createAdminClient();

  // Get the product's ASIN
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('asin')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    return { url: null, error: 'Product not found' };
  }

  if (!product.asin) {
    return { url: null, error: 'No ASIN available for this product' };
  }

  // Derive the affiliate URL
  const host = getAmazonHost(AFFILIATE_CONFIG.locale, AFFILIATE_CONFIG.marketplace);
  const tag = AFFILIATE_CONFIG.tag;
  const asin = encodeURIComponent(product.asin);

  const url = `https://${host}/dp/${asin}/ref=as_li_ss_tl?ie=UTF8&linkCode=sl1&tag=${encodeURIComponent(tag)}`;

  return { url };
}

export async function getAffiliateUrlByAsin(asin: string): Promise<AffiliateUrlResult> {
  if (!asin) {
    return { url: null, error: 'No ASIN provided' };
  }

  const host = getAmazonHost(AFFILIATE_CONFIG.locale, AFFILIATE_CONFIG.marketplace);
  const tag = AFFILIATE_CONFIG.tag;
  const encodedAsin = encodeURIComponent(asin);

  const url = `https://${host}/dp/${encodedAsin}/ref=as_li_ss_tl?ie=UTF8&linkCode=sl1&tag=${encodeURIComponent(tag)}`;

  return { url };
}
```

### 2. Create the RLS Policy SQL

Create `rollout/supabase-rollout-rls-policies.sql`:

```sql
-- RLS Policies for Rollout schema
-- Run this in the Supabase SQL Editor

-- 1. Products: anon can read published products
CREATE POLICY "anon_can_read_published_products"
  ON rollout.products
  FOR SELECT
  TO anon
  USING (status = 'published');

-- 2. Products: service_role can do everything
CREATE POLICY "admin_full_access_products"
  ON rollout.products
  FOR ALL
  TO service_role
  USING (true);

-- 3. Analytics: anon can insert view/click events
CREATE POLICY "anon_can_insert_analytics"
  ON rollout.analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Analytics: service_role can read analytics
CREATE POLICY "admin_can_read_analytics"
  ON rollout.analytics
  FOR SELECT
  TO service_role
  USING (true);
```

### 3. Verify the service compiles

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

### 4. Commit the changes

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/lib/affiliate/ rollout/supabase-rollout-rls-policies.sql
git commit -m "feat(rollout): add affiliate service and RLS policies"
```

**Do NOT push.** Owner reviews and pushes.

## Benchmarks (what must be true after this change)

- `rollout/src/lib/affiliate/affiliate-service.ts` exists and exports:
  - `getAffiliateUrl(productId)` — derive URL from product's ASIN
  - `getAffiliateUrlByAsin(asin)` — derive URL directly from ASIN
- `rollout/supabase-rollout-rls-policies.sql` exists with:
  - `anon_can_read_published_products` — public reads published products
  - `admin_full_access_products` — service_role full access
  - `anon_can_insert_analytics` — public can record views/clicks
  - `admin_can_read_analytics` — admin reads analytics
- `npx tsc --noEmit` passes with no errors
- One commit with message `feat(rollout): add affiliate service and RLS policies`

## What is explicitly NOT done in this task

- No UI pages (that's ROLL-05, ROLL-08)
- No product service changes (that's ROLL-02)
- No analytics service changes (that's ROLL-03)
- The SQL file is created but **NOT executed** — owner runs it in the Supabase dashboard
- No tests (add later with the UI)