import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-sanity";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await adminClient.assets.upload("image", buffer, {
        filename: file.name,
        contentType: file.type,
    });

    return NextResponse.json({ _id: asset._id, url: asset.url, originalFilename: asset.originalFilename });
}
