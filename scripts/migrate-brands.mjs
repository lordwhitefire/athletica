#!/usr/bin/env node
/**
 * Migrate product `brand` fields from plain strings to Sanity references.
 *
 * Usage:
 *   node scripts/migrate-brands.mjs          # live run
 *   node scripts/migrate-brands.mjs --dry     # preview only
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";

const DRY = process.argv.includes("--dry");

const envRaw = readFileSync(".env.local", "utf-8");
const envVars = Object.fromEntries(
    envRaw.split("\n").filter(Boolean).map((l) => l.split("=", 2).map((s) => s.trim()))
);

const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    token: envVars.SANITY_WRITE_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
});

async function migrate() {
    // 1. Fetch all brand docs
    const brandDocs = await client.fetch(`*[_type == "brand"]{_id, name}`);
    const brandByName = Object.fromEntries(
        brandDocs.map((b) => [b.name.toLowerCase(), { _ref: b._id, _type: "reference" }])
    );
    console.log(`Found ${brandDocs.length} brand document(s):`);
    for (const b of brandDocs) console.log(`  ${b._id}  →  "${b.name}"`);

    // 2. Fetch all products, filter to those with string brand values
    const allProducts = await client.fetch(`*[_type == "product"]{_id, id, model, brand}`);
    const products = allProducts.filter((p) => typeof p.brand === "string");
    console.log(`\nFound ${products.length} product(s) with string-brand values (out of ${allProducts.length} total).`);

    let updated = 0;
    let skipped = 0;

    for (const p of products) {
        const brandStr = p.brand;
        const ref = brandByName[brandStr.toLowerCase()];
        const label = p.id || p._id;

        if (!ref) {
            console.log(`  SKIP  ${label}  "${p.model}"  brand="${brandStr}"  (no matching brand doc)`);
            skipped++;
            continue;
        }

        console.log(`  PATCH ${label}  "${p.model}"  "${brandStr}" → ${ref._ref}`);
        if (!DRY) {
            await client.patch(p._id).set({ brand: ref }).commit();
            updated++;
        }
    }

    const summary = DRY
        ? `Dry run complete. ${products.length} product(s) would be patched (${skipped} skipped).`
        : `Updated ${updated} product(s). ${skipped} skipped due to missing brand docs.`;
    console.log(`\n${summary}`);
}

migrate().catch(console.error);
