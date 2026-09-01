"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";

export interface AdminModelNode {
    id: string;
    slug: string;
    name: string;
    brandId: string | null;
    brandName: string;
    categoryId: string | null;
    categoryName: string;
    parentId: string | null;
    level: number;
    nodeType: "branch" | "product";
    directProductCount: number;
    subtreeProductCount: number;
    hasChildren: boolean;
    children: AdminModelNode[];
}

export interface AdminModelBrandGroup {
    brandId: string | null;
    brandName: string;
    models: AdminModelNode[];
}

export interface AdminModelCategoryGroup {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    brands: AdminModelBrandGroup[];
}

interface ModelRowShape {
    id: string;
    slug: string;
    name: string;
    brand_id: string | null;
    parent_id: string | null;
    level: number;
    category_id: string | null;
}

async function slugTakenByOther(slug: string, brandId: string | null, excludeId?: string): Promise<boolean> {
    let query = adminSupabase.from("models").select("id").eq("slug", slug);
    if (brandId == null) {
        query = query.is("brand_id", null);
    } else {
        query = query.eq("brand_id", brandId);
    }
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.limit(1);
    return (data?.length ?? 0) > 0;
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function getModelsAdmin(): Promise<ApiResult<AdminModelCategoryGroup[]>> {
    try {
        const [modelsRes, brandsRes, categoriesRes, productsRes] = await Promise.all([
            adminSupabase.from("models").select("id, slug, name, brand_id, parent_id, level, category_id"),
            adminSupabase.from("brands").select("id, name"),
            adminSupabase.from("categories").select("id, slug, name"),
            adminSupabase.from("products").select("leaf_model_id"),
        ]);
        // FR4-B: failed reads must surface as errors, never as an empty tree.
        if (modelsRes.error) {
            return fail("api_error", "admin_models_fetch_failed", modelsRes.error.message);
        }
        if (brandsRes.error) {
            return fail("api_error", "admin_models_brands_failed", brandsRes.error.message);
        }
        if (categoriesRes.error) {
            return fail("api_error", "admin_models_categories_failed", categoriesRes.error.message);
        }
        if (productsRes.error) {
            return fail("api_error", "admin_models_counts_failed", productsRes.error.message);
        }

        const rows = (modelsRes.data ?? []) as ModelRowShape[];
        const byId = new Map(rows.map((m) => [m.id, m]));
        const brandName = new Map<string, string>((brandsRes.data ?? []).map((b) => [b.id, b.name]));
        const categoryById = new Map((categoriesRes.data ?? []).map((c) => [c.id, c]));
        const countByModel = new Map<string, number>();
        for (const p of productsRes.data ?? []) {
            if (!p.leaf_model_id) continue;
            countByModel.set(p.leaf_model_id, (countByModel.get(p.leaf_model_id) ?? 0) + 1);
        }

        const anchorCache = new Map<string, string | null>();
        const anchorOf = (m: ModelRowShape): string | null => {
            const cached = anchorCache.get(m.id);
            if (cached !== undefined) return cached;
            // walk up without recursion blowups on deep chains
            let walker: string | null = m.parent_id;
            if (m.category_id) {
                anchorCache.set(m.id, m.category_id);
                return m.category_id;
            }
            const visited = new Set<string>([m.id]);
            let resolved: string | null = null;
            while (walker && !visited.has(walker)) {
                visited.add(walker);
                const row = byId.get(walker);
                if (!row) break;
                if (row.category_id) {
                    resolved = row.category_id;
                    break;
                }
                walker = row.parent_id;
            }
            anchorCache.set(m.id, resolved);
            return resolved;
        };

        const subtreeCache = new Map<string, number>();
        const subtreeCount = (id: string): number => {
            const cached = subtreeCache.get(id);
            if (cached !== undefined) return cached;
            let total = countByModel.get(id) ?? 0;
            for (const child of rows) {
                if (child.parent_id === id) total += subtreeCount(child.id);
            }
            subtreeCache.set(id, total);
            return total;
        };

        const childSet = new Set(rows.map((m) => m.parent_id).filter(Boolean) as string[]);
        const childrenOf = new Map<string, ModelRowShape[]>();
        for (const m of rows) {
            if (!m.parent_id) continue;
            if (!childrenOf.has(m.parent_id)) childrenOf.set(m.parent_id, []);
            childrenOf.get(m.parent_id)!.push(m);
        }

        const build = (parentId: string | null): AdminModelNode[] =>
            (parentId
                ? childrenOf.get(parentId) ?? []
                : rows.filter((m) => !m.parent_id)
            )
                .map((m): AdminModelNode => {
                    const anchor = anchorOf(m);
                    const direct = countByModel.get(m.id) ?? 0;
                    return {
                        id: m.id,
                        slug: m.slug,
                        name: m.name,
                        brandId: m.brand_id,
                        brandName: m.brand_id ? brandName.get(m.brand_id) ?? "" : "",
                        categoryId: anchor,
                        categoryName: anchor ? categoryById.get(anchor)?.name ?? "" : "",
                        parentId: m.parent_id,
                        level: m.level,
                        nodeType: direct === 1 ? "product" : "branch",
                        directProductCount: direct,
                        subtreeProductCount: subtreeCount(m.id),
                        hasChildren: childSet.has(m.id),
                        children: [],
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));

        const attach = (node: AdminModelNode) => {
            node.children = build(node.id);
            node.children.forEach(attach);
        };
        const roots = build(null);
        roots.forEach(attach);

        // group top level: category -> brand(optional bucket) -> root models
        const grouped: AdminModelCategoryGroup[] = [];
        for (const cat of categoriesRes.data ?? []) {
            const catRoots = roots.filter((r) => r.categoryId === cat.id);
            if (catRoots.length === 0) continue;
            const brandBuckets = new Map<string, AdminModelBrandGroup>();
            for (const r of catRoots) {
                const key = r.brandId ?? "__none__";
                if (!brandBuckets.has(key)) {
                    brandBuckets.set(key, {
                        brandId: r.brandId,
                        brandName: r.brandId ? brandName.get(r.brandId) ?? "" : "No brand",
                        models: [],
                    });
                }
                brandBuckets.get(key)!.models.push(r);
            }
            grouped.push({
                categoryId: cat.id,
                categoryName: cat.name,
                categorySlug: cat.slug,
                brands: [...brandBuckets.values()].sort((a, b) =>
                    a.brandName.localeCompare(b.brandName),
                ),
            });
        }
        // roots whose chain is unanchored (should not exist post-migration) surface last
        const orphanRoots = roots.filter((r) => !r.categoryId);
        if (orphanRoots.length > 0) {
            grouped.push({
                categoryId: "",
                categoryName: "Unanchored",
                categorySlug: "",
                brands: [{ brandId: null, brandName: "No brand", models: orphanRoots }],
            });
        }
        grouped.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

        return ok(grouped);
    } catch (err) {
        return fromCaughtError(err, "admin_models_fetch_failed");
    }
}

export async function getModelFormOptions(): Promise<
    ApiResult<{ categories: { id: string; name: string }[]; brands: { id: string; name: string }[] }>
> {
    try {
        const [catsRes, brandsRes] = await Promise.all([
            adminSupabase.from("categories").select("id, name").order("name"),
            adminSupabase.from("brands").select("id, name").order("name"),
        ]);
        if (catsRes.error) return fail("api_error", "model_form_categories_failed", catsRes.error.message);
        if (brandsRes.error) return fail("api_error", "model_form_brands_failed", brandsRes.error.message);
        return ok({
            categories: catsRes.data ?? [],
            brands: brandsRes.data ?? [],
        });
    } catch (err) {
        return fromCaughtError(err, "model_form_options_failed");
    }
}

export async function createModel(
    name: string,
    categoryId: string,
    brandId: string | null,
    parentId: string | null,
): Promise<ApiResult<{ id: string }>> {
    try {
        const cleanName = (name || "").trim();
        if (!cleanName) {
            return fail("validation_error", "model_name_required", "Model name is required.");
        }

        let level = 0;
        let effectiveBrandId = brandId;

        if (parentId) {
            const { data: parent } = await adminSupabase
                .from("models")
                .select("id, brand_id, level")
                .eq("id", parentId)
                .single();
            if (!parent) {
                return fail("validation_error", "model_parent_not_found", "Parent model does not exist.");
            }
            level = parent.level + 1;
            if (effectiveBrandId == null) {
                effectiveBrandId = parent.brand_id;
            } else if (parent.brand_id && parent.brand_id !== effectiveBrandId) {
                return fail(
                    "validation_error",
                    "model_parent_brand_mismatch",
                    "The chosen brand does not match the parent model's brand.",
                );
            }
        } else {
            if (!categoryId) {
                return fail(
                    "validation_error",
                    "model_category_required",
                    "A category is required: every root model must be anchored to a category.",
                );
            }
            const { data: cat } = await adminSupabase
                .from("categories")
                .select("id")
                .eq("id", categoryId)
                .single();
            if (!cat) {
                return fail("validation_error", "model_category_not_found", "Category does not exist.");
            }
        }

        const slug = slugify(cleanName) || "model";
        if (await slugTakenByOther(slug, effectiveBrandId)) {
            return fail(
                "validation_error",
                "model_slug_exists",
                `A model with slug "${slug}" already exists for this brand.`,
            );
        }

        const { data, error } = await adminSupabase
            .from("models")
            .insert({
                slug,
                name: cleanName,
                brand_id: effectiveBrandId,
                parent_id: parentId,
                level,
                category_id: parentId ? null : categoryId,
            })
            .select("id")
            .single();
        if (error) {
            if (error.code === "23505") {
                return fail(
                    "validation_error",
                    "model_slug_exists",
                    `A model with slug "${slug}" already exists in this scope.`,
                );
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
            if (parent.brand_id && current.brand_id && parent.brand_id !== current.brand_id) {
                return fail(
                    "validation_error",
                    "model_parent_brand_mismatch",
                    "Cannot move under a parent belonging to a different brand.",
                );
            }
            // cycle guard: walk up from the new parent; must never reach the moved node
            let walker: string | null = parentId;
            const seen = new Set<string>();
            while (walker) {
                if (walker === id) {
                    return fail(
                        "validation_error",
                        "model_parent_cycle",
                        "Cannot move a model under one of its own descendants.",
                    );
                }
                if (seen.has(walker)) break;
                seen.add(walker);
                const walked: { data: { parent_id: string | null } | null; error: unknown } =
                    await adminSupabase
                        .from("models")
                        .select("parent_id")
                        .eq("id", walker)
                        .single();
                walker = walked.data?.parent_id ?? null;
            }
            level = parent.level + 1;
        }

        const slug = slugify(cleanName) || current.slug;
        if (await slugTakenByOther(slug, current.brand_id, id)) {
            return fail(
                "validation_error",
                "model_slug_exists",
                `Another model with slug "${slug}" already exists in this scope.`,
            );
        }

        // recompute levels for the whole subtree after a possible reparent
        const { data: allRows } = await adminSupabase
            .from("models")
            .select("id, parent_id, level");
        const byId = new Map(((allRows ?? []) as ModelRowShape[]).map((m) => [m.id, m]));
        byId.set(id, { ...(byId.get(id) as ModelRowShape), parent_id: parentId, level });

        const { error } = await adminSupabase
            .from("models")
            .update({ slug, name: cleanName, parent_id: parentId, level })
            .eq("id", id);
        if (error) {
            if (error.code === "23505") {
                return fail(
                    "validation_error",
                    "model_slug_exists",
                    `Another model with slug "${slug}" already exists.`,
                );
            }
            throw error;
        }

        // propagate level changes to descendants (BFS over the fetched rows)
        const childrenMap = new Map<string | null, ModelRowShape[]>();
        for (const row of byId.values()) {
            const key = row.parent_id ?? "__root__";
            if (!childrenMap.has(key)) childrenMap.set(key, []);
            childrenMap.get(key)!.push(row);
        }
        const levelUpdates: Promise<unknown>[] = [];
        const queue: string[] = (childrenMap.get(id) ?? []).map((r) => r.id);
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            const row = byId.get(nodeId);
            if (!row) continue;
            const parentRow = row.parent_id ? byId.get(row.parent_id) : null;
            const correctLevel = parentRow ? parentRow.level + 1 : 0;
            if (correctLevel !== row.level) {
                row.level = correctLevel;
                levelUpdates.push(Promise.resolve(adminSupabase.from("models").update({ level: correctLevel }).eq("id", nodeId)));
            }
            for (const child of childrenMap.get(nodeId) ?? []) queue.push(child.id);
        }
        await Promise.all(levelUpdates);

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
                `Cannot delete this product model: ${productCount} product(s) reference it. Reassign the products to another model first.`,
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
