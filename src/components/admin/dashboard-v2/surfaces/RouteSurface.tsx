"use client";

import Link from "next/link";
import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";
import { routeMeta } from "../meta";

export default function RouteSurface({ route }: { route: string }) {
    const { closeDrawer } = useDashboardInteraction();
    const meta = routeMeta[route] ?? { title: "Admin Surface", description: "Admin workspace." };

    return (
        <DrawerShell title={meta.title} description={meta.description} onClose={closeDrawer}>
            <div className="px-5 py-12 flex flex-col items-center justify-center text-center gap-4">
                <span className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center text-zinc-500">
                    <span className="material-symbols-outlined text-[26px]">bar_chart</span>
                </span>
                <h3 className="text-sm font-black text-white">{meta.title}</h3>
                <p className="text-xs text-zinc-400 max-w-[260px] leading-relaxed">
                    This interaction surface is now mounted as a real stateful route layer. The existing visual
                    dashboard remains unchanged.
                </p>
                <div className="grid grid-cols-3 gap-2 w-full max-w-[300px]">
                    {[
                        ["State", "Ready"],
                        ["Responsive", "Enabled"],
                        ["Interaction", "Enabled"],
                    ].map(([label, value]) => (
                        <div key={label} className="bg-neutral-800/50 border border-neutral-800 rounded p-3">
                            <span className="block text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
                            <strong className="block text-[11px] text-[#b7f52a] mt-1">{value}</strong>
                        </div>
                    ))}
                </div>
                {meta.href && (
                    <Link
                        href={meta.href}
                        className="text-[10px] font-bold bg-[#b7f52a] text-black rounded px-3 py-1.5 hover:brightness-110 transition-all"
                    >
                        Open related page
                    </Link>
                )}
            </div>
        </DrawerShell>
    );
}