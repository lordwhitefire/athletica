// FM-07: ShopGrid — client island. URL search params as state; router.replace {scroll:false}.
// Unavailable variants visible-but-disabled (strike-through). Empty = "No products match." No price.
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products/types';

export function ShopGrid(props: {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  currentQuery: string | null;
  currentCategory: string | null;
  currentSort: string;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page'); // reset to page 1 on filter change
    router.replace(`/shop?${next.toString()}`, { scroll: false });
  }

  if (props.products.length === 0) {
    return <p className="py-16 text-center text-neutral-400">No products match.</p>;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search products"
          defaultValue={props.currentQuery ?? ''}
          onChange={e => update('q', e.target.value || null)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
        <select
          value={props.currentCategory ?? ''}
          onChange={e => update('category', e.target.value || null)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        >
          <option value="">All categories</option>
          {props.categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select
          value={props.currentSort}
          onChange={e => update('sort', e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
        {/* NO price filter — price is never displayed publicly */}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {props.products.map(p => {
          const oos = p.availableForSale === false;
          return (
            <Link key={p.id} href={`/product/${p.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
                {p.main_image && <Image src={p.main_image} alt={p.name} fill unoptimized sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />}
              </div>
              <h3 className={`mt-2 truncate text-sm ${oos ? 'text-neutral-500 line-through' : 'text-white'}`} title={oos ? 'Out of Stock' : p.name}>
                {p.name}
              </h3>
              {oos && <span className="text-xs text-neutral-500">Out of Stock</span>}
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      <nav className="mt-8 flex justify-center gap-2">
        {Array.from({ length: Math.ceil(props.total / props.pageSize) }, (_, i) => i + 1).map(n => (
          <Link
            key={n}
            href={`/shop?${(() => { const next = new URLSearchParams(sp.toString()); next.set('page', String(n)); return next.toString(); })()}`}
            className={`rounded px-3 py-1 ${n === props.page ? 'bg-white text-black' : 'bg-neutral-900 text-white'}`}
          >
            {n}
          </Link>
        ))}
      </nav>
    </>
  );
}
