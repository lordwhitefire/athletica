"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";

export interface AdminCategory {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    productCount: number;
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const slug = slugify(base) || "category";
    const { data } = await adminSupabase
        .from("categories")
        .select("slug")
        .like("slug", `${slug}%`);
    const existing = new Set(
        (data ?? []).map((c) => c.slug).filter((s): s is string => Boolean(s)),
    );
    if (!existing.has(slug)) return slug;
    let candidate = slug;
    let n = 2;
    while (existing.has(candidate)) {
        candidate = `${slug}-${n}`;
        n += 1;
    }
    return candidate;
}

export async function getCategoriesAdmin(): Promise<ApiResult<AdminCategory[]>> {
    try {
        const [categoryRes, productRes] = await Promise.all([
            adminSupabase.from("categories").select("id, slug, name, parent_id").order("name"),
            adminSupabase.from("products").select("category_id"),
        ]);
        const countByCategory = new Map<string, number>();
        for (const p of productRes.data ?? []) {
            if (!p.category_id) continue;
            countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
        }
        return ok(
            (categoryRes.data ?? []).map((c) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
                parent_id: c.parent_id,
                productCount: countByCategory.get(c.id) ?? 0,
            })),
        );
    } catch (err) {
        return fromCaughtError(err, "admin_categories_fetch_failed");
    }
}

export async function createCategory(
    name: string,
    parentId: string | null,
): Promise<ApiResult<{ id: string }>> {
    try {
        const cleanName = (name || "").trim();
        if (!cleanName) {
            return fail("validation_error", "category_name_required", "Category name is required.");
        }

        if (parentId) {
            const { data: parent } = await adminSupabase
                .from("categories")
                .select("id")
                .eq("id", parentId)
                .single();
            if (!parent) {
                return fail("validation_error", "category_parent_not_found", "Parent category does not exist.");
            }
        }

        const { data: existing } = await adminSupabase
            .from("categories")
            .select("id")
            .or(
                parentId
                    ? `and(name.eq.${cleanName},parent_id.eq.${parentId})`
                    : `and(name.eq.${cleanName},parent_id.is.null)`,
            )
            .limit(1);
        if (existing && existing.length > 0) {
            return fail("validation_error", "category_duplicate", `A category named "${cleanName}" already exists here.`);
        }

        const slug = await uniqueSlug(cleanName);
        const { data, error } = await adminSupabase
            .from("categories")
            .insert({ slug, name: cleanName, parent_id: parentId })
            .select("id")
            .single();
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/categories");
        return ok({ id: data.id });
    } catch (err) {
        return fromCaughtError(err, "category_create_failed");
    }
}

export async function updateCategory(
    id: string,
    name: string,
    parentId: string | null,
): Promise<ApiResult<{ id: string }>> {
    try {
        const cleanName = (name || "").trim();
        if (!cleanName) {
            return fail("validation_error", "category_name_required", "Category name is required.");
        }

        const { data: existing } = await adminSupabase
            .from("categories")
            .select("id")
            .or(
                parentId
                    ? `and(name.eq.${cleanName},parent_id.eq.${parentId})`
                    : `and(name.eq.${cleanName},parent_id.is.null)`,
            )
            .limit(1);
        if (existing && existing.length > 0 && existing[0].id !== id) {
            return fail("validation_error", "category_duplicate", `A category named "${cleanName}" already exists here.`);
        }

        const { data: current } = await adminSupabase
            .from("categories")
            .select("slug")
            .eq("id", id)
            .single();

        const patch: Record<string, unknown> = { name: cleanName, parent_id: parentId };
        if (current?.slug !== slugify(cleanName)) {
            patch.slug = await uniqueSlug(cleanName, id);
        }

        const { error } = await adminSupabase.from("categories").update(patch).eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/categories");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "category_update_failed");
    }
}

export async function deleteCategory(id: string): Promise<ApiResult<{ deleted: true }>> {
    try {
        const [{ count: productCount }, { count: childCount }] = await Promise.all([
            adminSupabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
            adminSupabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
        ]);
        if ((productCount ?? 0) > 0) {
            return fail(
                "validation_error",
                "category_has_products",
                `Cannot delete category: ${productCount} product(s) still reference it. Reassign or delete the products first.`,
            );
        }
        if ((childCount ?? 0) > 0) {
            return fail(
                "validation_error",
                "category_has_children",
                `Cannot delete category: ${childCount} subcategor${childCount === 1 ? "y" : "ies"} still reference it. Move or delete them first.`,
            );
        }

        const { error } = await adminSupabase.from("categories").delete().eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/categories");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "category_delete_failed");
    }
}