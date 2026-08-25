import { Suspense } from "react";

function BrandRowSkeleton() {
  return (
    <article className="brand-table-row animate-pulse">
      <td className="brand-table-cell">
        <div className="brand-table-cell-inner">
          <div className="brand-logo-placeholder" />
          <div className="brand-text-skeleton">
            <div className="skeleton-line long" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </td>
      <td className="brand-table-cell"><div className="skeleton-line" /></td>
      <td className="brand-table-cell"><div className="skeleton-line" /></td>
      <td className="brand-table-cell"><div className="skeleton-line short" /></td>
      <td className="brand-table-cell"><div className="skeleton-line short" /></td>
    </article>
  );
}

export default function BrandsLoading() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-9 bg-neutral-800 rounded w-72" />
          <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
          <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-lg" />
        </div>
      }
    >
      <div className="brand-management-table-container">
        <div className="brand-table-header">
          <div className="brand-table-cell">Brand</div>
          <div className="brand-table-cell">Products</div>
          <div className="brand-table-cell">Clicks</div>
          <div className="brand-table-cell">CTR</div>
          <div className="brand-table-cell">Status</div>
        </div>
        <div className="brand-table-body">
          {[...Array(5)].map((_, i) => (
            <BrandRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </Suspense>
  );
}