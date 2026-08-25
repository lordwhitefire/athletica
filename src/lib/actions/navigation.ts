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

interface NavUpsertRow {
    id: string;
    parent_id: string | null;
    label: string;
    route: string | null;
    order: number;
}

function collectNavRows(
    items: NavInputRow[],
    parentId: string | null,
    startOrder: number,
    into: NavUpsertRow[],
): number {
    let order = startOrder;
    for (const item of items) {
        const id = item._key || generateId();
        into.push({
            id,
            parent_id: parentId,
            label: item.label,
            route: normalizeRoute(item.href),
            order,
        });
        order += 1;
        if (item.children?.length) {
            order = collectNavRows(item.children, id, order, into);
        }
    }
    return order;
}

async function persistNavTree(items: NavInputRow[]): Promise<void> {
    // Walk the tree once to assign stable parent/order values, then upsert in
    // batches so saving a large tree costs a handful of round-trips instead of
    // one request per row.
    const rows: NavUpsertRow[] = [];
    collectNavRows(items, null, 0, rows);

    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await adminSupabase
            .from("navigation")
            .upsert(batch, { onConflict: "id" });
        if (error) throw error;
    }
}

interface EditorNavItem {
    _key: string;
    label: string;
    href: string;
    children: EditorNavItem[];
}

export async function getNavigationDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const [{ data, error }, fpResult] = await Promise.all([
            adminSupabase
                .from("navigation")
                .select("*")
                .order("order", { ascending: true }),
            adminSupabase.rpc("navigation_content_fingerprint"),
        ]);
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
        return ok({
            _id: "navigation",
            items: (childrenOf.get(null) ?? []).map(toEditorItem),
            // Stale-editor metadata for the guarded publisher: the loaded id
            // set catches structural drift, the fingerprint catches content
            // drift (renames/reorders keep ids — tester blocker B4).
            _meta: {
                loaded_row_ids: rows.map((r) => r.id).sort(),
                loaded_fingerprint:
                    typeof fpResult.data === "string" ? fpResult.data : "",
            },
        });
    } catch (err) {
        return fromCaughtError(err, "navigation_doc_fetch_failed");
    }
}

export async function saveNavigation(
    items: Record<string, unknown>[],
    loadedRowIds: string[] = [],
    allowWipe = false,
    loadedFingerprint = "",
): Promise<ApiResult<{ saved: true }>> {
    try {
        const parsed = validateOrFail(navigationSchema, items);
        if ("error" in parsed) return parsed.error;

        const payload = parsed.data as unknown as NavInputRow[];

        // Flatten parent-first (pre-order), so the FK self-reference is satisfied
        // by insertion order inside the single atomic statement.
        const rows: NavUpsertRow[] = [];
        collectNavRows(payload, null, 0, rows);

        // Atomic, guarded replace (WP-R2-B): one RPC = one transaction with
        // stale-editor and total-wipe guards enforced server-side.
        const { data: rpcResult, error } = await adminSupabase.rpc(
            "replace_navigation_tree",
            {
                p_rows: rows,
                p_loaded_ids: loadedRowIds,
                p_allow_wipe: allowWipe,
                p_loaded_fingerprint: loadedFingerprint,
            },
        );
        if (error) throw error;
        const verdict = rpcResult as { ok?: boolean; code?: string; message?: string };
        if (!verdict?.ok) {
            if (verdict?.code === "stale_editor") {
                return fail("validation_error", "stale_editor", verdict.message ?? "The tree changed since you loaded it. Reload and try again.");
            }
            if (verdict?.code === "total_wipe") {
                return fail("validation_error", "total_wipe", verdict.message ?? "Refusing to delete the entire navigation menu.");
            }
            return fail("validation_error", "navigation_replace_rejected", verdict?.message ?? "Save rejected.");
        }

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
