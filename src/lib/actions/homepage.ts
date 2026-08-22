"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { homepageValidation } from "@/lib/schemas/homepage";
import { sanityCdnUrl } from "@/lib/sanity-client";
import {
  resolveBrandFilter,
  resolveCategoryFilter,
  getCachedProducts,
} from "@/lib/products/product-service";

type HomepageSectionsRow = Database["public"]["Tables"]["homepage_sections"]["Row"];

function revalidateContent() {
    revalidateTag("content", "max");
    revalidatePath("/", "layout");
    revalidatePath("/admin/homepage");
    revalidatePath("/admin/homepage/editor");
}

async function fetchRows(): Promise<HomepageSectionsRow[]> {
    const { data, error } = await adminSupabase
        .from("homepage_sections")
        .select("*")
        .order("order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HomepageSectionsRow[];
}

// Editor image values arrive as Sanity-style objects ({_type:"image",asset:{_ref}}),
// raw asset ids ("image-…") or plain URLs. The DB stores full CDN URLs.
function toStoredImageUrl(value: unknown): string | null {
    let ref: string | null = null;
    if (typeof value === "string") {
        ref = value;
    } else if (value && typeof value === "object") {
        const asset = (value as Record<string, unknown>).asset;
        if (asset && typeof asset === "object") {
            const inner = (asset as Record<string, unknown>)._ref;
            if (typeof inner === "string") ref = inner;
        }
    }
    if (!ref) return null;
    if (ref.startsWith("image-")) return sanityCdnUrl(ref);
    return ref;
}

function attrs(row: HomepageSectionsRow): Record<string, unknown> {
    return (row.attributes ?? {}) as Record<string, unknown>;
}

function bannerKey(row: HomepageSectionsRow): string {
    const a = attrs(row);
    return typeof a.original_id === "string" && a.original_id ? a.original_id : `hero-${row.order}`;
}

function sectionKey(row: HomepageSectionsRow): string {
    const a = attrs(row);
    return typeof a.original_id === "string" && a.original_id ? a.original_id : row.id;
}

function originalTypeOf(row: HomepageSectionsRow): string {
    const a = attrs(row);
    if (typeof a.original_type === "string") return a.original_type;
    return row.type === "grid" ? "category_grid" : "product_carousel";
}

function editorItemsOf(row: HomepageSectionsRow): Record<string, unknown>[] {
    const items = attrs(row).items;
    if (!Array.isArray(items)) return [];
    const fallbackImages = row.image_links ?? [];
    return items.map((item, i) => {
        const it = (item ?? {}) as Record<string, unknown>;
        const image =
            typeof it.image === "string" && it.image
                ? it.image
                : fallbackImages[i] ?? null;
        return {
            _key: typeof it._key === "string" ? it._key : `${row.id}-item-${i}`,
            title: typeof it.title === "string" ? it.title : "",
            label: typeof it.label === "string" ? it.label : "",
            link: typeof it.link === "string" && it.link ? it.link : "/",
            bg: typeof it.bg === "string" ? it.bg : "",
            textColor: typeof it.textColor === "string" ? it.textColor : "",
            accent: typeof it.accent === "string" ? it.accent : "",
            image,
        };
    });
}

function editorCardsOf(row: HomepageSectionsRow): Record<string, unknown>[] {
    const cards = attrs(row).cards;
    if (!Array.isArray(cards)) return [];
    const fallbackImages = row.image_links ?? [];
    return cards.map((card, i) => {
        const c = (card ?? {}) as Record<string, unknown>;
        const image =
            typeof c.image === "string" && c.image
                ? c.image
                : fallbackImages[i] ?? null;
        return {
            _key: typeof c._key === "string" ? c._key : `${row.id}-card-${i}`,
            id: typeof c.id === "string" && c.id ? c.id : `${row.id}-card-${i}`,
            title: typeof c.title === "string" ? c.title : "",
            subtitle: typeof c.subtitle === "string" ? c.subtitle : "",
            link: typeof c.link === "string" && c.link ? c.link : "/",
            gradient: typeof c.gradient === "string" ? c.gradient : "",
            emoji: typeof c.emoji === "string" ? c.emoji : "",
            image,
        };
    });
}

function docFromRows(rows: HomepageSectionsRow[]): Record<string, unknown> {
    const heroRows = rows.filter((r) => r.type === "hero");
    const contentRows = rows.filter((r) => r.type !== "hero");

    const banners = heroRows.map((row) => {
        const a = attrs(row);
        return {
            _key: bannerKey(row),
            id: bannerKey(row),
            title: row.title ?? "",
            subtitle: row.copy ?? "",
            button_text: typeof a.button_text === "string" ? a.button_text : "",
            link: typeof a.link === "string" && a.link ? a.link : "/",
            gradient: typeof a.gradient === "string" ? a.gradient : "",
            accent_color: typeof a.accent_color === "string" ? a.accent_color : "",
            image: row.image_links?.[0] ?? null,
        };
    });

    const sections = contentRows.map((row) => {
        const a = attrs(row);
        const base: Record<string, unknown> = {
            _key: sectionKey(row),
            _type: originalTypeOf(row),
            type: originalTypeOf(row),
            variant: typeof a.variant === "string" ? a.variant : "default",
            title: row.title ?? "",
            subtitle: row.copy ?? "",
        };
        if (originalTypeOf(row) === "category_grid") {
            base.variant = typeof a.variant === "string" ? a.variant : "grid-4-equal";
            base.bg = typeof a.bg === "string" && a.bg ? a.bg : "bg-surface";
            base.viewAllLink = typeof a.link === "string" ? a.link : "";
            base.viewAllLabel = typeof a.link_label === "string" ? a.link_label : "";
            base.items = editorItemsOf(row);
        } else if (originalTypeOf(row) === "category_carousel") {
            base.autoSwitchMs = typeof a.autoSwitchMs === "number" ? a.autoSwitchMs : 4000;
            base.cards = editorCardsOf(row);
        } else {
            base.sort = typeof a.sort === "string" ? a.sort : "newest";
            base.limit = row.limit ?? 10;
            base.link = typeof a.link === "string" ? a.link : "";
            base.link_label = typeof a.link_label === "string" ? a.link_label : "";
            base.filter =
                a.filter && typeof a.filter === "object"
                    ? a.filter
                    : ({} as Record<string, unknown>);
        }
        return base;
    });

    return { _id: "homepage", hero_carousel: { banners }, sections };
}

export async function getHomepageDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const rows = await fetchRows();
        return ok(docFromRows(rows));
    } catch (err) {
        return fromCaughtError(err, "homepage_doc_fetch_failed");
    }
}

