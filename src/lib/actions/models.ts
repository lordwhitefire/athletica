"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";

export interface AdminModelNode {
    id: string;
    slug: string;
    name: string;
    brandId: string;
    brandName: string;
    parentId: string | null;
    level: number;
    productCount: number;
    hasChildren: boolean;
    children: AdminModelNode[];
}

export interface AdminModelGroup {
    brandId: string;
    brandName: string;
    models: AdminModelNode[];
}

const MAX_LEVEL = 2;

function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function getModelsAdmin(): Promise<ApiResult<AdminModelGroup[]>> {
    try {
        const [modelsRes, brandsRes, productsRes] = await Promise.all([
            adminSupabase.from("models").select("id, slug, name, brand_id, parent_id, level"),
            adminSupabase.from("brands").select("id, name"),
            adminSupabase.from("products").select("leaf_model_id"),
        ]);

        const brandName = new Map<string, string>((brandsRes.data ?? []).map((b) => [b.id, b.name]));
        const countByModel = new Map<string, number>();
        for (const p of productsRes.data ?? []) {
            if (!p.leaf_model_id) continue;
            countByModel.set(p.leaf_model_id, (countByModel.get(p.leaf_model_id) ?? 0) + 1);
        }

        const rows = (modelsRes.data ?? []).map((m) => ({
            ...m,
            productCount: countByModel.get(m.id) ?? 0,
        }));
        const childSet = new Set(rows.map((m) => m.parent_id).filter(Boolean));

        const byBrand = new Map<string, typeof rows>();
        for (const m of rows) {
            if (!byBrand.has(m.brand_id)) byBrand.set(m.brand_id, []);
            byBrand.get(m.brand_id)!.push(m);
        }

        const childrenOf = new Map<string, typeof rows>();
        for (const m of rows) {
            if (!m.parent_id) continue;
            if (!childrenOf.has(m.parent_id)) childrenOf.set(m.parent_id, []);
            childrenOf.get(m.parent_id)!.push(m);
        }

        const build = (parentId: string | null): AdminModelNode[] =>
            (parentId ? childrenOf.get(parentId) ?? [] : rows.filter((m) => !m.parent_id))
                .map((m): AdminModelNode => ({
                    id: m.id,
                    slug: m.slug,
                    name: m.name,
                    brandId: m.brand_id,
                    brandName: brandName.get(m.brand_id) ?? "",
                    parentId: m.parent_id,
                    level: m.level,
                    productCount: m.productCount,
                    hasChildren: childSet.has(m.id),
                    children: [],
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

        const roots = build(null);
        const attach = (node: AdminModelNode) => {
            node.children = build(node.id);
            node.children.forEach(attach);
        };
        roots.forEach(attach);

        const grouped: AdminModelGroup[] = [...byBrand.keys()]
            .map((brandId) => ({
                brandId,
                brandName: brandName.get(brandId) ?? "",
                models: roots.filter((r) => r.brandId === brandId),
            }))
            .filter((g) => g.models.length > 0)
            .sort((a, b) => a.brandName.localeCompare(b.brandName));

        return ok(grouped);
    } catch (err) {
        return fromCaughtError(err, "admin_models_fetch_failed");
    }
}

export async function createModel(
    name: string,
    brandId: string,
    parentId: string | null,
): Promise<ApiResult<{ id: string }>> {
    try {
        const cleanName = (name || "").trim();
        if (!cleanName) {
            return fail("validation_error", "model_name_required", "Model name is required.");
        }
        if (!brandId) {
            return fail("validation_error", "model_brand_required", "A brand is required.");
        }

        let level = 0;
        if (parentId) {
            const { data: parent } = await adminSupabase
                .from("models")
                .select("id, brand_id, level")
                .eq("id", parentId)
                .single();
            if (!parent) {
                return fail("validation_error", "model_parent_not_found", "Parent model does not exist.");
            }
            if (parent.brand_id !== brandId) {
                return fail("validation_error", "model_parent_brand_mismatch", "Parent model belongs to a different brand.");
            }
            level = parent.level + 1;
            if (level > MAX_LEVEL) {
                return fail("validation_error", "model_level_max", `Models can be at most ${MAX_LEVEL} levels deep (parent is already at level ${parent.level}).`);
            }
        }

        const slug = slugify(cleanName) || "model";
        const { data: existing } = await adminSupabase
            .from("models")
            .select("id")
            .or(`and(slug.eq.${slug},brand_id.eq.${brandId})`)
            .limit(1);
        if (existing && existing.length > 0) {
            return fail("validation_error", "model_slug_exists", `A model with slug "${slug}" already exists for this brand.`);
        }

        const { data, error } = await adminSupabase
            .from("models")
            .insert({ slug, name: cleanName, brand_id: brandId, parent_id: parentId, level })
            .select("id")
            .single();
        if (error) {
            if (error.code === "23505") {
                return fail("validation_error", "model_slug_exists", `A model with slug "${slug}" already exists for this brand.`);
            }
            throw error;
        }

        revalidateTag("products", "max");
        revalidateTag("models", "max");
        revalidatePath("/admin/models");
        return ok({ id: data.id });
    } catch (err) {
        return fromCaughtError(err, "model_create_failed");
    }
}

export async function updateModel(
    id: string,
    name: string,
    parentId: string | null,
): Promise<ApiResult<{ id: string }>> {
    try {
        const cleanName = (name || "").trim();
        if (!cleanName) {
            return fail("validation_error", "model_name_required", "Model name is required.");
        }

        const { data: current } = await adminSupabase
            .from("models")
            .select("id, slug, brand_id, level")
            .eq("id", id)
            .single();
        if (!current) {
            return fail("validation_error", "model_not_found", "Model does not exist.");
        }

        if (parentId === id) {
            return fail("validation_error", "model_parent_self", "A model cannot be its own parent.");
        }

        let level = 0;
        if (parentId) {
            const { data: parent } = await adminSupabase
                .from("models")
                .select("id, brand_id, level")
                .eq("id", parentId)
                .single();
            if (!parent) {
                return fail("validation_error", "model_parent_not_found", "Parent model does not exist.");
            }
            if (parent.brand_id !== current.brand_id) {
                return fail("validation_error", "model_parent_brand_mismatch", "Parent model belongs to a different brand.");
            }
            level = parent.level + 1;
            if (level > MAX_LEVEL) {
                return fail("validation_error", "model_level_max", `Models can be at most ${MAX_LEVEL} levels deep (parent is already at level ${parent.level}).`);
            }
        }

        const slug = slugify(cleanName) || current.slug;
        const { data: existing } = await adminSupabase
            .from("models")
            .select("id")
            .or(`and(slug.eq.${slug},brand_id.eq.${current.brand_id})`)
            .limit(1);
        if (existing && existing.length > 0 && existing[0].id !== id) {
            return fail("validation_error", "model_slug_exists", `A model with slug "${slug}" already exists for this brand.`);
        }

        const { error } = await adminSupabase
            .from("models")
            .update({ slug, name: cleanName, parent_id: parentId, level })
            .eq("id", id);
        if (error) {
            if (error.code === "23505") {
                return fail("validation_error", "model_slug_exists", `A model with slug "${slug}" already exists for this brand.`);
            }
            throw error;
        }

        revalidateTag("products", "max");
        revalidateTag("models", "max");
        revalidatePath("/admin/models");
        return ok({ id });
    } catch (err) {
        return fromCaughtError(err, "model_update_failed");
    }
}

export async function deleteModel(id: string): Promise<ApiResult<{ deleted: true }>> {
    try {
        const [{ count: productCount }, { count: childCount }] = await Promise.all([
            adminSupabase.from("products").select("id", { count: "exact", head: true }).eq("leaf_model_id", id),
            adminSupabase.from("models").select("id", { count: "exact", head: true }).eq("parent_id", id),
        ]);
        if ((productCount ?? 0) > 0) {
            return fail(
                "validation_error",
                "model_has_products",
                `Cannot delete model: ${productCount} product(s) reference it. Reassign the products to another model first.`,
            );
        }
        if ((childCount ?? 0) > 0) {
            return fail(
                "validation_error",
                "model_has_children",
                `Cannot delete model: ${childCount} submodel${childCount === 1 ? "" : "s"} depend on it. Delete or move them first.`,
            );
        }

        const { error } = await adminSupabase.from("models").delete().eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidateTag("models", "max");
        revalidatePath("/admin/models");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "model_delete_failed");
    }
}