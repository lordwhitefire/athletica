// FM-08: ProductDetailsClient — buy-box with variant selector (URL params) + reviews (omit when no data).
// No price (Amazon policy). CTA → /go/[id] (not window.open). Single-variant → no selector.
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product, ProductVariant } from '@/lib/products/types';

export function ProductDetailsClient({ product, variants = [], reviews }: {
  product: Product;
  variants?: ProductVariant[];
  reviews?: { rating: number; count: number; samples: { title: string; body: string }[] } | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // Single-variant or no variants → no selector (returns null).
  const showSelector = variants.length > 1;

  function selectVariant(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    next.set(key, value);
    router.replace(`/product/${product.slug}?${next.toString()}`, { scroll: false });
  }

  // Determine the currently-selected variant from URL params (if any).
  const selectedSize = sp.get('size');
  const selectedColor = sp.get('color');

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 lg:grid-cols-6">
      {/* 4/6 image gallery */}
      <div className="lg:col-span-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
          {product.main_image && <Image src={product.main_image} alt={product.name} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />}
        </div>
      </div>

      {/* 2/6 buy-box */}
      <div className="lg:col-span-2">
        <div className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-bold text-white">{product.name}</h1>
          {/* NO price pill — Amazon Associates policy */}
        </div>

        {showSelector && (
          <div className="py-6">
            {variants.some(v => (v.attributes as { size?: string })?.size) && (
              <div className="mb-3">
                <span className="mb-1 block text-sm text-neutral-400">Size</span>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(variants.map(v => (v.attributes as { size?: string }).size).filter(Boolean))) .map(size => {
                    const v = variants.find(x => (x.attributes as { size?: string }).size === size);
                    const oos = v?.status === 'archived' || v?.deleted_at != null;
                    return (
                      <button
                        key={size}
                        onClick={() => selectVariant('size', size!)}
                        disabled={oos}
                        aria-disabled={oos}
                        title={oos ? 'Out of Stock' : size!}
                        className={`rounded border px-3 py-1 text-sm ${oos ? 'border-neutral-800 text-neutral-600 line-through' : selectedSize === size ? 'border-white bg-white text-black' : 'border-neutral-700 text-white'}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="py-6 prose prose-invert text-neutral-300" dangerouslySetInnerHTML={{ __html: product.intro || '' }} />

        {/* Reviews block — OMITTED when no data (never faked). */}
        {reviews && reviews.count > 0 && (
          <div className="border-t border-neutral-800 py-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">{'★'.repeat(Math.round(reviews.rating))}</span>
              <span className="text-sm text-neutral-400">{reviews.rating} ({reviews.count} reviews)</span>
            </div>
            {reviews.samples.slice(0, 3).map((r, i) => (
              <blockquote key={i} className="mt-3 border-l border-neutral-700 pl-3 text-sm text-neutral-300">
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </blockquote>
            ))}
            <a href={`https://www.amazon.com/dp/${product.asin}?tag=${process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG ?? ''}#reviews`} target="_blank" rel="nofollow noopener" className="mt-3 inline-block text-sm underline">
              See all on Amazon
            </a>
          </div>
        )}

        {/* CTA — last element, links to /go/[id] (no window.open). Greyed when no ASIN/tag. */}
        <div className="py-6">
          {product.asin ? (
            <Link href={`/go/${product.id}`} className="block rounded bg-[#d1fd40] px-6 py-3 text-center font-bold text-black">
              SHOP PRODUCT
            </Link>
          ) : (
            <span className="block rounded bg-neutral-800 px-6 py-3 text-center font-bold text-neutral-500">
              Link coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsClient;
