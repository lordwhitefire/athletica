// FM-19: Geo-routing — IP → country → marketplace. Fallback to default.
import { resolveIp, resolveCountry } from '@/lib/analytics/ip-chain';
import { createServiceClient } from '@/lib/supabase/server';

export async function resolveAmazonUrlForVisitor(args: {
  asin: string;
  productId: string;
  headers: { get: (n: string) => string | null };
}): Promise<{ url: string | null; marketplace: string }> {
  const country = resolveCountry(args.headers);
  const sb = createServiceClient();

  let marketplaceSlug: string | null = null;
  if (country) {
    const { data } = await sb.from('marketplaces').select('slug,tag').eq('country_code', country.toUpperCase()).maybeSingle();
    const m = data as { slug: string; tag: string | null } | null;
    if (m && m.tag) marketplaceSlug = m.slug;
  }
  if (!marketplaceSlug) {
    const { data: product } = await sb.from('products').select('default_marketplace').eq('id', args.productId).maybeSingle();
    marketplaceSlug = (product as { default_marketplace: string | null } | null)?.default_marketplace ?? 'US';
  }
  const { data: mp } = await sb.from('marketplaces').select('domain,tag').eq('slug', marketplaceSlug).maybeSingle();
  const m = mp as { domain: string; tag: string | null } | null;
  if (!m || !m.tag) return { url: null, marketplace: marketplaceSlug };
  return { url: `https://${m.domain}/dp/${args.asin}?tag=${m.tag}`, marketplace: marketplaceSlug };
}

export { resolveIp };