export async function getDistinctTractions(): Promise<ApiResult<string[]>> {
    try {
        const { data, error } = await adminSupabase
            .from("products")
            .select("attributes->>traction");
        if (error) throw error;
        const values = (data ?? [])
            .map((r: { traction?: string | null }) => r.traction)
            .filter((t): t is string => Boolean(t));
        return ok([...new Set(values)].sort());
    } catch (err) {
        return fromCaughtError(err, "distinct_tractions_fetch_failed");
    }
}

// ---------------------------------------------------------------------------
// Hero banners → rows with type 'hero'
// ---------------------------------------------------------------------------

interface BannerPayload extends Record<string, unknown> {
    title?: string;
    subtitle?: string;
    button_text?: string;
    link?: string;
    gradient?: string;
    accent_color?: string;
    image?: unknown;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function heroInsertFromBanner(banner: BannerPayload, order: number) {
    const imageUrl = toStoredImageUrl(banner.image);
    const key = typeof banner._key === "string" ? banner._key : (typeof banner.id === "string" ? banner.id : undefined);
    const id = key && uuidRegex.test(key) ? key : undefined;
    return {
        ...(id ? { id } : {}),
        type: "hero" as const,
        order,
        title: banner.title || "",
        copy: banner.subtitle || "",
        category_id: null,
        limit: null,
        image_links: imageUrl ? [imageUrl] : [],
        attributes: {
            button_text: banner.button_text || "",
            link: banner.link || "/",
            gradient: banner.gradient || "",
            accent_color: banner.accent_color || "",
            original_id: key,
        },
    };
}

export async function updateBanner(index: number, banner: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.banner, banner);
        if ("error" in parsed) return parsed.error;
        const heroRows = (await fetchRows()).filter((r) => r.type === "hero");
        const target = heroRows[index];
        if (!target) return fail("not_found", "banners_not_found", "No banners found.");
        const payload = parsed.data as BannerPayload;
        const mergedAttributes = { ...attrs(target), ...payload } as Record<string, unknown>;
        delete mergedAttributes.image;
        delete mergedAttributes.title;
        delete mergedAttributes.subtitle;
        const imageUrl = toStoredImageUrl(payload.image);
        const { error } = await adminSupabase
            .from("homepage_sections")
            .update({
                title: payload.title ?? target.title,
                copy: payload.subtitle ?? target.copy,
                ...(imageUrl !== null ? { image_links: [imageUrl] } : {}),
                attributes: mergedAttributes,
            })
            .eq("id", target.id);
        if (error) throw error;
        revalidateContent();
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "banner_update_failed");
    }
}

