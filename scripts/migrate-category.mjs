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
    const products = await client.fetch(`*[_type == "product" && category == "Football Boots"]{_id, id, model, category}`);
    console.log(`Found ${products.length} product(s) with category "Football Boots"`);

    for (const p of products) {
        console.log(`${p.id || p._id}  "${p.model}"  "${p.category}" → "Boots"`);
        if (!DRY) {
            await client.patch(p._id).set({ category: "Boots" }).commit();
        }
    }

    console.log(DRY ? `Dry run complete. ${products.length} product(s) would be updated.` : `Updated ${products.length} product(s).`);
}

migrate().catch(console.error);
