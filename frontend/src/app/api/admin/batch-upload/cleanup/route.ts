import { NextRequest, NextResponse } from "next/server";
import { cleanupOrphanedImages } from "@/lib/sanity-image-utils";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/batch-upload/cleanup
 *
 * Cleanup endpoint for removing orphaned Sanity images that are no longer
 * referenced by any product document. This is typically called after a
 * batch upload or product deletion to keep storage tidy.
 *
 * per investigation: cleanup endpoint for orphaned images
 * per upload/route.ts pattern: consistent error response format
 */

export async function POST(_req: NextRequest) {
    try {
        // per investigation: cleanupOrphanedImages scans Sanity for unreferenced image assets
        const { deleted, errors } = await cleanupOrphanedImages();

        return NextResponse.json(
            { data: { deleted, errors }, error: null },
            { status: 200 }
        );
    } catch (error) {
        // per upload/route.ts pattern: logger.error for error logging before returning response
        logger.error(error, "Orphaned image cleanup failed");

        return NextResponse.json(
            {
                data: null,
                error: {
                    type: "api_error",
                    code: "cleanup_failed",
                    message: "Failed to clean up orphaned images. Please try again.",
                },
            },
            { status: 500 }
        );
    }
}
