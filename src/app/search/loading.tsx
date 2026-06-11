export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-7xl mx-auto animate-pulse space-y-8">
                <div className="h-8 w-48 bg-surface-container-highest rounded" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-[4/5] bg-surface-container-highest rounded" />
                            <div className="h-3 w-16 bg-surface-container-highest rounded" />
                            <div className="h-3 w-24 bg-surface-container-highest rounded" />
                            <div className="h-3 w-20 bg-surface-container-highest rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
