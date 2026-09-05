'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductRow } from '@/lib/database.types';
import { useToasts, ToastViewport } from '@/lib/ui/toast';
import ProductEditor from '../../product-editor';
import '../../admin.css';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { toasts, push, dismiss } = useToasts();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { id } = await params;
      setLoading(true);
      setError(false);
      setNotFound(false);
      try {
        const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setProduct(null);
        } else if (!res.ok) {
          throw new Error(data.error || 'Unable to load product');
        } else {
          setProduct(data.item);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const tryAgain = useCallback(() => setReloadKey((k) => k + 1), []);

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <div className="edit-page-header">
          <Link className="admin-action admin-action--link" href="/admin/products">
            ← Back to products
          </Link>
        </div>

        {loading ? (
          <div className="admin-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="admin-skeleton__row" key={i} />
            ))}
          </div>
        ) : notFound ? (
          <div className="admin-state">
            <h2 className="admin-state__title">PRODUCT NOT FOUND</h2>
            <p className="admin-state__text">This product is no longer available.</p>
            <Link className="admin-btn" href="/admin/products">
              Back to products
            </Link>
          </div>
        ) : error ? (
          <div className="admin-state">
            <h2 className="admin-state__title">UNABLE TO LOAD PRODUCT</h2>
            <p className="admin-state__text">Something went wrong while loading the product.</p>
            <button type="button" className="admin-btn" onClick={tryAgain}>
              TRY AGAIN
            </button>
          </div>
        ) : (
          product && (
            <ProductEditor mode="edit" initial={product} onSaved={() => push('success', 'Changes saved')} />
          )
        )}
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}