export async function addBanner(banner: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.banner, banner);
        if ("error" in parsed) return parsed.error;
        const rows = await fetchRows();
        const maxOrder = rows.reduce((max, r) => Math.max(max, r.order), -1);
        const payload = parsed.data as BannerPayload;
        const insert = heroInsertFromBanner(
            { ...payload, _key: payload._key ?? payload.id },
            maxOrder + 1,
        );
        const { error } = await adminSupabase.from("homepage_sections").insert(insert);
        if (error) throw error;
        revalidateContent();
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "banner_add_failed");
    }
}

export async function deleteBanner(index: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const heroRows = (await fetchRows()).filter((r) => r.type === "hero");
        const target = heroRows[index];
        if (!target) return fail("not_found", "banners_not_found", "No banners found.");
        const { error } = await adminSupabase.from("homepage_sections").delete().eq("id", target.id);
        if (error) throw error;
        revalidateContent();
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "banner_delete_failed");
    }
}

export async function updateHeroCarousel(heroCarousel: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    // Legacy single-hero action from the old Sanity document shape; the
    // Supabase model stores the carousel as one row per banner.
    // Use addBanner / updateBanner / deleteBanner instead.
    void heroCarousel;
    return fail("validation_error", "unsupported_action", "Use the per-banner actions to edit the hero carousel.");
}

// ---------------------------------------------------------------------------
// Sections (carousels + grids) → rows with type 'carousel' / 'grid'
// ---------------------------------------------------------------------------

function collectSectionImages(section: Record<string, unknown>): string[] {
    const images: string[] = [];
    const items = Array.isArray(section.items) ? section.items : [];
    for (const item of items) {
        const url = toStoredImageUrl(item?.image);
        if (url) images.push(url);
    }
    const cards = Array.isArray(section.cards) ? section.cards : [];
    for (const card of cards) {
        const url = toStoredImageUrl(card?.image);
        if (url) images.push(url);
    }
    return images;
}

function cleanAttributesForStorage(section: Record<string, unknown>, keepKeys: string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of keepKeys) {
        if (section[key] !== undefined) out[key] = section[key];
    }
    return out;
}

function sectionToRowValues(section: Record<string, unknown>, order: number) {
    const originalType = String(section._type ?? section.type ?? "product_carousel");
    const type = originalType === "category_grid" ? "grid" as const : "carousel" as const;
    const key = typeof section._key === "string" ? section._key : (typeof section.id === "string" ? section.id : undefined);
    const id = key && uuidRegex.test(key) ? key : undefined;

    // Items/cards carry Sanity-style image objects; store URL strings instead.
    const storedItems = Array.isArray(section.items)
        ? section.items.map((item) => {
              const it = (item ?? {}) as Record<string, unknown>;
              return { ...it, image: toStoredImageUrl(it.image) };
          })
        : undefined;
    const storedCards = Array.isArray(section.cards)
        ? section.cards.map((card) => {
              const c = (card ?? {}) as Record<string, unknown>;
              return { ...c, image: toStoredImageUrl(c.image) };
          })
        : undefined;

    const keepKeys = ["variant", "bg", "filter", "link", "link_label", "sort", "autoSwitchMs"];
    const attributes = cleanAttributesForStorage(section, keepKeys);
    attributes.original_type = originalType;
    attributes.original_id = key;
    if (storedItems) attributes.items = storedItems;
    if (storedCards) attributes.cards = storedCards;

    return {
        ...(id ? { id } : {}),
        type,
        order,
        title: String(section.title ?? ""),
        copy: String(section.subtitle ?? ""),
        category_id: null,
        limit:
            originalType === "product_carousel"
                ? typeof section.limit === "number"
                    ? section.limit
                    : 10
                : null,
        image_links: collectSectionImages(section),
        attributes,
    };
}

export async function deleteSection(sectionIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const contentRows = (await fetchRows()).filter((r) => r.type !== "hero");
        const target = contentRows[sectionIndex];
        if (!target) return fail("not_found", "sections_not_found", "No sections found.");
        const { error } = await adminSupabase.from("homepage_sections").delete().eq("id", target.id);
        if (error) throw error;
        revalidateContent();
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "section_delete_failed");
    }
}

export async function addSection(section: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const rows = await fetchRows();
        const maxOrder = rows.reduce((max, r) => Math.max(max, r.order), -1);
        const { error } = await adminSupabase
            .from("homepage_sections")
            .insert(sectionToRowValues(section, maxOrder + 1));
        if (error) throw error;
        revalidateContent();
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "section_add_failed");
    }
}

