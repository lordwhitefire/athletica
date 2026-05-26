"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

export async function getNavigationDoc() {
    return adminClient.fetch(`*[_type == "navigation"][0]`);
}

export async function saveNavigation(items: Record<string, unknown>[]) {
    const doc = await getNavigationDoc();
    if (!doc) {
        await adminClient.create({ _type: "navigation", _id: "navigation", title: "Main Navigation", items });
    } else {
        await adminClient.patch(doc._id).set({ items }).commit();
    }
    revalidatePath("/admin/navigation");
}
