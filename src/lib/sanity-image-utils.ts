/**
 * Sanity image utilities — orphan detection and cleanup.
 *
 * Per investigation: ~30 orphaned images were found from failed uploads
 * and product deletions that didn't clean up their assets. This module
 * provides tooling to find and remove them.
 *
 * NOT a server action — pure library file.
 */

import { adminClient } from "@/lib/admin-sanity";
import { logger } from "@/lib/logger";

// ── Types ────────────────────────────────────────────────────────────

/** An image asset flagged as orphaned (not referenced by any product). */
interface OrphanedAsset {
    assetId: string;
    filename: string | null;
}

/** Result of a cleanup sweep. */
interface CleanupResult {
    deleted: number;
    errors: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Shape of an image field on a product document when projected via GROQ.
 * Each image field is `{ _type: "image", asset: { _type: "reference", _ref: "..." } }`.
 *
 * Per investigation: product image fields (main_image, thumbnail, image_gallery)
 * all follow this shape — confirmed by inspecting Sanity data and the product
 * schema in src/lib/schemas/product.ts.
 */
interface SanityImageField {
    _type: string;
    asset?: {
        _type: string;
        _ref: string;
    };
}

/**
 * Shape of a product document projected to only its image fields.
 * Only the three known image-bearing fields are selected.
 *
 * Per investigation: products have exactly three image fields —
 * main_image, thumbnail, and image_gallery. No other image fields
 * exist on the product document type.
 */
interface ProductImageDoc {
    main_image?: SanityImageField | string | null;
    thumbnail?: SanityImageField | string | null;
    image_gallery?: (SanityImageField | string)[] | null;
}

/**
 * Shape of an image asset document fetched from Sanity.
 *
 * Per investigation: sanity.imageAsset documents always have _id;
 * originalFilename may be null for assets uploaded programmatically.
 */
interface ImageAssetDoc {
    _id: string;
    originalFilename: string | null;
}

// ── Asset ref extraction ─────────────────────────────────────────────

/**
 * Extract a Sanity asset _ref string from an image field value.
 *
 * An image field can be:
 *   - An object `{ asset: { _ref: "..." } }`
 *   - A bare reference string (legacy)
 *   - null / undefined
 */
function extractRef(
    field: SanityImageField | string | null | undefined,
): string | null {
    if (!field) return null;
    if (typeof field === "string") return field;
    return field.asset?._ref ?? null;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Find all image assets that are not referenced by any product.
 *
 * Strategy:
 *   1. Fetch every `sanity.imageAsset` document (_id + originalFilename)
 *   2. Fetch every `product` document projected to its three image fields
 *   3. Extract all referenced _ref values from products
 *   4. Return assets whose _id is not in the referenced set
 *
 * Per investigation: orphaned images accumulate from failed uploads
 * (upload succeeds but product save fails) and from product deletions
 * that don't cascade-delete the asset.
 */
export async function findOrphanedImages(): Promise<OrphanedAsset[]> {
    // Step 1 — fetch all image assets
    // Per investigation: GROQ query for sanity.imageAsset collection
    const allAssets = await adminClient.fetch<ImageAssetDoc[]>(
        `*[_type == "sanity.imageAsset"] { _id, originalFilename }`,
    );

    // Step 2 — fetch all products and collect referenced asset IDs
    // Per investigation: product image fields are main_image, thumbnail, image_gallery.
    // Each contains a { asset: { _ref: "..." } } structure.
    // GROQ query projects only the three image fields to minimise payload.
    const products = await adminClient.fetch<ProductImageDoc[]>(
        `*[_type == "product"] { main_image, thumbnail, image_gallery }`,
    );

    // Step 3 — build the set of referenced asset IDs
    const referencedIds = new Set<string>();

    for (const product of products) {
        const mainRef = extractRef(product.main_image);
        if (mainRef) referencedIds.add(mainRef);

        const thumbRef = extractRef(product.thumbnail);
        if (thumbRef) referencedIds.add(thumbRef);

        if (product.image_gallery) {
            for (const img of product.image_gallery) {
                const ref = extractRef(img);
                if (ref) referencedIds.add(ref);
            }
        }
    }

    // Step 4 — cross-reference: assets not in the referenced set are orphaned
    const orphaned = allAssets
        .filter((asset) => !referencedIds.has(asset._id))
        .map((asset) => ({
            assetId: asset._id,
            filename: asset.originalFilename,
        }));

    return orphaned;
}

/**
 * Delete all orphaned image assets from Sanity.
 *
 * Calls findOrphanedImages() first, then deletes each orphan one-by-one
 * using adminClient.delete() — the same pattern as media.ts deleteAsset().
 *
 * Per investigation: bulk cleanup is safe because orphaned images are by
 * definition unreferenced by any product document.
 *
 * Per media.ts line 34: `await adminClient.delete(id)` for asset removal.
 */
export async function cleanupOrphanedImages(): Promise<CleanupResult> {
    const orphaned = await findOrphanedImages();

    let deleted = 0;
    const errors: string[] = [];

    for (const asset of orphaned) {
        try {
            await adminClient.delete(asset.assetId);
            deleted++;
        } catch (err) {
            // Per investigation: individual delete failures should not
            // abort the entire sweep — log and continue.
            // Per logger.ts: logger.error(error, message, context)
            logger.error(err, "Failed to delete orphaned asset", {
                assetId: asset.assetId,
                filename: asset.filename,
            });
            errors.push(
                `${asset.assetId} (${asset.filename ?? "unknown"}): ${err instanceof Error ? err.message : "unknown error"}`,
            );
        }
    }

    return { deleted, errors };
}
