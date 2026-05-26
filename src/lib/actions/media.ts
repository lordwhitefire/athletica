"use server";

import { adminClient } from "@/lib/admin-sanity";

export async function uploadImage(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await adminClient.assets.upload("image", buffer, {
        filename: file.name,
        contentType: file.type,
    });
    return asset;
}

export async function getMediaAssets() {
    return adminClient.fetch(`*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename, metadata { dimensions } }`);
}

export async function deleteAsset(id: string) {
    await adminClient.delete(id);
}
