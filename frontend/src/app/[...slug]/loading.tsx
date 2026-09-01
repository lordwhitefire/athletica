export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-7xl mx-auto">
                <div className="animate-pulse space-y-8">
                    <div className="flex gap-2">
                        <div className="h-4 w-16 bg-surface-container-highest rounded" />
                        <div className="h-4 w-4 bg-surface-container-highest rounded" />
                        <div className="h-4 w-24 bg-surface-container-highest rounded" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="aspect-[4/5] bg-surface-container-highest rounded" />
                        <div className="space-y-6">
                            <div className="h-8 w-3/4 bg-surface-container-highest rounded" />
                            <div className="h-4 w-1/4 bg-surface-container-highest rounded" />
                            <div className="h-6 w-1/3 bg-surface-container-highest rounded" />
                            <div className="h-16 w-full bg-surface-container-highest rounded" />
                            <div className="flex gap-3">
                                <div className="h-12 w-20 bg-surface-container-highest rounded" />
                                <div className="h-12 w-20 bg-surface-container-highest rounded" />
                                <div className="h-12 w-20 bg-surface-container-highest rounded" />
                            </div>
                            <div className="h-12 w-full bg-surface-container-highest rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
