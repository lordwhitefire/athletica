import type { Metadata } from 'next';
import { Suspense } from 'react';
import { listProducts } from '@/lib/products/product-service';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { ShopGrid } from '@/components/storefront/ShopGrid';
import { Footer } from '@/components/storefront/Footer';
import '@/components/storefront/storefront.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop football gear | Athletica',
  description: 'Browse football boots, training gear and equipment at Athletica.',
  openGraph: {
    title: 'Shop football gear | Athletica',
    description: 'Browse football boots, training gear and equipment at Athletica.',
    type: 'website',
  },
};

type ShopSearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || null;
  const category = params.category?.trim() || null;
  const sort = params.sort === 'popular' ? 'popular' : 'newest';
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 16;

  const result = await listProducts({
    query,
    category,
    sort,
    page,
    pageSize,
  });

  return (
    <>
      <StorefrontHeader />
      <main className="shop-page">
        <p className="shop-page__eyebrow">THE ATHLETICA EDIT</p>
        <h1 className="shop-page__title">Find your<br />next advantage.</h1>
        <p className="shop-page__description">
          Explore football gear selected for the way you play. Choose your equipment,
          compare the details, and continue to the retailer when you are ready.
        </p>
        <div className="shop-page__results">
          <Suspense fallback={<div className="shop-page__loading">{Array.from({ length: 8 }, (_, i) => <div className="shop-page__skeleton" key={i} />)}</div>}>
            <ShopGrid
              products={result.products}
              total={result.total}
              page={page}
              pageSize={pageSize}
              currentQuery={query}
              currentCategory={category}
              currentSort={sort}
              categories={result.categories}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
