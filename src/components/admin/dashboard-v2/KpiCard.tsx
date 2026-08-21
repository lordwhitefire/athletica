import Link from "next/link";

const tones: Record<string, { color: string; bg: string }> = {
    lime: { color: "#b7f52a", bg: "rgba(183,245,42,.12)" },
    green: { color: "#b5dd4e", bg: "rgba(130,193,45,.14)" },
    orange: { color: "#ff7110", bg: "rgba(255,113,16,.10)" },
    yellow: { color: "#e7bc2d", bg: "rgba(228,192,39,.10)" },
    blue: { color: "#51a8fb", bg: "rgba(77,164,245,.10)" },
};

export default function KpiCard({
    icon,
    title,
    value,
    note,
    tone,
    href,
}: {
    icon: string;
    title: string;
    value: number | string;
    note: string;
    tone: keyof typeof tones;
    href: string;
}) {
    const t = tones[tone];
    return (
        <Link
            href={href}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 hover:border-primary/40 transition-colors group block relative min-h-[120px]"
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: t.bg, color: t.color }}
            >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <p className="text-xs text-zinc-400">{title}</p>
            <p className="text-2xl font-black text-white mt-1 tracking-tight">{value}</p>
            <p className="text-[10px] mt-1" style={{ color: t.color }}>
                {note}
            </p>
        </Link>
    );
}