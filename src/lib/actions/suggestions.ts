"use server";

import { adminClient } from "@/lib/admin-sanity";

export async function suggestBrands(query: string): Promise<string[]> {
  const q = `*[_type == "brand" && name match $q] | order(name asc) [0...10].name` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return results as string[];
}

export async function suggestCategories(query: string): Promise<string[]> {
  const q = `*[_type == "product" && category match $q] | order(category asc) [0...10].category` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestTractions(query: string): Promise<string[]> {
  const q = `*[_type == "product" && traction match $q] | order(traction asc) [0...10].traction` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestNames(query: string): Promise<string[]> {
  const q = `*[_type == "product" && name match $q] | order(name asc) [0...10].name` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestModels(query: string): Promise<string[]> {
  const q = `*[_type == "product" && model match $q] | order(model asc) [0...10].model` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestColors(query: string): Promise<string[]> {
  const q = `*[_type == "product" && color match $q] | order(color asc) [0...10].color` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestTechSole(query: string): Promise<string[]> {
  const q = `*[_type == "product" && description.technical_details.sole_type match $q] | order(description.technical_details.sole_type asc) [0...10].description.technical_details.sole_type` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestTechUpper(query: string): Promise<string[]> {
  const q = `*[_type == "product" && description.technical_details.upper_material match $q] | order(description.technical_details.upper_material asc) [0...10].description.technical_details.upper_material` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestTechRange(query: string): Promise<string[]> {
  const q = `*[_type == "product" && description.technical_details.range match $q] | order(description.technical_details.range asc) [0...10].description.technical_details.range` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestTechAdjustment(query: string): Promise<string[]> {
  const q = `*[_type == "product" && description.technical_details.adjustment match $q] | order(description.technical_details.adjustment asc) [0...10].description.technical_details.adjustment` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return [...new Set(results as string[])];
}

export async function suggestProductIds(query: string): Promise<string[]> {
  const q = `*[_type == "product" && (id match $q || name match $q || model match $q)] | score(boost(id match $q, 3)) [0...15] {id, name}` as const;
  const results = await adminClient.fetch(q, { q: `${query}*` });
  return (results as { id: string; name: string }[]).map(
    (p) => `${p.name} (${p.id})`
  );
}

const MATERIAL_ICONS = [
  "public", "mail", "phone", "facebook", "instagram", "twitter", "youtube",
  "linkedin", "tiktok", "snapchat", "pinterest", "reddit", "whatsapp",
  "telegram", "discord", "twitch", "vimeo", "dribbble", "behance",
  "share", "link", "language", "map", "location_on", "email",
  "call", "chat", "message", "forum", "rss_feed", "subscriptions",
  "notifications", "settings", "info", "help", "support",
];

export async function suggestMaterialIcons(query: string): Promise<string[]> {
  if (!query) return MATERIAL_ICONS.slice(0, 15);
  return MATERIAL_ICONS.filter((name) => name.includes(query.toLowerCase())).slice(0, 15);
}

export async function suggestRoutes(query: string): Promise<string[]> {
  const navRoutes: string[] = await adminClient.fetch(
    `*[_type == "navigation"][0].items[].children[].href`
  );
  const productRoutes: string[] = await adminClient.fetch(
    `*[_type == "product" && defined(url_slug)] {url_slug} | order(url_slug asc) [0...20].url_slug`
  );
  const all = [
    "/",
    ...productRoutes.map((s: string) => `/products/${s}`),
    ...navRoutes,
  ];
  const unique = [...new Set(all)] as string[];
  if (!query) return unique.slice(0, 15);
  return unique.filter((r) => r.toLowerCase().includes(query.toLowerCase())).slice(0, 15);
}
