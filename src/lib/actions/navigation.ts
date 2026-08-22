"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { navigationSchema } from "@/lib/schemas/navigation";
import { generateId } from "@/lib/rebuild-nav-urls";
import {
  getModelNavTree,
} from "@/lib/content/content-service";
import type { ModelNavNode } from "@/lib/content/content-service";

interface NavInputRow {
    _key?: string;
    label: string;
    href?: string;
    children?: NavInputRow[];
}

function normalizeRoute(href: string | undefined): string | null {
    const value = (href ?? "").trim();
    if (!value) return null;
    if (value.startsWith("/en/adultos/")) return value.replace("/en/adultos", "");
    return value;
}

function collectPayloadIds(items: NavInputRow[], into: Set<string>): void {
    for (const item of items) {
        if (item._key) into.add(item._key);
        if (item.children?.length) collectPayloadIds(item.children, into);
    }
}

async function persistNavTree(
    items: NavInputRow[],
    parentId: string | null,
    orderStart: number,
): Promise<{ nextOrder: number }> {
    let order = orderStart;
    for (const item of items) {
        const id = item._key || generateId();
        const route = normalizeRoute(item.href);
        const { error } = await adminSupabase.from("navigation").upsert(
            { id, parent_id: parentId || null, label: item.label, route, order },
            { onConflict: "id" },
        );
        if (error) throw error;
        order += 1;
        if (item.children?.length) {
            const result = await persistNavTree(item.children, id, order);
            order = result.nextOrder;
        }
    }
    return { nextOrder: order };
}

interface EditorNavItem {
    _key: string;
    label: string;
    href: string;
    children: EditorNavItem[];
}

export async function getNavigationDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const { data, error } = await adminSupabase
            .from("navigation")
            .select("*")
            .order("order", { ascending: true });
        if (error) throw error;
        const rows = data ?? [];
        const childrenOf = new Map<string | null, typeof rows>();
        for (const row of rows) {
            const key = row.parent_id ?? null;
            if (!childrenOf.has(key)) childrenOf.set(key, []);
            childrenOf.get(key)!.push(row);
        }
        const toEditorItem = (row: (typeof rows)[number]): EditorNavItem => ({
            _key: row.id,
            label: row.label,
            href: row.route ?? "",
            children: (childrenOf.get(row.id) ?? []).map(toEditorItem),
        });
        return ok({ _id: "navigation", items: (childrenOf.get(null) ?? []).map(toEditorItem) });
    } catch (err) {
        return fromCaughtError(err, "navigation_doc_fetch_failed");
    }
}

export async function saveNavigation(items: Record<string, unknown>[]): Promise<ApiResult<{ saved: true }>> {
    try {
        const parsed = validateOrFail(navigationSchema, items);
        if ("error" in parsed) return parsed.error;

        const payload = parsed.data as unknown as NavInputRow[];

        // Remove rows the editor no longer contains before upserting, so a
        // dropped subtree cannot leave orphans behind.
        const keepIds = new Set<string>();
        collectPayloadIds(payload, keepIds);
        const existingIds: string[] = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
            const { data: chunk, error: fetchError } = await adminSupabase
                .from("navigation")
                .select("id")
                .range(from, from + pageSize - 1);
            if (fetchError) throw fetchError;
            if (!chunk || chunk.length === 0) break;
            existingIds.push(...chunk.map((r: { id: string }) => r.id));
            if (chunk.length < pageSize) break;
            from += pageSize;
        }
        const staleIds = existingIds.filter((id) => !keepIds.has(id));
        if (staleIds.length > 0) {
            // Delete deepest first so self-FK constraints never block removal.
            const depth = new Map<string, number>();
            const resolveDepth = (items: NavInputRow[], level: number) => {
                for (const item of items) {
                    if (item._key) depth.set(item._key, level);
                    if (item.children?.length) resolveDepth(item.children, level + 1);
                }
            };
            resolveDepth(payload, 0);
            const sortedStale = [...staleIds].sort((a, b) => (depth.get(b) ?? -1) - (depth.get(a) ?? -1));
            const { error: deleteError } = await adminSupabase
                .from("navigation")
                .delete()
                .in("id", sortedStale);
            if (deleteError) throw deleteError;
        }

        await persistNavTree(payload, null, 0);

        revalidateTag("content", "max");
        revalidatePath("/", "layout");
        revalidatePath("/admin/navigation");
        return ok({ saved: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("foreign key") || message.includes("23503")) {
            return fail(
                "validation_error",
                "navigation_fk_violation",
                "Cannot save: an item references a parent that was removed. Re-add the parent or move its children first.",
            );
        }
        return fromCaughtError(err, "navigation_save_failed");
    }
}

export async function getModelNavTreeAction(): Promise<ApiResult<ModelNavNode[]>> {
    try {
        const result = await getModelNavTree();
        return result;
    } catch (err) {
        return fromCaughtError(err, "model_nav_tree_failed");
    }
}
