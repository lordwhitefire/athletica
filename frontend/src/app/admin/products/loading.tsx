export default function ProductsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-9 bg-neutral-800 rounded w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg h-[123px]" />
        ))}
      </div>
      <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
    </div>
  );
}