"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

function ensureKey(item: Record<string, unknown>): Record<string, unknown> {
    if (item._key) return item;
    return { ...item, _key: `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
}

export async function getHomepageDoc() {
    return adminClient.fetch(`*[_type == "homepage"][0]`);
}

export async function getDistinctTractions(): Promise<string[]> {
    const results = await adminClient.fetch(`*[_type == "product" && defined(traction)].traction`);
    return [...new Set(results as string[])].sort();
}

export async function updateBanner(index: number, banner: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners];
    banners[index] = ensureKey({ ...banners[index], ...banner });
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function deleteSection(sectionIndex: number) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    sections.splice(sectionIndex, 1);
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function addSection(section: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections, ensureKey(section)];
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function updateSection(index: number, section: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    sections[index] = ensureKey({ ...sections[index], ...section });
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function updateHeroCarousel(heroCarousel: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc) return;
    await adminClient.patch(doc._id).set({ hero_carousel: heroCarousel }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function addBanner(banner: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners, ensureKey(banner)];
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function deleteBanner(index: number) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners];
    banners.splice(index, 1);
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function reorderSections(fromIndex: number, toIndex: number) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function addSectionItem(sectionIndex: number, item: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections?.[sectionIndex]) return;
    const sections = [...doc.sections];
    const section = { ...sections[sectionIndex] as Record<string, unknown> };
    const items = [...(section.items as Record<string, unknown>[] || []), ensureKey(item)];
    section.items = items;
    sections[sectionIndex] = section;
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function updateSectionItem(sectionIndex: number, itemIndex: number, item: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections?.[sectionIndex]) return;
    const sections = [...doc.sections];
    const section = { ...sections[sectionIndex] as Record<string, unknown> };
    const items = [...(section.items as Record<string, unknown>[] || [])];
    items[itemIndex] = { ...items[itemIndex], ...item };
    section.items = items;
    sections[sectionIndex] = section;
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}

export async function deleteSectionItem(sectionIndex: number, itemIndex: number) {
    const doc = await getHomepageDoc();
    if (!doc?.sections?.[sectionIndex]) return;
    const sections = [...doc.sections];
    const section = { ...sections[sectionIndex] as Record<string, unknown> };
    const items = [...(section.items as Record<string, unknown>[] || [])];
    items.splice(itemIndex, 1);
    section.items = items;
    sections[sectionIndex] = section;
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
    revalidatePath("/");
}
