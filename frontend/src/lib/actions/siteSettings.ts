"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { siteSettingsSchema } from "@/lib/schemas/site-settings";
import { sanityCdnUrl } from "@/lib/sanity-client";
import type { Database } from "@/lib/supabase/types";

type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

function parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

async function readSettingsRow(): Promise<SiteSettingsRow | null> {
    const { data, error } = await adminSupabase.from("site_settings").select("*").limit(1);
    if (error) throw error;
    return ((data ?? []) as SiteSettingsRow[])[0] ?? null;
}

export async function getSiteSettingsDoc(): Promise<ApiResult<Record<string, unknown>>> {
  try {
    const row = await readSettingsRow();
    if (!row) return ok({});
    const social = (row.social_links ?? {}) as Record<string, unknown>;
    const logoRaw = social.site_logo;
    const logoUrl =
      typeof logoRaw === "string" && logoRaw
        ? logoRaw.startsWith("image-")
          ? sanityCdnUrl(logoRaw)
          : logoRaw
        : null;
    return ok({
      footer: {
        brand_name: row.site_name ?? "",
        brand_description: row.tagline ?? "",
        copyright: typeof social.copyright === "string" ? social.copyright : "",
        social_links: parseJsonArray(social.social_links),
        link_columns: parseJsonArray(social.footer_links),
        bottom_tags: parseJsonArray(social.bottom_tags),
      },
      site_logo: logoUrl,
    });
  } catch (err) {
    return fromCaughtError(err, "site_settings_fetch_failed");
  }
}

export async function saveSiteSettings(formData: FormData): Promise<ApiResult<{ saved: true }>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = validateOrFail(siteSettingsSchema, raw);
        if ("error" in parsed) return parsed.error;

        const social_links: Record<string, unknown> = {};

        if (raw.social_links) {
          try {
            social_links.social_links = JSON.parse(raw.social_links as string);
          } catch {
            social_links.social_links = [];
          }
        }

        if (raw.link_columns) {
          try {
            social_links.footer_links = JSON.parse(raw.link_columns as string);
          } catch {
            social_links.footer_links = [];
          }
        }

        if (raw.bottom_tags) {
          try {
            social_links.bottom_tags = JSON.parse(raw.bottom_tags as string);
          } catch {
            social_links.bottom_tags = [];
          }
        }

        if (raw.copyright) {
            social_links.copyright = raw.copyright as string;
        }

        // Logo input carries a Sanity asset id; the DB stores the CDN URL.
        const assetId = (raw.site_logo_asset as string | null)?.trim() || null;
        social_links.site_logo = assetId ? sanityCdnUrl(assetId) : null;

        const existing = await readSettingsRow();

        const values = {
            site_name: (raw.brand_name as string) || null,
            tagline: (raw.brand_description as string) || null,
            contact_email: (raw.contact_email as string) || null,
            social_links,
        };

        if (existing) {
            const { error } = await adminSupabase
                .from("site_settings")
                .update(values)
                .eq("id", existing.id);
            if (error) throw error;
        } else {
            const { error } = await adminSupabase.from("site_settings").insert(values);
            if (error) throw error;
        }

        revalidateTag("content", "max");
        revalidatePath("/", "layout");
        revalidatePath("/admin/site-settings");
        return ok({ saved: true });
  } catch (err) {
    return fromCaughtError(err, "site_settings_save_failed");
  }
}
