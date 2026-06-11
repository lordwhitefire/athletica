export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-6xl mx-auto animate-pulse">
                <div className="h-8 w-32 bg-surface-container-highest rounded mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 w-full bg-surface-container-highest rounded" />
                        ))}
                    </div>
                    <div className="md:col-span-3 space-y-4">
                        <div className="h-6 w-48 bg-surface-container-highest rounded" />
                        <div className="h-4 w-full bg-surface-container-highest rounded" />
                        <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
                        <div className="h-10 w-full bg-surface-container-highest rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
