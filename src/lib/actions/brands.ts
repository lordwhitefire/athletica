"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { brandFormSchema } from "@/lib/schemas/brand";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assetToUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (!value.startsWith("image-")) return null;
  return `https://cdn.sanity.io/images/cuiis46d/production/${value
    .replace("image-", "")
    .replace(/-([^-]+)$/, ".$1")}`;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base) || "brand";
  const { data } = await adminSupabase
    .from("brands")
    .select("slug")
    .like("slug", `${slug}%`);
  const existing = new Set(
    (data ?? [])
      .map((b) => b.slug)
      .filter((s): s is string => Boolean(s)),
  );
  if (!existing.has(slug) || (excludeId && existing.size === 0)) return slug;
  let candidate = slug;
  let n = 2;
  while (existing.has(candidate)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

export async function getBrandLogoMap(): Promise<ApiResult<Record<string, string | null>>> {
  try {
    const { data } = await adminSupabase.from("brands").select("name, logo_link");
    const map: Record<string, string | null> = {};
    for (const b of data ?? []) {
      if (!b.name) continue;
      map[b.name.trim()] = b.logo_link || null;
    }
    return ok(map);
  } catch (err) {
    return fromCaughtError(err, "brand_logo_map_fetch_failed");
  }
}

export async function getAllBrandsAdmin(): Promise<ApiResult<unknown[]>> {
  try {
    const [brandRes, productsRes] = await Promise.all([
      adminSupabase
        .from("brands")
        .select("id, slug, name, logo_link, created_at")
        .order("name", { ascending: true }),
      adminSupabase.from("products").select("brand_id"),
    ]);
    // FR4-B: a failed query must never masquerade as an empty catalog —
    // surface the error so the page renders its error panel with Retry.
    if (brandRes.error) {
      return fail("api_error", "admin_brands_fetch_failed", brandRes.error.message);
    }
    if (productsRes.error) {
      return fail("api_error", "admin_brand_counts_failed", productsRes.error.message);
    }
    const countByBrand = new Map<string, number>();
    for (const p of productsRes.data ?? []) {
      if (!p.brand_id) continue;
      countByBrand.set(p.brand_id, (countByBrand.get(p.brand_id) ?? 0) + 1);
    }
    return ok(
      (brandRes.data ?? []).map((b) => ({
        _id: b.id,
        _type: "brand",
        slug: b.slug,
        name: b.name,
        logo: b.logo_link
          ? { _type: "image", asset: { _type: "reference", _ref: b.logo_link } }
          : null,
        product_count: countByBrand.get(b.id) ?? 0,
        created_at: b.created_at,
      })),
    );
  } catch (err) {
    return fromCaughtError(err, "admin_brands_fetch_failed");
  }
}

export async function getBrandByIdAdmin(id: string): Promise<ApiResult<unknown>> {
  try {
    const { data } = await adminSupabase
      .from("brands")
      .select("id, slug, name, logo_link, created_at")
      .eq("id", id)
      .single();
    if (!data) return ok(null);
    return ok({
      _id: data.id,
      _type: "brand",
      slug: data.slug,
      name: data.name,
      logo: data.logo_link
        ? { _type: "image", asset: { _type: "reference", _ref: data.logo_link } }
        : null,
      created_at: data.created_at,
    });
  } catch (err) {
    return fromCaughtError(err, "admin_brand_fetch_by_id_failed");
  }
}

export async function createBrand(formData: FormData): Promise<ApiResult<{ name: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = validateOrFail(brandFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const name = (raw.name as string).trim();
        if (!name) return fail("validation_error", "brand_name_required", "Brand name is required.");

        const slug = await uniqueSlug(name);
        const logoLink = assetToUrl((raw.logo_asset as string) || null);

        const { error } = await adminSupabase
            .from("brands")
            .insert({ slug, name, logo_link: logoLink });
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/brands");
        return ok({ name });
  } catch (err) {
    return fromCaughtError(err, "brand_create_failed");
  }
}

export async function updateBrand(id: string, formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = validateOrFail(brandFormSchema, raw);
        if ("error" in parsed) return parsed.error;

        const name = (raw.name as string).trim();
        if (!name) return fail("validation_error", "brand_name_required", "Brand name is required.");

        const { data: existing } = await adminSupabase
            .from("brands")
            .select("slug")
            .eq("id", id)
            .single();

        const logoLink = assetToUrl((raw.logo_asset as string) || null);
        const patch: Record<string, unknown> = { name };
        if (logoLink) patch.logo_link = logoLink;
        if (existing?.slug !== slugify(name)) {
            patch.slug = await uniqueSlug(name, id);
        }

        const { error } = await adminSupabase
            .from("brands")
            .update(patch)
            .eq("id", id);
        if (error) throw error;

        revalidateTag("products", "max");
        revalidatePath("/admin/brands");
        return ok({ id });
  } catch (err) {
    return fromCaughtError(err, "brand_update_failed");
  }
}

export async function deleteBrand(id: string): Promise<ApiResult<{ deleted: true }>> {
  try {
    const [{ count: productCount }, { count: modelCount }] = await Promise.all([
      adminSupabase.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id),
      adminSupabase.from("models").select("id", { count: "exact", head: true }).eq("brand_id", id),
    ]);
    if ((productCount ?? 0) > 0) {
      return fail(
        "validation_error",
        "brand_has_products",
        `Cannot delete brand: ${productCount} product(s) still reference it. Reassign or delete the products first.`,
      );
    }
    if ((modelCount ?? 0) > 0) {
      return fail(
        "validation_error",
        "brand_has_models",
        `Cannot delete brand: ${modelCount} model(s) still reference it. Delete or reassign the models first.`,
      );
    }

    const { error } = await adminSupabase.from("brands").delete().eq("id", id);
    if (error) throw error;

    revalidateTag("products", "max");
    revalidatePath("/admin/brands");
    return ok({ deleted: true });
  } catch (err) {
    return fromCaughtError(err, "brand_delete_failed");
  }
}