"use client";

import ProductCatalogInteractionLayer from "./ProductCatalogInteractionLayer";
import type { CatalogProduct } from "./product-catalog.interactions";
import type { CatalogFacets } from "@/lib/actions/products";
import {
  getCatalogProducts,
  updateCatalogProduct,
  deleteProduct,
  bulkSetProductStatus,
  bulkAssignCategory,
  bulkAssignBrand,
  bulkSetAsin,
  bulkDeleteProducts,
  exportProductMetadata,
} from "@/lib/actions/products";

function pctOf(n: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((n / total) * 1000) / 10}%`;
}

function downloadRows(rows: { name: string; sku: string }[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `athletica-catalog-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function KpiCards({ kpis }: { kpis: CatalogFacets["kpis"] }) {
  const total = kpis.total;
  const cards = [
    {
      icon: "inventory_2",
      label: "Total Products",
      value: total.toLocaleString(),
      note: kpis.createdThisMonth > 0 ? `↑ ${kpis.createdThisMonth} this month` : "0 this month",
      tone: "lime",
    },
    {
      icon: "check_circle",
      label: "Active Products",
      value: kpis.active.toLocaleString(),
      note: `${pctOf(kpis.active, total)} of total`,
      tone: "lime",
    },
    {
      icon: "block",
      label: "Unpublished",
      value: kpis.unpublished.toLocaleString(),
      note: `${pctOf(kpis.unpublished, total)} of total`,
      tone: "orange",
    },
    {
      icon: "link_off",
      label: "Missing Amazon ASIN",
      value: kpis.missingAsin.toLocaleString(),
      note: `${pctOf(kpis.missingAsin, total)} of total`,
      tone: "orange",
    },
    {
      icon: "image_not_supported",
      label: "Missing Images",
      value: kpis.missingImages.toLocaleString(),
      note: `${pctOf(kpis.missingImages, total)} of total`,
      tone: "orange",
    },
    {
      icon: "folder_off",
      label: "Missing Categories",
      value: kpis.missingCategories.toLocaleString(),
      note: `${pctOf(kpis.missingCategories, total)} of total`,
      tone: "orange",
    },
  ];

  return (
    <section className="kpis">
      {cards.map((card) => (
        <article key={card.label} className={`kpi${card.tone === "orange" ? " orange" : ""}`}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <div className="kpi-label">{card.label}</div>
          </div>
          <div className="kpi-value">{card.value}</div>
          <div className={`kpi-meta ${card.tone}`}>{card.note}</div>
        </article>
      ))}
    </section>
  );
}

export default function ProductCatalogServerWrapper({
  initialProducts,
  categories,
  brands,
  kpis,
}: {
  initialProducts: CatalogProduct[];
  categories: string[];
  brands: string[];
  kpis: CatalogFacets["kpis"];
}) {
  return (
    <ProductCatalogInteractionLayer
      products={initialProducts}
      categories={categories}
      brands={brands}
      kpis={<KpiCards kpis={kpis} />}
      onSearch={(query) => {
        getCatalogProducts({ search: query }).then((result) => {
          if (!result.error) {
            // Products are refreshed via the interaction layer's internal state
          }
        });
      }}
      onFilter={(filters) => {
        getCatalogProducts({
          search: filters.search,
          category: filters.category === "all" ? undefined : filters.category,
          brand: filters.brand === "all" ? undefined : filters.brand,
          status: filters.status === "all" ? undefined : (filters.status as "published" | "unpublished"),
          missingData: filters.missingData === "all" ? undefined : (filters.missingData as "asin" | "image" | "category" | "none"),
          sort: filters.sort,
        }).then((result) => {
          if (!result.error) {
            // Products are refreshed via the interaction layer's internal state
          }
        });
      }}
      onUpdateProduct={async (id, payload) => {
        const result = await updateCatalogProduct(id, payload);
        if (result.error) throw new Error(result.error.message ?? "Action failed");
      }}
      onDeleteProduct={async (id) => {
        const result = await deleteProduct(id);
        if (result.error) throw new Error(result.error.message ?? "Action failed");
      }}
      onBulkAction={async (action, ids, payload) => {
        switch (action) {
          case "publish": {
            const r = await bulkSetProductStatus(ids, "published");
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "unpublish": {
            const r = await bulkSetProductStatus(ids, "unpublished");
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "delete": {
            const r = await bulkDeleteProducts(ids);
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "assign-category": {
            const r = await bulkAssignCategory(ids, String(payload?.value ?? ""));
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "assign-brand": {
            const r = await bulkAssignBrand(ids, String(payload?.value ?? ""));
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "add-asin": {
            const r = await bulkSetAsin(ids, String(payload?.asin ?? ""));
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
          case "export": {
            const r = await exportProductMetadata(ids);
            if (r.error) throw new Error(r.error.message ?? "Action failed");
            break;
          }
        }
      }}
      onExport={async (ids) => {
        const result = await exportProductMetadata(ids);
        if (result.error) throw new Error(result.error.message ?? "Action failed");
        if (result.data) downloadRows(result.data.rows);
      }}
    />
  );
}
