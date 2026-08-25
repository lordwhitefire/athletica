"use server";

import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

function parseDescription(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function technicalValues(rows: { description: unknown }[], key: string): string[] {
    const values = new Set<string>();
    for (const row of rows) {
        const technical = parseDescription(row.description).technical_details as Record<string, unknown> | undefined;
        const value = technical?.[key];
        if (typeof value === "string" && value.trim()) values.add(value.trim());
    }
    return [...values].sort((a, b) => a.localeCompare(b)).slice(0, 10);
}

export async function suggestBrands(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("brands")
      .select("name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10);
    return ok((data ?? []).map((b) => b.name));
  } catch (err) {
    return fromCaughtError(err, "suggest_brands_failed");
  }
}

export async function suggestCategories(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("categories")
      .select("name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10);
    return ok([...new Set((data ?? []).map((c) => c.name))]);
  } catch (err) {
    return fromCaughtError(err, "suggest_categories_failed");
  }
}

export async function suggestTractions(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("attributes")
      .filter("attributes->>traction", "ilike", `%${query}%`)
      .limit(20);
    const values = new Set<string>();
    for (const row of data ?? []) {
      const attrs = (row.attributes ?? {}) as Record<string, unknown>;
      const value = attrs.traction;
      if (typeof value === "string" && value.trim()) values.add(value.trim());
    }
    return ok([...values].sort((a, b) => a.localeCompare(b)).slice(0, 10));
  } catch (err) {
    return fromCaughtError(err, "suggest_tractions_failed");
  }
}

export async function suggestNames(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("name")
      .not("name", "is", null)
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10);
    return ok([...new Set((data ?? []).map((p) => p.name as string))]);
  } catch (err) {
    return fromCaughtError(err, "suggest_names_failed");
  }
}

export async function suggestModels(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("model")
      .not("model", "is", null)
      .ilike("model", `%${query}%`)
      .order("model")
      .limit(10);
    return ok([...new Set((data ?? []).map((p) => p.model as string))]);
  } catch (err) {
    return fromCaughtError(err, "suggest_models_failed");
  }
}

export async function suggestColors(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("color")
      .not("color", "is", null)
      .ilike("color", `%${query}%`)
      .order("color")
      .limit(10);
    return ok([...new Set((data ?? []).map((p) => p.color as string))]);
  } catch (err) {
    return fromCaughtError(err, "suggest_colors_failed");
  }
}

export async function suggestTechSole(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("description")
      .limit(100);
    const values = technicalValues(data ?? [], "sole_type").filter((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    );
    return ok(values);
  } catch (err) {
    return fromCaughtError(err, "suggest_tech_sole_failed");
  }
}

export async function suggestTechUpper(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("description")
      .limit(100);
    const values = technicalValues(data ?? [], "upper_material").filter((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    );
    return ok(values);
  } catch (err) {
    return fromCaughtError(err, "suggest_tech_upper_failed");
  }
}

export async function suggestTechRange(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("description")
      .limit(100);
    const values = technicalValues(data ?? [], "range").filter((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    );
    return ok(values);
  } catch (err) {
    return fromCaughtError(err, "suggest_tech_range_failed");
  }
}

export async function suggestTechAdjustment(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("description")
      .limit(100);
    const values = technicalValues(data ?? [], "adjustment").filter((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    );
    return ok(values);
  } catch (err) {
    return fromCaughtError(err, "suggest_tech_adjustment_failed");
  }
}

export async function suggestProductIds(query: string): Promise<ApiResult<string[]>> {
  try {
    const { data } = await adminSupabase
      .from("products")
      .select("id, name")
      .or(`id.ilike.%${query}%,name.ilike.%${query}%,model.ilike.%${query}%`)
      .limit(15);
    const mapped = (data ?? []).map((p) => `${p.name ?? p.id} (${p.id})`);
    return ok(mapped);
  } catch (err) {
    return fromCaughtError(err, "suggest_product_ids_failed");
  }
}

const MATERIAL_ICONS = [
  "public", "mail", "phone", "facebook", "instagram", "twitter", "youtube",
  "linkedin", "tiktok", "snapchat", "pinterest", "reddit", "whatsapp",
  "telegram", "discord", "twitch", "vimeo", "dribbble", "behance",
  "share", "link", "language", "map", "location_on", "email",
  "call", "chat", "message", "forum", "rss_feed", "subscriptions",
  "notifications", "settings", "info", "help", "support",
];

export async function suggestMaterialIcons(query: string): Promise<ApiResult<string[]>> {
  if (!query) return ok(MATERIAL_ICONS.slice(0, 15));
  return ok(MATERIAL_ICONS.filter((name) => name.includes(query.toLowerCase())).slice(0, 15));
}

export async function suggestRoutes(query: string): Promise<ApiResult<string[]>> {
  try {
    const [productRes, navRes] = await Promise.all([
      adminSupabase.from("products").select("slug").order("slug").limit(20),
      adminSupabase.from("navigation").select("route").not("route", "is", null),
    ]);
    if (productRes.error) throw productRes.error;
    if (navRes.error) throw navRes.error;
    const productRoutes = (productRes.data ?? []).map((p) => p.slug);
    const navRoutes = (navRes.data ?? [])
      .map((n) => n.route as string)
      .filter(Boolean);
    const all = [
      "/",
      ...productRoutes.map((s: string) => `/products/${s}`),
      ...navRoutes,
    ];
    const unique = [...new Set(all)] as string[];
    if (!query) return ok(unique.slice(0, 15));
    return ok(unique.filter((r) => r.toLowerCase().includes(query.toLowerCase())).slice(0, 15));
  } catch (err) {
    return fromCaughtError(err, "suggest_routes_failed");
  }
}