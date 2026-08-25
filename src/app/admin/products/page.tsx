import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import ProductCatalogServerWrapper from "@/components/admin/product-catalog/ProductCatalogServerWrapper";
import "@/components/admin/product-catalog/product-catalog-interactions.css";
import {
  getCatalogProducts,
  getCatalogFacets,
  type CatalogFacets,
} from "@/lib/actions/products";

function ProductsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-400 mb-2">Failed to load product catalog.</p>
      <p className="text-xs text-zinc-500 mb-3">{message}</p>
      <button
        type="button"
        data-testid="products-retry"
        onClick={retry}
        className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

async function ProductsBody() {
  const [facetsResult, productsResult] = await Promise.all([
    getCatalogFacets(),
    getCatalogProducts({}),
  ]);

  if (facetsResult.error) {
    return (
      <ProductsError
        message={facetsResult.error.message}
        retry={() => {}}
      />
    );
  }
  if (productsResult.error) {
    return (
      <ProductsError
        message={productsResult.error.message}
        retry={() => {}}
      />
    );
  }

  const facets = facetsResult.data!;
  const initialProducts = productsResult.data.items;

  return (
    <ProductCatalogServerWrapper
      initialProducts={initialProducts}
      categories={facets.categories}
      brands={facets.brands}
      kpis={facets.kpis}
    />
  );
}

export default async function AdminProductsPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <div data-catalog-page className="p-4 md:p-6">
          <ProductsBody />
        </div>
      </div>
    </InteractionProvider>
  );
}