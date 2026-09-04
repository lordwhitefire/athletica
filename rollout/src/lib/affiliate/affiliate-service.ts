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
