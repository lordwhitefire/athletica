export default function OverviewLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-9 bg-neutral-800 rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg h-[120px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg h-[280px]" />
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg h-[280px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg h-[200px]" />
        ))}
      </div>
    </div>
  );
}