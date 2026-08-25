#!/usr/bin/env node
/**
 * ARCH-REC-007 / WP-R2-A — Homepage content recovery.
 *
 * Restores `homepage_sections` from frontend/data/homepage.json (complete
 * snapshot of the content that was wiped — see task.md F7).
 *
 * Idempotent: rows are matched by attributes->>original_id, existing UUIDs are
 * reused and upserted (no duplication on re-run). Touches NOTHING except
 * homepage_sections.
 *
 * Row mapping mirrors lib/actions/homepage.ts (saveHomepage /
 * heroInsertFromBanner / sectionToRowValues) and content-service.ts readers:
 *   banner            -> type:"hero",      attributes.{button_text,link,gradient,accent_color,original_id}
 *   category_grid     -> type:"grid",      attributes.{...,items,original_type,original_id}
 *   product_carousel  -> type:"carousel",  attributes.{...,filter,...}, "limit" set
 *   category_carousel -> type:"carousel",  attributes.{...,cards,autoSwitchMs}
 *
 * Usage:
 *   node scripts/migrate-homepage-recovery.mjs          # live run
 *   node scripts/migrate-homepage-recovery.mjs --dry    # preview only
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

const DRY = process.argv.includes("--dry");

const envVars = Object.fromEntries(
    readFileSync(".env.local", "utf-8")
        .split("\n")
        .filter(Boolean)
        .map((l) => l.split("=", 2).map((s) => s.trim()))
);

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const doc = JSON.parse(readFileSync("data/homepage.json", "utf-8"));
const bannersIn = doc.hero_carousel?.banners ?? [];
const sectionsIn = doc.sections ?? [];
console.log(`source: ${bannersIn.length} banner(s), ${sectionsIn.length} section(s)`);

function storedImageUrl(value) {
    // Mirrors toStoredImageUrl(): plain URLs pass through, Sanity asset refs
    // would need CDN conversion — none exist in this snapshot (all plain URLs).
    if (typeof value === "string" && value.trim()) return value;
    return null;
}

async function fetchRows() {
    const { data, error } = await supabase
        .from("homepage_sections")
        .select("id, type, title, order, attributes");
    if (error) throw error;
    return data ?? [];
}

async function run() {
    const before = await fetchRows();
    console.log(`rows-before: ${before.length}`);

    // original_id -> existing row id (idempotency map)
    const idByOriginalId = new Map();
    for (const row of before) {
        const oid = row.attributes?.original_id;
        if (typeof oid === "string" && oid) idByOriginalId.set(oid, row.id);
        if (row.type === "hero") {
            // legacy fallback: hero rows may carry original_id only
            continue;
        }
    }

    function resolveId(key) {
        if (key && idByOriginalId.has(key)) return idByOriginalId.get(key);
        return randomUUID();
    }

    const inserts = [];

    bannersIn.forEach((b, i) => {
        inserts.push({
            id: resolveId(b._key),
            type: "hero",
            order: i,
            title: b.title || "",
            copy: b.subtitle || "",
            category_id: null,
            limit: null,
            image_links: [storedImageUrl(b.image)].filter(Boolean),
            attributes: {
                button_text: b.button_text || "",
                link: b.link || "/",
                gradient: b.gradient || "",
                accent_color: b.accent_color || "",
                original_id: b._key,
            },
        });
    });

    sectionsIn.forEach((s, j) => {
        const originalType = String(s._type ?? s.type ?? "product_carousel");
        const type = originalType === "category_grid" ? "grid" : "carousel";

        const items = Array.isArray(s.items)
            ? s.items.map((it) => ({ ...it, image: storedImageUrl(it?.image) }))
            : undefined;
        const cards = Array.isArray(s.cards)
            ? s.cards.map((c) => ({ ...c, image: storedImageUrl(c?.image) }))
            : undefined;

        const attributes = {};
        for (const k of ["variant", "bg", "filter", "link", "link_label", "sort", "autoSwitchMs"]) {
            if (s[k] !== undefined) attributes[k] = s[k];
        }
        attributes.original_type = originalType;
        attributes.original_id = s._key;
        if (items) attributes.items = items;
        if (cards) attributes.cards = cards;

        const imageLinks = [...(items ?? []), ...(cards ?? [])]
            .map((e) => (typeof e?.image === "string" && e.image ? e.image : null))
            .filter(Boolean);

        inserts.push({
            id: resolveId(s._key),
            type,
            order: bannersIn.length + j,
            title: String(s.title ?? ""),
            copy: String(s.subtitle ?? ""),
            category_id: null,
            limit: originalType === "product_carousel"
                ? (typeof s.limit === "number" ? s.limit : 10)
                : null,
            image_links: imageLinks,
            attributes,
        });
    });

    console.log(`prepared ${inserts.length} row(s):`);
    for (const r of inserts) {
        console.log(`  [${r.order}] ${r.type.padEnd(8)} "${r.title}"${DRY ? "" : " id=" + r.id.slice(0, 8)}`);
    }

    if (DRY) {
        console.log("\nDRY RUN — nothing written.");
        return;
    }

    const { error } = await supabase
        .from("homepage_sections")
        .upsert(inserts, { onConflict: "id" });
    if (error) throw error;

    const after = await fetchRows();
    console.log(`\nrows-after: ${after.length} (expected ${inserts.length})`);
    if (after.length !== inserts.length) {
        console.error("MISMATCH — investigate before proceeding.");
        process.exit(1);
    }
    console.log("RECOVERY OK");
}

run().catch((err) => {
    console.error("FAILED:", err.message ?? err);
    process.exit(1);
});
