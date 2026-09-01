import { Suspense } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import HomepageManager from "@/components/admin/dashboard-v2/HomepageManager";
import { getHomepageDoc, getDistinctTractions } from "@/lib/actions/homepage";

function HomepageError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-400 mb-2">Failed to load homepage.</p>
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

async function HomepageBody() {
  const [docResult, tractionsResult] = await Promise.all([
    getHomepageDoc(),
    getDistinctTractions(),
  ]);

  if (docResult.error) {
    return (
      <HomepageError
        message={docResult.error.message}
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
      <HomepageManager
        initialDoc={docResult.data}
        initialTractions={tractionsResult.data ?? []}
      />
    </Suspense>
  );
}

export default async function AdminHomepagePage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <HomepageBody />
      </div>
    </InteractionProvider>
  );
}