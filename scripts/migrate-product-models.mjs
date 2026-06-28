#!/usr/bin/env node
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
    const reference = JSON.parse(readFileSync("src/data/products.json", "utf-8"));
    const refById = new Map(reference.map((p) => [p.id, p]));
    console.log(`Loaded ${reference.length} reference products from src/data/products.json`);

    const products = await client.fetch(`*[_type == "product"]{_id, id, model, name, model_line}`);
    console.log(`Found ${products.length} products in Sanity\n`);

    let updateCount = 0;
    let skipCount = 0;

    for (const p of products) {
        const ref = refById.get(p.id);
        if (!ref) {
            console.log(`  SKIP  ${p.id || p._id}  — no reference entry found`);
            skipCount++;
            continue;
        }

        const patches = [];
        const unsets = [];

        if (p.model !== ref.model) {
            patches.push({ field: "model", from: p.model, to: ref.model });
        }
        if (p.name !== ref.name) {
            patches.push({ field: "name", from: p.name, to: ref.name });
        }
        if (p.model_line !== undefined) {
            unsets.push("model_line");
        }

        if (patches.length === 0 && unsets.length === 0) {
            console.log(`  OK    ${p.id}  "${p.model}" — no changes needed`);
            continue;
        }

        console.log(`  EDIT  ${p.id}`);
        for (const { field, from, to } of patches) {
            console.log(`        ${field}: "${from}" → "${to}"`);
        }
        for (const field of unsets) {
            console.log(`        ${field}: "${p[field]}" → (removed)`);
        }

        updateCount++;

        if (!DRY) {
            const patchOps = {};
            if (patches.length > 0) {
                const setFields = {};
                for (const { field, to } of patches) {
                    setFields[field] = to;
                }
                patchOps.set = setFields;
            }
            if (unsets.length > 0) {
                patchOps.unset = unsets;
            }
            const tx = client.transaction();
            tx.patch(p._id, patchOps);
            await tx.commit();
        }
    }

    console.log(`\nDone. ${updateCount} product(s) need updates, ${skipCount} skipped.`);
    if (DRY) {
        console.log(`Run without --dry to apply.`);
    }
}

migrate().catch(console.error);