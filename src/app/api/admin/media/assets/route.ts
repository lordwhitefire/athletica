import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-sanity";

export async function GET() {
    const assets = await adminClient.fetch(
        `*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }`
    );
    return NextResponse.json(assets);
}
