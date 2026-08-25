import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import BulkImportInteractionLayer from "@/components/admin/bulk-import/BulkImportInteractionLayer";
import {
  getCatalogProducts,
  getImportValidationData,
} from "@/lib/actions/products";

function ImportError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-400 mb-2">Failed to load the import center.</p>
      <p className="text-xs text-zinc-500 mb-3">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

async function ImportBody() {
  const [validationResult, productsResult] = await Promise.all([
    getImportValidationData(),
    getCatalogProducts({}),
  ]);

  if (validationResult.error) {
    return (
      <ImportError
        message={validationResult.error.message}
        retry={() => {}}
      />
    );
  }
  if (productsResult.error) {
    return (
      <ImportError
        message={productsResult.error.message}
        retry={() => {}}
      />
    );
  }

  return (
    <BulkImportInteractionLayer
      products={productsResult.data.items}
      validation={validationResult.data}
    />
  );
}

export default async function AdminImportCenterPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <div data-import-center className="p-4 md:p-6">
          <ImportBody />
        </div>
      </div>
    </InteractionProvider>
  );
}