export async function updateSection(index: number, section: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const contentRows = (await fetchRows()).filter((r) => r.type !== "hero");
        const target = contentRows[index];
        if (!target) return fail("not_found", "sections_not_found", "No sections found.");
        const values = sectionToRowValues(section, target.order);
        const { error } = await adminSupabase
            .from("homepage_sections")
            .update(values)
            .eq("id", target.id);
        if (error) throw error;
        revalidateContent();
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "section_update_failed");
    }
}

export async function reorderSections(fromIndex: number, toIndex: number): Promise<ApiResult<{ reordered: true }>> {
    try {
        const contentRows = (await fetchRows()).filter((r) => r.type !== "hero");
        if (!contentRows[fromIndex] || toIndex < 0 || toIndex >= contentRows.length) {
            return fail("not_found", "sections_not_found", "No sections found.");
        }
        const reordered = [...contentRows];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        for (let i = 0; i < reordered.length; i++) {
            if (reordered[i].order === i) continue;
            const { error } = await adminSupabase
                .from("homepage_sections")
                .update({ order: i })
                .eq("id", reordered[i].id);
            if (error) throw error;
        }
        revalidateContent();
        return ok({ reordered: true });
    } catch (err) {
        return fromCaughtError(err, "sections_reorder_failed");
    }
}

async function patchSectionCollection(
    sectionIndex: number,
    collection: "items" | "cards",
    mutate: (list: Record<string, unknown>[]) => Record<string, unknown>[],
): Promise<ApiResult<unknown>> {
    const contentRows = (await fetchRows()).filter((r) => r.type !== "hero");
    const target = contentRows[sectionIndex];
    if (!target) return fail("not_found", "section_not_found", "Section not found.");
    const current = attrs(target);
    const list = Array.isArray(current[collection]) ? ([...current[collection]] as Record<string, unknown>[]) : [];
    const next = mutate(list);
    current[collection] = next;

    // Keep image_links in sync so the storefront mapping can use them directly.
    const images = (next as Record<string, unknown>[])
        .map((entry) => (typeof entry.image === "string" && entry.image ? entry.image : null))
        .filter((v): v is string => Boolean(v));

    const { error } = await adminSupabase
        .from("homepage_sections")
        .update({ attributes: current, image_links: images })
        .eq("id", target.id);
    if (error) throw error;
    revalidateContent();
    return ok({ updated: true });
}

export async function addSectionItem(sectionIndex: number, item: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.sectionItem, item);
        if ("error" in parsed) return parsed.error;
        const result = await patchSectionCollection(sectionIndex, "items", (list) => [
            ...list,
            { ...parsed.data, image: toStoredImageUrl(item.image) },
        ]);
        return result as ApiResult<{ added: true }>;
    } catch (err) {
        return fromCaughtError(err, "section_item_add_failed");
    }
}

export async function updateSectionItem(sectionIndex: number, itemIndex: number, item: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.sectionItem, item);
        if ("error" in parsed) return parsed.error;
        const result = await patchSectionCollection(sectionIndex, "items", (list) =>
            list.map((entry, i) =>
                i === itemIndex
                    ? {
                          ...entry,
                          ...parsed.data,
                          image: "image" in item ? toStoredImageUrl(item.image) : entry.image,
                      }
                    : entry,
            ),
        );
        return result as ApiResult<{ updated: true }>;
    } catch (err) {
        return fromCaughtError(err, "section_item_update_failed");
    }
}

export async function deleteSectionItem(sectionIndex: number, itemIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const result = await patchSectionCollection(sectionIndex, "items", (list) =>
            list.filter((_, i) => i !== itemIndex),
        );
        return result as ApiResult<{ deleted: true }>;
    } catch (err) {
        return fromCaughtError(err, "section_item_delete_failed");
    }
}

export async function addCarouselCard(sectionIndex: number, card: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const result = await patchSectionCollection(sectionIndex, "cards", (list) => [
            ...list,
            { ...card, image: toStoredImageUrl(card.image) },
        ]);
        return result as ApiResult<{ added: true }>;
    } catch (err) {
        return fromCaughtError(err, "carousel_card_add_failed");
    }
}

export async function updateCarouselCard(sectionIndex: number, cardIndex: number, card: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const result = await patchSectionCollection(sectionIndex, "cards", (list) =>
            list.map((entry, i) =>
                i === cardIndex
                    ? { ...entry, ...card, image: "image" in card ? toStoredImageUrl(card.image) : entry.image }
                    : entry,
            ),
        );
        return result as ApiResult<{ updated: true }>;
    } catch (err) {
        return fromCaughtError(err, "carousel_card_update_failed");
    }
}

