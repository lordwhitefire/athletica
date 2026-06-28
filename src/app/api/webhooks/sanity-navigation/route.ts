import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { adminClient } from "@/lib/admin-sanity";

function verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const secret = process.env.SANITY_WEBHOOK_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const signature = request.headers.get("Sanity-Webhook-Signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing Sanity-Webhook-Signature header" }, { status: 401 });
    }

    const rawBody = await request.text();

    if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: { _type?: string };
    try {
        body = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body._type !== "navigation") {
        return NextResponse.json({ error: "Unhandled document type" }, { status: 200 });
    }

    try {
        const doc = await adminClient.fetch(`*[_type == "navigation"][0]{_id, items}`);
        if (!doc || !doc.items) {
            return NextResponse.json({ error: "Navigation document not found" }, { status: 404 });
        }

        const { hasCorrectUrls, rebuildNavUrls } = await import("@/lib/rebuild-nav-urls");
        if (hasCorrectUrls(doc.items)) {
            return NextResponse.json({ rebuilt: false, reason: "already up to date" });
        }

        const rebuilt = rebuildNavUrls(doc.items);
        await adminClient.patch(doc._id).set({ items: rebuilt }).commit();

        return NextResponse.json({ rebuilt: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
