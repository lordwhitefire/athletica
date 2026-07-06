"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { homepageValidation } from "@/lib/schemas/homepage";

function ensureKey(item: Record<string, unknown>): Record<string, unknown> {
    if (item._key) return item;
    return { ...item, _key: `k-${randomUUID()}` };
}

// Recursively walk a homepage document and ensure every array item that
// represents a Sanity object (banners, sections, items, cards) carries a
// stable _key. Used by saveHomepage so the bulk-save path matches the
// per-item save paths (addBanner / addSection / addSectionItem / etc).
function ensureKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((v) =>
            v && typeof v === "object" ? ensureKey(ensureKeysDeep(v) as Record<string, unknown>) : v
        );
    }
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = ensureKeysDeep(v);
        }
        return out;
    }
    return value;
}

export async function getHomepageDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const doc = await adminClient.fetch(`*[_type == "homepage"][0]`);
        return ok(doc as Record<string, unknown>);
    } catch (err) {
        return fromCaughtError(err, "homepage_doc_fetch_failed");
    }
}

export async function getDistinctTractions(): Promise<ApiResult<string[]>> {
    try {
        const results = await adminClient.fetch(`*[_type == "product" && defined(traction)].traction`);
        return ok([...new Set(results as string[])].sort());
    } catch (err) {
        return fromCaughtError(err, "distinct_tractions_fetch_failed");
    }
}

export async function updateBanner(index: number, banner: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.banner, banner);
        if ("error" in parsed) return parsed.error;
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!(docAny.hero_carousel as Record<string, unknown>)?.banners) return fail("not_found", "banners_not_found", "No banners found.");
        const banners = [...(docAny.hero_carousel as Record<string, unknown>).banners as Record<string, unknown>[]];
        banners[index] = ensureKey({ ...banners[index], ...parsed.data as Record<string, unknown> });
        await adminClient.patch(docAny._id as string).set({ "hero_carousel.banners": banners }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "banner_update_failed");
    }
}

export async function deleteSection(sectionIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!docAny.sections) return fail("not_found", "sections_not_found", "No sections found.");
        const sections = [...(docAny.sections as Record<string, unknown>[])];
        sections.splice(sectionIndex, 1);
        await adminClient.patch(docAny._id as string).set({ sections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "section_delete_failed");
    }
}

export async function addSection(section: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!docAny.sections) return fail("not_found", "sections_not_found", "No sections found.");
        const sections = [...(docAny.sections as Record<string, unknown>[]), ensureKey(section)];
        await adminClient.patch(docAny._id as string).set({ sections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "section_add_failed");
    }
}

export async function updateSection(index: number, section: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!docAny.sections) return fail("not_found", "sections_not_found", "No sections found.");
        const sections = [...(docAny.sections as Record<string, unknown>[])];
        sections[index] = ensureKey({ ...sections[index], ...section });
        await adminClient.patch(docAny._id as string).set({ sections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "section_update_failed");
    }
}

export async function updateHeroCarousel(heroCarousel: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.heroCarousel, heroCarousel);
        if ("error" in parsed) return parsed.error;
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        await adminClient.patch(docAny._id as string).set({ hero_carousel: parsed.data }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "hero_carousel_update_failed");
    }
}

export async function addBanner(banner: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.banner, banner);
        if ("error" in parsed) return parsed.error;
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!(docAny.hero_carousel as Record<string, unknown>)?.banners) return fail("not_found", "banners_not_found", "No banners found.");
        const banners = [...(docAny.hero_carousel as Record<string, unknown>).banners as Record<string, unknown>[], ensureKey(parsed.data as Record<string, unknown>)];
        await adminClient.patch(docAny._id as string).set({ "hero_carousel.banners": banners }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "banner_add_failed");
    }
}

export async function deleteBanner(index: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!(docAny.hero_carousel as Record<string, unknown>)?.banners) return fail("not_found", "banners_not_found", "No banners found.");
        const banners = [...(docAny.hero_carousel as Record<string, unknown>).banners as Record<string, unknown>[]];
        banners.splice(index, 1);
        await adminClient.patch(docAny._id as string).set({ "hero_carousel.banners": banners }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "banner_delete_failed");
    }
}

export async function reorderSections(fromIndex: number, toIndex: number): Promise<ApiResult<{ reordered: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        if (!docAny.sections) return fail("not_found", "sections_not_found", "No sections found.");
        const sections = [...(docAny.sections as Record<string, unknown>[])];
        const [moved] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, moved);
        await adminClient.patch(docAny._id as string).set({ sections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ reordered: true });
    } catch (err) {
        return fromCaughtError(err, "sections_reorder_failed");
    }
}

export async function addSectionItem(sectionIndex: number, item: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.sectionItem, item);
        if ("error" in parsed) return parsed.error;
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const items = [...(section.items as Record<string, unknown>[] || []), ensureKey(parsed.data as Record<string, unknown>)];
        section.items = items;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "section_item_add_failed");
    }
}

