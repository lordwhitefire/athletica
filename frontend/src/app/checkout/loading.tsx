export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-12">
            <div className="max-w-2xl mx-auto animate-pulse space-y-6">
                <div className="h-10 w-40 bg-surface-container-highest rounded" />
                <div className="space-y-4 p-6 border border-surface-container-high rounded">
                    <div className="h-4 w-24 bg-surface-container-highest rounded" />
                    <div className="h-10 w-full bg-surface-container-highest rounded" />
                    <div className="h-10 w-full bg-surface-container-highest rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-surface-container-highest rounded" />
                        <div className="h-10 bg-surface-container-highest rounded" />
                    </div>
                    <div className="h-12 w-full bg-surface-container-highest rounded" />
                </div>
            </div>
        </div>
    );
}
