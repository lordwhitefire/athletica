// FM-09: sitemap.ts — lists /, /shop, active non-hidden products. Draft/archived/hidden excluded.
import type { MetadataRoute } from 'next';
import { listAllPublicProductSlugs, listCategorySlugs } from '@/lib/products/product-service';

const HIDDEN = 'hidden';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://athletica.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([
    listAllPublicProductSlugs(),
    listCategorySlugs(),
  ]);
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map(c => ({ url: `${SITE}/shop?category=${c}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })),
    ...slugs.filter(s => !(s.tags ?? []).includes(HIDDEN)).map(s => ({ url: `${SITE}/product/${s.slug}`, lastModified: s.updatedAt ?? now, changeFrequency: 'weekly', priority: 0.8 })),
  ];
}
