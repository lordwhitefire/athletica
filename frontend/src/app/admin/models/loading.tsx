import { Suspense } from "react";

export default function ModelsLoading() {
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
      <div className="min-h-screen bg-[#050607] text-[13px] text-[#e5e7e8]">
        <div className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 border-b border-[#1b1f22]">
          <div className="animate-pulse">
            <div className="h-[25px] w-48 bg-neutral-800 rounded" />
            <div className="mt-[7px] h-[13px] w-40 bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="pt-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[8px] border border-[#1b1f22] bg-[#0d0f11] p-4">
              <div className="h-[18px] w-48 bg-neutral-800 animate-pulse rounded mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-[34px] bg-neutral-800/50 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Suspense>
  );
}