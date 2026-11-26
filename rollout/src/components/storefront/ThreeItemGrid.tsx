// FM-06: ThreeItemGrid — 3 curated hero products above the fold. No price on tiles.
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import type { Product } from '@/lib/products/types';

export function ThreeItemGrid({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-4 py-8 md:grid-cols-3">
      {products.map(p => (
        <Suspense key={p.id} fallback={<div className="aspect-square animate-pulse bg-neutral-900" />}>
          <Link href={`/product/${p.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
              {p.main_image && (
                <Image src={p.main_image} alt={p.name} fill priority unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform group-hover:scale-105" />
              )}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white">{p.name}</h3>
          </Link>
        </Suspense>
      ))}
    </section>
  );
}
