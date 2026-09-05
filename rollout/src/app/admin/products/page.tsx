'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductRow } from '@/lib/database.types';
import { useToasts, ToastViewport } from '@/lib/ui/toast';
import { ConfirmDialog } from '@/lib/ui/confirm-dialog';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/placeholder';
import './admin.css';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'price_asc', label: 'Price Low–High' },
  { value: 'price_desc', label: 'Price High–Low' },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];
type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export default function AdminProductsPage() {
  const { toasts, push, dismiss } = useToasts();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: 'status' | 'delete' } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load data whenever filters/sort/search/page change
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          status,
          sort,
          search: searchDebounced,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/admin/products?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load products');
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [status, sort, searchDebounced, page, reloadKey]);

  const toggleStatus = useCallback(
    async (product: ProductRow) => {
      const nextStatus = product.status === 'published' ? 'unpublished' : 'published';
      setBusy({ id: product.id, action: 'status' });
      try {
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, status: nextStatus }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to update status');
        setItems((prev) => prev.map((p) => (p.id === product.id ? data.item : p)));
        push('success', nextStatus === 'published' ? 'Product published' : 'Product unpublished');
      } catch {
        // Row stays unchanged; toast reports the failure
        push('error', 'Unable to update status');
      } finally {
        setBusy(null);
      }
    },
    [push]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusy({ id: target.id, action: 'delete' });
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(target.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to delete product');
      setItems((prev) => prev.filter((p) => p.id !== target.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
      setBusy(null);
      push('success', 'Product deleted');
      // If deletion empties the current page, move back one
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
    } catch {
      setDeleteTarget(null);
      setBusy(null);
      // Row remains; error toast
      push('error', 'Unable to delete product');
    }
  }, [deleteTarget, items.length, page, push]);

  const resetToFirstPage = () => setPage(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const showSearchEmpty = !loading && !error && items.length === 0 && searchDebounced.length > 0;
  const showCatalogEmpty = !loading && !error && items.length === 0 && searchDebounced.length === 0;

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div className="admin-eyebrow">ROLLOUT 1</div>
          <h1 className="admin-title">Products</h1>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => push('info', 'Editor coming in ROLL-07')}>
            + Add Product
          </button>
        </header>

        <div className="admin-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder="Search name, id, slug, color"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            aria-label="Search products"
          />

          <div className="admin-filter" role="group" aria-label="Filter by status">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`admin-pill ${status === opt.value ? 'is-active' : ''}`}
                onClick={() => {
                  setStatus(opt.value);
                  resetToFirstPage();
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="admin-sort">
            <span className="admin-visually-hidden">Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                resetToFirstPage();
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <span className="admin-count">{total} products</span>
        </div>

        <main className="admin-body">
          {error ? (
            <div className="admin-state">
              <h2 className="admin-state__title">PRODUCTS COULDN&apos;T BE LOADED</h2>
              <p className="admin-state__text">Something went wrong while loading the catalog.</p>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setError(false);
                  setLoading(true);
                  setReloadKey((k) => k + 1);
                }}
              >
                TRY AGAIN
              </button>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="admin-skeleton">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="admin-skeleton__row" key={i} />
              ))}
            </div>
          ) : showSearchEmpty ? (
            <div className="admin-state">
              <h2 className="admin-state__title">NO PRODUCTS FOUND</h2>
              <p className="admin-state__text">Try another search term or clear the filter.</p>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setSearch('');
                  setSearchDebounced('');
                  resetToFirstPage();
                }}
              >
                CLEAR SEARCH
              </button>
            </div>
          ) : showCatalogEmpty ? (
            <div className="admin-state">
              <h2 className="admin-state__title">No products yet.</h2>
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => push('info', 'Editor coming in ROLL-07')}>
                + ADD PRODUCT
              </button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">ID</th>
                    <th scope="col">Status</th>
                    <th scope="col">Price</th>
                    <th scope="col">Tags</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => {
                    const rowBusy = busy?.id === product.id;
                    return (
                      <tr key={product.id}>
                        <td className="admin-product-cell">
                          <img
                            className="admin-thumb"
                            src={product.main_image ?? FALLBACK_PRODUCT_IMAGE}
                            alt=""
                          />
                          <div className="admin-product-meta">
                            <Link className="admin-product-name" href={`/admin/products/${product.id}/edit`}>
                              {product.name}
                            </Link>
                            {product.color && <span className="admin-product-color">{product.color}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="admin-id">{product.id}</span>
                        </td>
                        <td>
                          <span className={`admin-status admin-status--${product.status}`}>{product.status}</span>
                        </td>
                        <td>{typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : '—'}</td>
                        <td>
                          {product.tags && product.tags.length > 0 && (
                            <div className="admin-tags">
                              {product.tags.slice(0, 3).map((tag) => (
                                <span className="admin-tag" key={tag}>
                                  {tag}
                                </span>
                              ))}
                              {product.tags.length > 3 && <span className="admin-tag">+{product.tags.length - 3}</span>}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="admin-actions">
                            <Link className="admin-action admin-action--link" href={`/admin/products/${product.id}/edit`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="admin-action"
                              disabled={rowBusy}
                              onClick={() => toggleStatus(product)}
                            >
                              {rowBusy && busy?.action === 'status'
                                ? product.status === 'published'
                                  ? 'Unpublishing...'
                                  : 'Publishing...'
                                : product.status === 'published'
                                  ? 'Unpublish'
                                  : 'Publish'}
                            </button>
                            <button
                              type="button"
                              className="admin-action admin-action--danger"
                              disabled={rowBusy}
                              onClick={() => setDeleteTarget(product)}
                            >
                              {rowBusy && busy?.action === 'delete' ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="admin-pagination">
                <span className="admin-pagination__info">
                  Showing {from} to {to} of {total} products
                </span>
                <div className="admin-pagination__controls">
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : ''}
        description="This will permanently remove the product from the catalog."
        confirmLabel="Delete Product"
        busy={busy?.action === 'delete' && busy?.id === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}