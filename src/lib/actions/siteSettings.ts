"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

export async function getSiteSettingsDoc() {
  return adminClient.fetch(`*[_type == "siteSettings"][0]`);
}

export async function saveSiteSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  let doc = await getSiteSettingsDoc();

  const footer: Record<string, unknown> = {};

  if (raw.brand_name) footer.brand_name = raw.brand_name as string;
  if (raw.brand_description) footer.brand_description = raw.brand_description as string;
  if (raw.copyright) footer.copyright = raw.copyright as string;

  if (raw.social_links) {
    try {
      footer.social_links = JSON.parse(raw.social_links as string);
    } catch {
      footer.social_links = [];
    }
  }

  if (raw.link_columns) {
    try {
      footer.link_columns = JSON.parse(raw.link_columns as string);
    } catch {
      footer.link_columns = [];
    }
  }

  if (raw.bottom_tags) {
    try {
      footer.bottom_tags = JSON.parse(raw.bottom_tags as string);
    } catch {
      footer.bottom_tags = [];
    }
  }

  const patch: Record<string, unknown> = { footer };

  if (raw.site_logo_asset) {
    patch.site_logo = { _type: "image", asset: { _type: "reference", _ref: raw.site_logo_asset as string } };
  }

  if (doc) {
    const op = adminClient.patch(doc._id).set(patch);
    if (!raw.site_logo_asset) {
      op.unset(["site_logo"]);
    }
    await op.commit();
  } else {
    await adminClient.create({
      _type: "siteSettings",
      ...patch,
    });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
