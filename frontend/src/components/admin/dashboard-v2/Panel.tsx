export default function Panel({
    title,
    action,
    children,
    className = "",
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden ${className}`}>
            <div className="h-13 px-4 flex items-center justify-between border-b border-neutral-800 min-h-[52px]">
                <h2 className="text-sm font-bold text-zinc-200">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}