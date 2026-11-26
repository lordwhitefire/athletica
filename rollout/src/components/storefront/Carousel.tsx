// FM-06: Carousel — horizontal scroller of product tiles. Swipeable on touch.
'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products/types';

export function Carousel({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {products.map(p => (
          <Link key={p.id} href={`/product/${p.slug}`} className="group w-48 flex-shrink-0 snap-start">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
              {p.main_image && <Image src={p.main_image} alt={p.name} fill unoptimized sizes="192px" className="object-cover" />}
            </div>
            <h4 className="mt-2 truncate text-sm text-white">{p.name}</h4>
          </Link>
        ))}
      </div>
    </section>
  );
}
