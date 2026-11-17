// FM-06: Storefront homepage — curated 3-up hero grid + browse carousel + footer.
// Leads with editorial curation (3 picks, not twelve). Replaces the old MVP 404-at-root.
import { getFeaturedProducts, getCarouselProducts } from '@/lib/products/product-service';
import { ThreeItemGrid } from '@/components/storefront/ThreeItemGrid';
import { Carousel } from '@/components/storefront/Carousel';
import { Footer } from '@/components/storefront/Footer';
import Link from 'next/link';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import '@/components/storefront/storefront.css';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, carousel] = await Promise.all([
    getFeaturedProducts(3),
    getCarouselProducts(12),
  ]);
  return (
    <>
      <StorefrontHeader />
      <main>
        <section className="storefront-home-intro">
          <p className="storefront-eyebrow">BUILT FOR THE BEAUTIFUL GAME</p>
          <h1 className="storefront-home-title">Gear up.<br /><span>Play bigger.</span></h1>
          <p className="storefront-home-copy">
            A considered edit of football boots and equipment for players who
            take every touch seriously.
          </p>
        </section>
        <ThreeItemGrid products={featured} />
        <div className="storefront-section-heading">
          <h2>Explore the collection</h2>
          <Link href="/shop">View all gear ↗</Link>
        </div>
        <Carousel products={carousel} />
      </main>
      <Footer />
    </>
  );
}
