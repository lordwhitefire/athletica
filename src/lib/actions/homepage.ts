"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

export async function getHomepageDoc() {
    return adminClient.fetch(`*[_type == "homepage"][0]`);
}

export async function updateBanner(index: number, banner: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners];
    banners[index] = { ...banners[index], ...banner };
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
}

export async function deleteSection(sectionIndex: number) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    sections.splice(sectionIndex, 1);
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
}

export async function addSection(section: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections, section];
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
}

export async function updateSection(index: number, section: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    sections[index] = section;
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
}

export async function updateHeroCarousel(heroCarousel: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc) return;
    await adminClient.patch(doc._id).set({ hero_carousel: heroCarousel }).commit();
    revalidatePath("/admin/homepage");
}

export async function addBanner(banner: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners, banner];
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
}

export async function deleteBanner(index: number) {
    const doc = await getHomepageDoc();
    if (!doc?.hero_carousel?.banners) return;
    const banners = [...doc.hero_carousel.banners];
    banners.splice(index, 1);
    await adminClient.patch(doc._id).set({ "hero_carousel.banners": banners }).commit();
    revalidatePath("/admin/homepage");
}

export async function reorderSections(fromIndex: number, toIndex: number) {
    const doc = await getHomepageDoc();
    if (!doc?.sections) return;
    const sections = [...doc.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
}

export async function addSectionItem(sectionIndex: number, item: Record<string, unknown>) {
    const doc = await getHomepageDoc();
    if (!doc?.sections?.[sectionIndex]) return;
    const sections = [...doc.sections];
    const section = { ...sections[sectionIndex] as Record<string, unknown> };
    const items = [...(section.items as Record<string, unknown>[] || []), item];
    section.items = items;
    sections[sectionIndex] = section;
    await adminClient.patch(doc._id).set({ sections }).commit();
    revalidatePath("/admin/homepage");
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
}
