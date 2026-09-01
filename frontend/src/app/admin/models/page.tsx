import { Suspense } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import ModelsManagementLayer from "@/components/admin/models/ModelsManagementLayer";
import { getModelsAdmin, getModelFormOptions } from "@/lib/actions/models";

function ModelsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-[6px] border border-[#5a2a1d] bg-[#241310] px-3 py-2">
        <strong className="text-[#e4612b]">Could not load models</strong>
        <p className="text-[10px] text-[#e4612b]">{message}</p>
        <button type="button" className="mt-1.5 text-[10px] font-semibold text-[#b8e51f] underline hover:brightness-110" onClick={retry}>
          Retry
        </button>
      </div>
    </div>
  );
}

async function ModelsBody() {
  const [modelsResult, optionsResult] = await Promise.all([
    getModelsAdmin(),
    getModelFormOptions(),
  ]);

  const groups = modelsResult.data ?? [];
  const formOptions = optionsResult.data ?? { categories: [], brands: [] };

  const error = !modelsResult.data
    ? modelsResult.error?.message
    : !optionsResult.data
      ? optionsResult.error?.message
      : null;

  if (error) {
    return (
      <ModelsError
        message={error}
        retry={() => {}}
      />
    );
  }

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
      <ModelsManagementLayer initialGroups={groups} initialFormOptions={formOptions} />
    </Suspense>
  );
}

export default async function AdminModelsPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <div className="p-4 md:p-6">
          <ModelsBody />
        </div>
      </div>
    </InteractionProvider>
  );
}