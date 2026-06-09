"use server";

import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";

export async function uploadImage(formData: FormData): Promise<ApiResult<{ _id: string; url: string; originalFilename: string }>> {
    try {
        const file = formData.get("file") as File;
        if (!file) return fail("validation_error", "no_file", "No file provided.");

        const buffer = Buffer.from(await file.arrayBuffer());
        const asset = await adminClient.assets.upload("image", buffer, {
            filename: file.name,
            contentType: file.type,
        });
        return ok({ _id: asset._id, url: asset.url, originalFilename: asset.originalFilename ?? "" });
    } catch (err) {
        return fromCaughtError(err, "image_upload_failed");
    }
}

export async function getMediaAssets(): Promise<ApiResult<unknown[]>> {
    try {
        const assets = await adminClient.fetch(`*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename, metadata { dimensions } }`);
        return ok(assets as unknown[]);
    } catch (err) {
        return fromCaughtError(err, "media_assets_fetch_failed");
    }
}

export async function deleteAsset(id: string): Promise<ApiResult<{ deleted: true }>> {
    try {
        await adminClient.delete(id);
        return ok({ deleted: true });
    } catch (err) {
        return fromCaughtError(err, "asset_delete_failed");
    }
}
