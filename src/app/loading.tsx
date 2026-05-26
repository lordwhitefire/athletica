export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                {/* Breadcrumb skeleton */}
                <div className="flex gap-2">
                    <div className="h-4 w-16 bg-surface-container-highest rounded" />
                    <div className="h-4 w-4 bg-surface-container-highest rounded" />
                    <div className="h-4 w-24 bg-surface-container-highest rounded" />
                </div>

                {/* Title skeleton */}
                <div className="h-12 w-72 bg-surface-container-highest rounded" />
                <div className="h-5 w-96 bg-surface-container-highest rounded" />

                {/* Grid skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="aspect-[4/5] bg-surface-container-highest rounded" />
                            <div className="h-4 w-16 bg-surface-container-highest rounded" />
                            <div className="h-4 w-32 bg-surface-container-highest rounded" />
                            <div className="h-4 w-20 bg-surface-container-highest rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
