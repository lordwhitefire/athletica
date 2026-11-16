#!/usr/bin/env node

import { createClient } from "@sanity/client";

function slugify(text) {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function generateId() {
    return Math.random().toString(36).substring(2, 8);
}

function rebuildNavUrls(items, parentSegments = []) {
    return items.map((item) => {
        const slug = slugify(item.label || "");
        const segments = [...parentSegments, slug];
        const href = `/en/${segments.join("/")}`;

        return {
            ...item,
            id: item.id || generateId(),
            href,
            children: item.children ? rebuildNavUrls(item.children, segments) : item.children,
        };
    });
}

const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
});

async function main() {
    if (!process.env.SANITY_WRITE_TOKEN) {
        console.error("ERROR: SANITY_WRITE_TOKEN environment variable is required.");
        process.exit(1);
    }

    console.log("Fetching navigation document from Sanity...");
    const doc = await client.fetch(`*[_type == "navigation"][0]{_id, title, items}`);

    if (!doc) {
        console.error("ERROR: No navigation document found in Sanity.");
        process.exit(1);
    }

    console.log(`Found navigation: "${doc.title}" (ID: ${doc._id})`);
    console.log(`Processing ${doc.items?.length ?? 0} top-level items...`);

    const original = JSON.stringify(doc.items ?? []);
    const rebuilt = rebuildNavUrls(doc.items ?? []);
    const updated = JSON.stringify(rebuilt);

    if (original === updated) {
        console.log("All URLs are already correct. No changes needed.");
        process.exit(0);
    }

    await client.patch(doc._id).set({ items: rebuilt }).commit();

    const count = countItems(rebuilt);
    console.log(`Updated ${count} nav item URLs and saved to Sanity.`);
    console.log("Done.");
}

function countItems(items) {
    let count = 0;
    for (const item of items) {
        count++;
        if (item.children) count += countItems(item.children);
    }
    return count;
}

main().catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
});
