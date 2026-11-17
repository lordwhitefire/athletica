// FM-06: Storefront homepage — curated 3-up hero grid + browse carousel + footer.
// Leads with editorial curation (3 picks, not twelve). Replaces the old MVP 404-at-root.
import { getFeaturedProducts, getCarouselProducts } from '@/lib/products/product-service';
import { ThreeItemGrid } from '@/components/storefront/ThreeItemGrid';
import { Carousel } from '@/components/storefront/Carousel';
import { Footer } from '@/components/storefront/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, carousel] = await Promise.all([
    getFeaturedProducts(3),
    getCarouselProducts(12),
  ]);
  return (
    <>
      <ThreeItemGrid products={featured} />
      <Carousel products={carousel} />
      <Footer />
    </>
  );
}
