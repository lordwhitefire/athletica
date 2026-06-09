import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-sanity";
import { uploadLimiter } from "@/lib/rate-limit";
import { isValidOrigin } from "@/lib/csrf";
import { logger } from "@/lib/logger";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    if (!isValidOrigin(req)) {
        return NextResponse.json(
            { data: null, error: { type: "security_error", code: "invalid_origin", message: "Request origin not allowed." } },
            { status: 403 }
        );
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const { success, remaining } = await uploadLimiter.limit(ip);
    if (!success) {
        return NextResponse.json(
            {
                data: null,
                error: {
                    type: "rate_limit_error",
                    code: "too_many_requests",
                    message: `Too many uploads. Try again in ${Math.ceil(remaining / 1000)} seconds.`,
                },
            },
            { status: 429, headers: { "Retry-After": String(Math.ceil(remaining / 1000)) } }
        );
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json(
                { data: null, error: { type: "validation_error", code: "no_file", message: "No file provided." } },
                { status: 400 }
            );
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    data: null,
                    error: {
                        type: "validation_error",
                        code: "invalid_file_type",
                        message: "Only JPEG, PNG, WebP, and AVIF images are allowed.",
                    },
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    data: null,
                    error: {
                        type: "validation_error",
                        code: "file_too_large",
                        message: "File must be under 5MB.",
                    },
                },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const asset = await adminClient.assets.upload("image", buffer, {
            filename: file.name,
            contentType: file.type,
        });

        return NextResponse.json(
            { data: { _id: asset._id, url: asset.url, originalFilename: asset.originalFilename }, error: null },
            { status: 200 }
        );
    } catch (error) {
        logger.error(error, "Media upload failed");
        return NextResponse.json(
            { data: null, error: { type: "api_error", code: "upload_failed", message: "Upload failed. Please try again." } },
            { status: 500 }
        );
    }
}