export async function deleteCarouselCard(sectionIndex: number, cardIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const result = await patchSectionCollection(sectionIndex, "cards", (list) =>
            list.filter((_, i) => i !== cardIndex),
        );
        return result as ApiResult<{ deleted: true }>;
    } catch (err) {
        return fromCaughtError(err, "carousel_card_delete_failed");
    }
}

// ---------------------------------------------------------------------------
// Carousel preview — resolves through the Product Service (DB), not Sanity
// ---------------------------------------------------------------------------

export async function getPreviewProducts(
    filter: Record<string, unknown>,
    sort: string,
    limit: number
): Promise<ApiResult<Record<string, unknown>[]>> {
    try {
        const brandSlug =
            typeof filter.brand === "string" && filter.brand ? await resolveBrandFilter(filter.brand) : null;
        const categorySlug =
            typeof filter.category === "string" && filter.category
                ? await resolveCategoryFilter(filter.category)
                : null;

        const result = await getCachedProducts({
            ...(brandSlug ? { brand: brandSlug } : {}),
            ...(categorySlug ? { category: categorySlug } : {}),
            ...(typeof filter.traction === "string" && filter.traction
                ? { traction: filter.traction.toUpperCase() }
                : {}),
            ...(typeof filter.name === "string" && filter.name ? { search: filter.name } : {}),
            ...(typeof filter.min_price === "number" ? { priceMin: filter.min_price } : {}),
            ...(typeof filter.max_price === "number" ? { priceMax: filter.max_price } : {}),
            sort: (["price_asc", "price_desc", "newest"].includes(sort)
                ? sort
                : "newest") as "price_asc" | "price_desc" | "newest",
            page: 1,
            pageSize: Math.max(1, limit),
            status: "published",
        });

        const products = result.items.map((p) => ({
            _id: p.id,
            id: p.id,
            model: p.model,
            brand: p.brand?.name ?? "",
            category: p.category?.name ?? "",
            traction: p.attributes?.traction ?? null,
            name: p.name,
            gender: p.gender,
            main_image: p.image_links?.[0] ?? null,
            url_slug: p.slug,
            color: p.color,
            price: p.attributes?.price ?? null,
        }));
        return ok(products);
    } catch (err) {
        return fromCaughtError(err, "preview_products_fetch_failed");
    }
}

export async function uploadSnapshotImage(dataUrl: string): Promise<ApiResult<{ _ref: string }>> {
    // Image ASSETS stay in Sanity by design; only their URLs live in Supabase.
    const { adminClient } = await import("@/lib/admin-sanity");
    try {
        const base64Data = dataUrl.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const asset = await adminClient.assets.upload("image", buffer, {
            filename: "snapshot.png",
            contentType: "image/png",
        });
        return ok({ _ref: asset._id });
    } catch (err) {
        return fromCaughtError(err, "snapshot_upload_failed");
    }
}

export async function saveHomepage(data: {
    hero_carousel: Record<string, unknown>;
    sections: Record<string, unknown>[];
}): Promise<ApiResult<{ saved: true }>> {
    try {
        const banners = (data.hero_carousel.banners as Record<string, unknown>[] | undefined) ?? [];
        const sections = data.sections ?? [];

        const survivingIds = [
            ...banners.map((b) => b._key || b.id),
            ...sections.map((s) => s._key || s.id),
        ].filter((id): id is string => typeof id === "string" && uuidRegex.test(id));

        if (survivingIds.length > 0) {
            const { error: deleteError } = await adminSupabase
                .from("homepage_sections")
                .delete()
                .not("id", "in", `(${survivingIds.join(",")})`);
            if (deleteError) throw deleteError;
        } else {
            const { error: deleteError } = await adminSupabase
                .from("homepage_sections")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000");
            if (deleteError) throw deleteError;
        }

        const heroInserts = banners.map((banner, i) => {
            const payload = banner as BannerPayload;
            const insert = heroInsertFromBanner({ ...payload, _key: payload._key ?? payload.id }, i);
            return insert;
        });
        const sectionInserts = sections.map((section, i) => sectionToRowValues(section, banners.length + i));

        if (heroInserts.length > 0) {
            const { error } = await adminSupabase
                .from("homepage_sections")
                .upsert(heroInserts, { onConflict: "id" });
            if (error) throw error;
        }
        if (sectionInserts.length > 0) {
            const { error } = await adminSupabase
                .from("homepage_sections")
                .upsert(sectionInserts, { onConflict: "id" });
            if (error) throw error;
        }

        revalidateContent();
        return ok({ saved: true });
    } catch (err) {
        return fromCaughtError(err, "homepage_save_failed");
    }
}
