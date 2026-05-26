"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

export async function getAmazonLinksDoc() {
    return adminClient.fetch(`*[_type == "amazonLinks"][0]`);
}

export async function saveAmazonLinks(links: { productId: string; url: string }[]) {
    const doc = await getAmazonLinksDoc();
    const linksArray = links
        .filter((l) => l.url?.trim())
        .map((l, i) => ({ _key: `link-${i}`, productId: l.productId, url: l.url }));
    if (!doc) {
        await adminClient.create({ _type: "amazonLinks", _id: "amazonLinks", links: linksArray });
    } else {
        await adminClient.patch(doc._id).set({ links: linksArray }).commit();
    }
    revalidatePath("/admin/amazon-links");
}
