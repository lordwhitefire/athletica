"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import { client, urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { brandFormSchema } from "@/lib/schemas/brand";

export async function getBrandLogoMap(): Promise<ApiResult<Record<string, string | null>>> {
  try {
    const brands = await client.fetch(`*[_type == "brand" && defined(logo)] { name, logo }`);
    const map: Record<string, string | null> = {};
    for (const b of brands as { name: string; logo: unknown }[]) {
      try {
        map[b.name] = urlFor(b.logo as SanityImageSource).width(48).height(48).url();
      } catch {
        map[b.name] = null;
      }
    }
    return ok(map);
  } catch (err) {
    return fromCaughtError(err, "brand_logo_map_fetch_failed");
  }
}

export async function getAllBrandsAdmin(): Promise<ApiResult<unknown[]>> {
  try {
    const brands = await adminClient.fetch(`*[_type == "brand"] | order(name asc) { _id, name, logo }`);
    return ok(brands as unknown[]);
  } catch (err) {
    return fromCaughtError(err, "admin_brands_fetch_failed");
  }
}

export async function getBrandByIdAdmin(id: string): Promise<ApiResult<unknown>> {
  try {
    const brand = await adminClient.fetch(`*[_id == $id][0]`, { id });
    return ok(brand);
  } catch (err) {
    return fromCaughtError(err, "admin_brand_fetch_by_id_failed");
  }
}

export async function createBrand(formData: FormData): Promise<ApiResult<{ name: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = validateOrFail(brandFormSchema, raw);
        if ("error" in parsed) return parsed.error;
    const doc = {
      _type: "brand" as const,
      name: raw.name as string,
      logo: raw.logo_asset
        ? { _type: "image" as const, asset: { _type: "reference" as const, _ref: raw.logo_asset as string } }
        : undefined,
    };
    await adminClient.create(doc);
    revalidatePath("/admin/brands");
    return ok({ name: raw.name as string });
  } catch (err) {
    return fromCaughtError(err, "brand_create_failed");
  }
}

export async function updateBrand(id: string, formData: FormData): Promise<ApiResult<{ id: string }>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = validateOrFail(brandFormSchema, raw);
        if ("error" in parsed) return parsed.error;
    const patch: Record<string, unknown> = { name: raw.name as string };
    if (raw.logo_asset) {
      patch.logo = { _type: "image", asset: { _type: "reference", _ref: raw.logo_asset as string } };
    }
    await adminClient.patch(id).set(patch).commit();
    revalidatePath("/admin/brands");
    return ok({ id });
  } catch (err) {
    return fromCaughtError(err, "brand_update_failed");
  }
}

export async function deleteBrand(id: string): Promise<ApiResult<{ deleted: true }>> {
  try {
    await adminClient.delete(id);
    revalidatePath("/admin/brands");
    return ok({ deleted: true });
  } catch (err) {
    return fromCaughtError(err, "brand_delete_failed");
  }
}