export async function updateSectionItem(sectionIndex: number, itemIndex: number, item: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const parsed = validateOrFail(homepageValidation.sectionItem, item);
        if ("error" in parsed) return parsed.error;
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const items = [...(section.items as Record<string, unknown>[] || [])];
        items[itemIndex] = { ...items[itemIndex], ...parsed.data as Record<string, unknown> };
        section.items = items;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "section_item_update_failed");
    }
}

export async function deleteSectionItem(sectionIndex: number, itemIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const items = [...(section.items as Record<string, unknown>[] || [])];
        items.splice(itemIndex, 1);
        section.items = items;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "section_item_delete_failed");
    }
}

export async function addCarouselCard(sectionIndex: number, card: Record<string, unknown>): Promise<ApiResult<{ added: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const cards = [...(section.cards as Record<string, unknown>[] || []), ensureKey(card)];
        section.cards = cards;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ added: true });
    } catch (err) {
        return fromCaughtError(err, "carousel_card_add_failed");
    }
}

export async function updateCarouselCard(sectionIndex: number, cardIndex: number, card: Record<string, unknown>): Promise<ApiResult<{ updated: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const cards = [...(section.cards as Record<string, unknown>[] || [])];
        cards[cardIndex] = { ...cards[cardIndex], ...card };
        section.cards = cards;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ updated: true });
    } catch (err) {
        return fromCaughtError(err, "carousel_card_update_failed");
    }
}

export async function deleteCarouselCard(sectionIndex: number, cardIndex: number): Promise<ApiResult<{ deleted: true }>> {
    try {
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        const sections = (docAny.sections as Record<string, unknown>[] | undefined);
        if (!sections?.[sectionIndex]) return fail("not_found", "section_not_found", "Section not found.");
        const updatedSections = [...sections];
        const section = { ...updatedSections[sectionIndex] as Record<string, unknown> };
        const cards = [...(section.cards as Record<string, unknown>[] || [])];
        cards.splice(cardIndex, 1);
        section.cards = cards;
        updatedSections[sectionIndex] = section;
        await adminClient.patch(docAny._id as string).set({ sections: updatedSections }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "carousel_card_delete_failed");
    }
}

export async function getPreviewProducts(
    filter: Record<string, unknown>,
    sort: string,
    limit: number
): Promise<ApiResult<Record<string, unknown>[]>> {
    try {
        const conditions: string[] = [`_type == "product"`];
        if (filter.category) conditions.push(`category == $category`);
        if (filter.brand) conditions.push(`brand == $brand`);
        if (filter.name) conditions.push(`name == $name`);
        if (filter.traction) conditions.push(`traction == $traction`);
        if (filter.min_price) conditions.push(`price.current >= $minPrice`);
        if (filter.max_price) conditions.push(`price.current <= $maxPrice`);

        let order = "_createdAt desc";
        if (sort === "price_asc") order = "price.current asc";
        else if (sort === "price_desc") order = "price.current desc";
        else if (sort === "biggest_discount") order = "price.discount_percent desc";
        else if (sort === "newest") order = "_createdAt desc";

        const query = `*[${conditions.join(" && ")}] | order(${order}) [0...$limit] {
            _id,
            id,
            model,
            brand,
            category,
            traction,
            name,
            gender,
            "main_image": main_image.asset->url,
            "url_slug": url_slug.current,
            color,
            price
        }`;

        const params: Record<string, unknown> = {};
        if (filter.category) params.category = filter.category;
        if (filter.brand) params.brand = filter.brand;
        if (filter.name) params.name = filter.name;
        if (filter.traction) params.traction = filter.traction;
        if (filter.min_price) params.minPrice = parseFloat(filter.min_price as string);
        if (filter.max_price) params.maxPrice = parseFloat(filter.max_price as string);
        params.limit = limit;

        const results = await adminClient.fetch(query, params);
        return ok(results as Record<string, unknown>[]);
    } catch (err) {
        return fromCaughtError(err, "preview_products_fetch_failed");
    }
}

export async function uploadSnapshotImage(dataUrl: string): Promise<ApiResult<{ _ref: string }>> {
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
        const docResult = await getHomepageDoc();
        if (docResult.error) return docResult;
        const docAny = docResult.data as Record<string, unknown>;
        // Mirror the per-item save paths: never write an array element to
        // Sanity without a stable _key. Bug #3 from the issues doc.
        const heroCarousel = ensureKeysDeep(data.hero_carousel) as Record<string, unknown>;
        const sections = ensureKeysDeep(data.sections) as Record<string, unknown>[];
        await adminClient.patch(docAny._id as string).set({
            hero_carousel: heroCarousel,
            sections,
        }).commit();
        revalidatePath("/admin/homepage");
        revalidatePath("/");
        return ok({ saved: true });
    } catch (err) {
        return fromCaughtError(err, "homepage_save_failed");
    }
}
