// FM-22: Reviews service — fetches cached reviews from amazon_product_cache (populated by FM-20).
// Omit when no data (the component handles null). JSON-LD AggregateOffer references the rating when present.

import { createServiceClient } from '@/lib/supabase/server';

export interface ReviewsData {
  rating: number;
  count: number;
  samples: { title: string; body: string }[];
}

export async function getReviews(asin: string, locale = 'US'): Promise<ReviewsData | null> {
  const sb = createServiceClient();
  const cacheKey = `${asin}_${locale}|en|USD`;
  const { data } = await sb.from('amazon_product_cache')
    .select('rating,review_count,review_samples,expiration_time')
    .eq('product_id', cacheKey)
    .maybeSingle();
  const c = data as { rating: number | null; review_count: number | null; review_samples: unknown; expiration_time: string } | null;
  if (!c || c.rating == null || c.review_count == null || c.review_count === 0) return null; // omit when no data
  return {
    rating: c.rating,
    count: c.review_count,
    samples: (c.review_samples as { title: string; body: string }[]) ?? [],
  };
}
