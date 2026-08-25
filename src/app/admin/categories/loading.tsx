import { Suspense } from "react";

export default function CategoriesLoading() {
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
            <div className="h-[25px] w-64 bg-neutral-800 rounded" />
            <div className="mt-[7px] h-[13px] w-48 bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="grid gap-4 pt-4 min-[1180px]:grid-cols-[304px_minmax(0,1fr)]">
          <section className="flex min-h-[748px] flex-col overflow-hidden rounded-[8px] border border-[#1b1f22] bg-[#0d0f11]">
            <div className="flex h-[53px] items-center justify-between px-4">
              <div className="h-[14px] w-32 bg-neutral-800 animate-pulse rounded" />
            </div>
            <div className="flex gap-2 px-4 pb-3">
              <div className="flex h-[36px] flex-1 min-w-0 items-center gap-[9px] rounded-[7px] border border-[#25292d] bg-[#0d0f11] px-[11px] animate-pulse" />
              <div className="h-[36px] w-[36px] bg-neutral-800 animate-pulse rounded" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-[34px] bg-neutral-800/50 rounded animate-pulse" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </Suspense>
  );
}