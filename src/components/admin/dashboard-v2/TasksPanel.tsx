"use client";

import Panel from "./Panel";
import { useDashboardInteraction } from "./interaction-store";
import type { OverviewIssueItem } from "@/lib/actions/get-dashboard-overview";

const rows: {
    issue: OverviewIssueItem["issue"];
    label: string;
    icon: string;
    tone: string;
}[] = [
    { issue: "image", label: "Products need images", icon: "image_not_supported", tone: "#ff7110" },
    { issue: "asin", label: "Products missing Amazon ASIN", icon: "link_off", tone: "#ff7110" },
    { issue: "category", label: "Products missing categories", icon: "folder_off", tone: "#e7bc2d" },
    { issue: "unpublished", label: "Products unpublished", icon: "publish", tone: "#e7bc2d" },
    { issue: "duplicate", label: "Duplicate products", icon: "content_copy", tone: "#e5e6e3" },
];

export default function TasksPanel({
    quality,
    items,
}: {
    quality: {
        missingImages: number;
        missingAsin: number;
        missingCategories: number;
        duplicates: number;
        unpublished: number;
    };
    items: OverviewIssueItem[];
}) {
    const { openDrawer } = useDashboardInteraction();
    const counts: Record<OverviewIssueItem["issue"], number> = {
        image: quality.missingImages,
        asin: quality.missingAsin,
        category: quality.missingCategories,
        duplicate: quality.duplicates,
        unpublished: quality.unpublished,
    };
    const issues: OverviewIssueItem["issue"][] = ["image", "asin", "category", "unpublished", "duplicate"];

    return (
        <Panel
            title="Tasks Needing Attention"
            action={
                <button
                    type="button"
                    onClick={() => openDrawer({ type: "tasks" })}
                    className="text-[10px] text-zinc-400 hover:text-primary border border-neutral-700 rounded px-2.5 py-1.5 bg-neutral-800 transition-colors"
                >
                    View all tasks
                </button>
            }
        >
            <div>
                {issues.map((issue) => {
                    const row = rows.find((r) => r.issue === issue)!;
                    const count = counts[issue];
                    const detail = items.filter((i) => i.issue === issue);
                    return (
                        <div key={issue} className="border-t border-neutral-800/70">
                            <button
                                type="button"
                                onClick={() => openDrawer({ type: "task", issue })}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors text-left"
                            >
                                <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-none"
                                    style={{ backgroundColor: "rgba(255,113,16,.10)", color: row.tone }}
                                >
                                    <span className="material-symbols-outlined text-[14px]">{row.icon}</span>
                                </span>
                                <span className="text-[11px] text-zinc-300 flex-1">{row.label}</span>
                                <span
                                    className="text-[10px] font-bold rounded-full px-2 py-0.5"
                                    style={{
                                        color: count > 0 ? row.tone : "#71717a",
                                        backgroundColor: count > 0 ? "rgba(255,113,16,.10)" : "rgba(113,113,122,.12)",
                                    }}
                                >
                                    {count}
                                </span>
                                <span className="material-symbols-outlined text-[16px] text-zinc-600">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}