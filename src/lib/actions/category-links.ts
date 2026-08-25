"use server";

import { adminSupabase } from "@/lib/supabase/admin";
import { ok, fail, fromCaughtError, type ApiResult } from "@/lib/api-types";
import type { CategoryLink, CategoryLinkTargetType } from "@/types/category-links";

export interface AttachOption {
    id: string;
    name: string;
}

// FR3-D: attachments between categories and existing catalog entities.
// Storage lives in category_links (migration 20260824000000/…0001).

export async function getCategoryLinks(categoryId: string): Promise<ApiResult<CategoryLink[]>> {
    try {
        const { data, error } = await adminSupabase
            .from("category_links")
            .select("*")
            .eq("category_id", categoryId)
            .order("created_at", { ascending: true });
        if (error) throw error;
        return ok((data ?? []) as CategoryLink[]);
    } catch (err) {
        return fromCaughtError(err, "category_links_fetch_failed");
    }
}

export async function getAttachOptions(targetType: CategoryLinkTargetType): Promise<ApiResult<AttachOption[]>> {
    try {
        let query = adminSupabase.from("brands").select("id, name");
        if (targetType !== "brand") {
            // models.level: 0 = model, 1 = submodel, 2 = product model
            const level = targetType === "model" ? 0 : targetType === "submodel" ? 1 : 2;
            query = adminSupabase.from("models").select("id, name").eq("level", level);
        }
        const { data, error } = await query.order("name", { ascending: true });
        if (error) throw error;
        return ok((data ?? []) as AttachOption[]);
    } catch (err) {
        return fromCaughtError(err, "attach_options_fetch_failed");
    }
}

export async function attachCategoryLink(
    categoryId: string,
    targetType: CategoryLinkTargetType,
    targetId: string,
): Promise<ApiResult<{ attached: true }>> {
    try {
        if (!categoryId || !targetId) return fail("validation_error", "missing_ids", "Category and target are required.");
        const { error } = await adminSupabase
            .from("category_links")
            .insert({ category_id: categoryId, entity_type: targetType, entity_id: targetId });
        if (error) {
            if (error.code === "23505") return fail("validation_error", "already_attached", "Already attached to this category.");
            throw error;
        }
        return ok({ attached: true });
    } catch (err) {
        return fromCaughtError(err, "category_link_attach_failed");
    }
}

export async function detachCategoryLink(
    categoryId: string,
    targetType: CategoryLinkTargetType,
    targetId: string,
): Promise<ApiResult<{ detached: true }>> {
    try {
        const { error } = await adminSupabase
            .from("category_links")
            .delete()
            .eq("category_id", categoryId)
            .eq("entity_type", targetType)
            .eq("entity_id", targetId);
        if (error) throw error;
        return ok({ detached: true });
    } catch (err) {
        return fromCaughtError(err, "category_link_detach_failed");
    }
}
