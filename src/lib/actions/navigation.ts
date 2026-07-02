"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { navigationSchema } from "@/lib/schemas/navigation";
import { rebuildNavUrls } from "@/lib/rebuild-nav-urls";
import type { NavItem } from "@/types/navigation";
import { getModelNavTree } from "@/lib/getNavigation";
import type { ModelNavNode } from "@/lib/getNavigation";

export async function getNavigationDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const doc = await adminClient.fetch(`*[_type == "navigation"][0]`);
        return ok(doc as Record<string, unknown>);
    } catch (err) {
        return fromCaughtError(err, "navigation_doc_fetch_failed");
    }
}

export async function saveNavigation(items: Record<string, unknown>[]): Promise<ApiResult<{ saved: true }>> {
    try {
        const parsed = validateOrFail(navigationSchema, items);
        if ("error" in parsed) return parsed.error;
        const rebuilt = rebuildNavUrls(parsed.data as NavItem[]);
        const docResult = await getNavigationDoc();
        if (docResult.error) return docResult;
        const doc = docResult.data;
        if (!doc) {
            await adminClient.create({ _type: "navigation", _id: "navigation", title: "Main Navigation", items: rebuilt });
        } else {
            await adminClient.patch(doc._id as string).set({ items: rebuilt }).commit();
        }
        revalidatePath("/admin/navigation");
        return ok({ saved: true });
    } catch (err) {
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
