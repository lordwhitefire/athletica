import { Suspense } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import { BrandManagementInteractionLayer } from "@/components/admin/brands/BrandManagementInteractionLayer";
import { BrandManagementPresentation } from "@/components/admin/brands/BrandManagementPresentation";
import { getAllBrandsAdmin } from "@/lib/actions/brands";

function BrandsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <div className="brand-error-panel">
        <strong>Could not load brands</strong>
        <p>{message}</p>
        <button type="button" className="brand-interaction-primary" onClick={retry}>
          Retry
        </button>
      </div>
    </div>
  );
}

async function BrandsBody() {
  const result = await getAllBrandsAdmin();

  if (!result.data) {
    return (
      <BrandsError
        message={result.error?.message ?? "Could not load brands."}
        retry={() => {}}
      />
    );
  }

  const brands: Array<{
    id: string;
    name: string;
    tagline: string;
    logo: string;
    products: number;
    amazonClicks: number;
    ctr: number;
    status: "active" | "inactive";
    addedAt: string;
    website: string;
    slug: string;
  }> = (result.data as Array<Record<string, unknown>>).map((b) => {
    const logo = b.logo as { asset?: { _ref?: string } } | null;
    return {
      id: String(b._id ?? ""),
      name: String(b.name ?? ""),
      tagline: "",
      logo: logo?.asset?._ref ?? "",
      products: Number(b.product_count ?? 0),
      amazonClicks: 0,
      ctr: 0,
      status: "active",
      addedAt: String(b.created_at ?? new Date().toISOString()).slice(0, 10),
      website: "",
      slug: String(b.slug ?? ""),
    };
  });

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
      <BrandManagementInteractionLayer initialBrands={brands}>
        <BrandManagementPresentation />
      </BrandManagementInteractionLayer>
    </Suspense>
  );
}

export default async function AdminBrandsPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <div className="p-4 md:p-6">
          <BrandsBody />
        </div>
      </div>
    </InteractionProvider>
  );
}