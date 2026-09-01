import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-sanity";
import { isValidOrigin } from "@/lib/csrf";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    if (!isValidOrigin(req)) {
        return NextResponse.json(
            { data: null, error: { type: "security_error", code: "invalid_origin", message: "Request origin not allowed." } },
            { status: 403 }
        );
    }

    try {
        const assets = await adminClient.fetch(
            `*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }`
        );
        return NextResponse.json(
            { data: assets, error: null },
            { status: 200 }
        );
    } catch (error) {
        logger.error(error, "Media assets fetch failed");
        return NextResponse.json(
            { data: null, error: { type: "api_error", code: "assets_fetch_failed", message: "Failed to fetch media assets." } },
            { status: 500 }
        );
    }
}
