export default function MediaLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-9 bg-neutral-800 rounded w-72" />
      <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-square bg-neutral-900 border border-neutral-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}