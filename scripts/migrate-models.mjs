import { createClient } from "@sanity/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env.local", "utf-8");
const envVars = Object.fromEntries(
    envRaw.split("\n").filter(Boolean).map((l) => l.split("=", 2).map((s) => s.trim()))
);

const LEVEL3 = ["Predator", "X", "F50", "COPA", "Mercurial", "Phantom", "Tiempo", "Premier", "Future", "Ultra", "King", "442", "Furon", "Tekela"];

const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    token: envVars.SANITY_WRITE_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
});

async function migrate() {
    const products = await client.fetch(`*[_type == "product"]{_id, id, model, brand}`);
    console.log(`Found ${products.length} products`);

    for (const p of products) {
        const old = p.model;
        if (!old || old.includes(",")) continue;

        const parts = old.trim().split(/\s+/);
        let startIdx = 0;
        if (["adidas", "nike", "puma"].includes(parts[0]?.toLowerCase())) startIdx = 1;

        let classEnd = -1;
        for (let i = startIdx; i < parts.length; i++) {
            if (LEVEL3.includes(parts[i])) classEnd = i;
            else break;
        }

        let newModel;
        if (classEnd === -1) {
            newModel = old.replace(/\s+/g, "-");
        } else {
            const classParts = parts.slice(startIdx, classEnd + 1);
            const typeParts = parts.slice(classEnd + 1);
            newModel = classParts.join(",") + (typeParts.length > 0 ? "," + typeParts.join("-") : "");
        }

        console.log(`${old}  →  ${newModel}`);
        await client.patch(p._id).set({ model: newModel }).commit();
    }

    console.log("Done");
}

migrate().catch(console.error);
