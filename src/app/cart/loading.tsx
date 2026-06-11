export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-6xl mx-auto animate-pulse">
                <div className="h-10 w-32 bg-surface-container-highest rounded mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-4 p-4 border border-surface-container-high rounded">
                                <div className="w-24 h-24 bg-surface-container-highest rounded" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
                                    <div className="h-3 w-1/4 bg-surface-container-highest rounded" />
                                    <div className="h-8 w-24 bg-surface-container-highest rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 p-6 border border-surface-container-high rounded h-fit">
                        <div className="h-6 w-24 bg-surface-container-highest rounded" />
                        <div className="h-4 w-full bg-surface-container-highest rounded" />
                        <div className="h-4 w-full bg-surface-container-highest rounded" />
                        <div className="h-12 w-full bg-surface-container-highest rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
