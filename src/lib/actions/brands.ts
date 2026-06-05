"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import { client, urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";

export async function getBrandLogoMap(): Promise<Record<string, string | null>> {
  const brands = await client.fetch(`*[_type == "brand" && defined(logo)] { name, logo }`);
  const map: Record<string, string | null> = {};
  for (const b of brands as { name: string; logo: unknown }[]) {
    try {
      map[b.name] = urlFor(b.logo as SanityImageSource).width(48).height(48).url();
    } catch {
      map[b.name] = null;
    }
  }
  return map;
}

export async function getAllBrandsAdmin() {
  return adminClient.fetch(`*[_type == "brand"] | order(name asc) { _id, name, logo }`);
}

export async function getBrandByIdAdmin(id: string) {
  return adminClient.fetch(`*[_id == $id][0]`, { id });
}

export async function createBrand(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const doc = {
    _type: "brand" as const,
    name: raw.name as string,
    logo: raw.logo_asset
      ? { _type: "image" as const, asset: { _type: "reference" as const, _ref: raw.logo_asset as string } }
      : undefined,
  };
  await adminClient.create(doc);
  revalidatePath("/admin/brands");
}

export async function updateBrand(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const patch: Record<string, unknown> = { name: raw.name as string };
  if (raw.logo_asset) {
    patch.logo = { _type: "image", asset: { _type: "reference", _ref: raw.logo_asset as string } };
  }
  await adminClient.patch(id).set(patch).commit();
  revalidatePath("/admin/brands");
}

export async function deleteBrand(id: string) {
  await adminClient.delete(id);
  revalidatePath("/admin/brands");
}
