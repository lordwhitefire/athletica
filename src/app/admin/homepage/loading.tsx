// Next.js App Router auto-renders this file inside <Suspense> while the
// parent page.tsx server component (getHomepageDoc) is running. Without
// it, /admin/homepage shows a blank page for the entire duration of the
// Sanity fetch — historically 60+ seconds with a large homepage doc.
// See issues/homepage-editor-bugs.md bug #11.
export default function Loading() {
    return (
        <div className="min-h-[70vh] bg-surface px-4 py-8 animate-pulse">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top toolbar skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-surface-container-highest rounded" />
                        <div className="h-4 w-48 bg-surface-container-highest rounded" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-28 bg-surface-container-highest rounded" />
                        <div className="h-10 w-28 bg-surface-container-highest rounded" />
                    </div>
                </div>

                {/* Banner card skeleton */}
                <div className="bg-surface-container rounded p-6 space-y-4">
                    <div className="h-5 w-32 bg-surface-container-highest rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="aspect-[16/9] bg-surface-container-highest rounded" />
                        <div className="space-y-3 py-2">
                            <div className="h-4 w-full bg-surface-container-highest rounded" />
                            <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
                            <div className="h-4 w-1/2 bg-surface-container-highest rounded" />
                            <div className="h-9 w-40 bg-surface-container-highest rounded mt-4" />
                        </div>
                    </div>
                </div>

                {/* Section card skeletons */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-surface-container rounded p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-40 bg-surface-container-highest rounded" />
                            <div className="h-8 w-20 bg-surface-container-highest rounded" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="space-y-2">
                                    <div className="aspect-square bg-surface-container-highest rounded" />
                                    <div className="h-3 w-20 bg-surface-container-highest rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
