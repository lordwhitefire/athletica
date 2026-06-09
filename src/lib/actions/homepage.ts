"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { homepageValidation } from "@/lib/schemas/homepage";

function ensureKey(item: Record<string, unknown>): Record<string, unknown> {
    if (item._key) return item;
    return { ...item, _key: `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
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
        banners[index] = ensureKey({ ...banners[index], ...banner });
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
        const parsed = validateOrFail(homepageValidation.section, section);
        if ("error" in parsed) return parsed.error;
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
        const parsed = validateOrFail(homepageValidation.section, section);
        if ("error" in parsed) return parsed.error;
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
        await adminClient.patch(docAny._id as string).set({ hero_carousel: heroCarousel }).commit();
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
        const banners = [...(docAny.hero_carousel as Record<string, unknown>).banners as Record<string, unknown>[], ensureKey(banner)];
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
        const items = [...(section.items as Record<string, unknown>[] || []), ensureKey(item)];
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
        items[itemIndex] = { ...items[itemIndex], ...item };
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
