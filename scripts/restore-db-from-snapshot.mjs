#!/usr/bin/env node
/**
 * ARCH-REC-007 Round 2 / WP-R2-C — Restore a database snapshot from Sanity.
 *
 * RESTORE PROCEDURE (the backup system's deliverable — verified end-to-end
 * against a scratch target before sign-off):
 *
 *   1. List available snapshots (read-only, no writes):
 *        cd frontend && node scripts/restore-db-from-snapshot.mjs --list
 *
 *   2. Prepare a TARGET database connection string. For drills use a scratch
 *      target, e.g. another Supabase project's session-pooler URL:
 *        SCRATCH_DB_URL=postgresql://postgres.<ref>:<pw>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
 *
 *   3. Dry-run the restore (downloads + plans, writes NOTHING):
 *        node scripts/restore-db-from-snapshot.mjs --target "$SCRATCH_DB_URL"
 *
 *   4. Execute for real:
 *        node scripts/restore-db-from-snapshot.mjs --target "$SCRATCH_DB_URL" --execute
 *
 *   5. Verify: row counts / spot checks on the scratch DB must match the
 *      live tables' shape. Only then consider the backup trustworthy.
 *
 * Options:
 *   --list                       show snapshots and exit (no target needed)
 *   --target <postgres-url>      destination connection string (required to restore)
 *   --snapshot <name-substring>  pick a specific snapshot (default: newest)
 *   --clean                      pg_restore --clean --if-exists (drop objects first;
 *                                for overwriting an EXISTING schema, not a fresh DB)
 *   --prepare                    create non-Supabase-target preconditions first
 *                                (extensions schema + uuid_generate_v4 stub)
 *   --execute                    actually run pg_restore (absent = dry run)
 *
 * Restoring into a NON-Supabase target (e.g. local Postgres) — verified
 * drill recipe (2026-08-23, local PG16 ← Supabase PG17.6 dump):
 *   sudo -u postgres psql -c "CREATE ROLE scratch_login LOGIN PASSWORD '<pw>';"
 *   sudo -u postgres createdb -O scratch_login scratch_restore
 *   node scripts/restore-db-from-snapshot.mjs --target "$SCRATCH_URL" --prepare --execute
 *   Expected noise on a non-Supabase target (harmless, ignore):
 *     - SET transaction_timeout (PG17 GUC, unknown to older servers)
 *     - schema "public" already exists
 *     - role "anon"/"service_role" does not exist  (RLS policy owners)
 *     - schema "auth" does not exist               (auth.uid() refs in policies)
 *   These only affect policies/grants, NOT tables or data.
 *
 * Safety rails:
 *   - Never writes unless --execute is passed.
 *   - Refuses when --target equals the live SUPABASE_DB_URL unless
 *     --i-know-this-overwrites-production is ALSO passed.
 *   - Snapshots contain only the public schema (auth/storage never dumped).
 */
import { spawn } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@sanity/client";

function arg(name) {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 ? process.argv[i + 1] : undefined;
}
const flag = (name) => process.argv.includes(`--${name}`);

const envVars = Object.fromEntries(
    (() => {
        try {
            return readFileSync(".env.local", "utf-8")
                .split("\n")
                .filter((l) => l.trim() && !l.trim().startsWith("#"))
                .map((l) => l.split("=", 2).map((s) => s.trim()));
        } catch {
            return [];
        }
    })()
);

const PREFIX = "athletica-db-";
const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    token: envVars.SANITY_WRITE_TOKEN ?? envVars.SANITY_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
});

async function listSnapshots() {
    return client.fetch(
        `*[_type == "sanity.fileAsset" && defined(originalFilename) && originalFilename match $pattern] | order(_createdAt desc) {_id, _createdAt, originalFilename, sizeBytes, url}`,
        { pattern: `${PREFIX}*` }
    );
}

async function probeVersion(bin) {
    return new Promise((resolve) => {
        const child = spawn(bin, ["--version"], { stdio: ["ignore", "pipe", "ignore"] });
        let out = "";
        child.stdout?.on("data", (d) => (out += d.toString()));
        child.on("error", () => resolve(null));
        child.on("close", () => {
            const m = out.match(/PostgreSQL\)\s+(\d+)\.(\d+)/);
            resolve(m ? { major: Number(m[1]), minor: Number(m[2]) } : null);
        });
    });
}

async function resolveBin(name) {
    const candidates = [process.env.PG_DUMP_BIN, name].filter(Boolean);
    try {
        const roots = await fs.readdir("/usr/lib/postgresql");
        for (const r of roots.sort().reverse()) candidates.push(`/usr/lib/postgresql/${r}/bin/${name}`);
    } catch {
        /* non-Debian layout */
    }
    const probed = await Promise.all(candidates.map(async (bin) => ({ bin, v: await probeVersion(bin) })));
    const usable = probed.filter((p) => p.v !== null);
    if (usable.length === 0) throw new Error(`no working ${name} found (set PG_DUMP_BIN)`);
    usable.sort((a, b) => b.v.major - a.v.major || b.v.minor - a.v.minor);
    return usable[0].bin;
}

function parseConnection(conn) {
    const u = new URL(conn);
    const env = {};
    if (u.username) env.PGUSER = decodeURIComponent(u.username);
    if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
    if (u.hostname) env.PGHOST = u.hostname;
    if (u.port) env.PGPORT = u.port;
    const db = u.pathname.replace(/^\//, "");
    if (db) env.PGDATABASE = db;
    return env;
}

async function main() {
    if (!envVars.SANITY_WRITE_TOKEN && !envVars.SANITY_TOKEN) {
        console.error("SANITY_WRITE_TOKEN missing from .env.local — cannot query Sanity.");
        process.exit(1);
    }

    const snaps = await listSnapshots();
    if (!snaps.length) {
        console.error("No athletica-db-* snapshots found in Sanity.");
        process.exit(1);
    }
    console.log(`snapshots in Sanity (${snaps.length}):`);
    for (const s of snaps) {
        console.log(`  ${s._createdAt}  ${(Number(s.sizeBytes) / 1048576).toFixed(1)} MB  ${s.originalFilename}`);
    }

    if (flag("list")) return;

    const target = arg("target");
    if (!target) {
        console.error("\n--target <postgres-url> required to restore (see header of this file).");
        process.exit(1);
    }
    const liveUrl = envVars.SUPABASE_DB_URL ?? "";
    if (target === liveUrl && !flag("i-know-this-overwrites-production")) {
        console.error(
            "\nREFUSING: --target equals the live SUPABASE_DB_URL.\n" +
                "Restoring over production drops/replaces current data. If you truly mean it,\n" +
                "re-run with an extra --i-know-this-overwrites-production flag."
        );
        process.exit(1);
    }

    const pick = arg("snapshot");
    const chosen = pick ? snaps.find((s) => (s.originalFilename ?? "").includes(pick)) : snaps[0];
    if (!chosen) {
        console.error(`no snapshot matches "${pick}"`);
        process.exit(1);
    }

    const bin = await resolveBin("pg_restore");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "athletica-restore-"));
    const file = path.join(dir, chosen.originalFilename ?? "snapshot.dump");
    console.log(`\nfetching ${chosen.originalFilename} …`);
    const res = await fetch(chosen.url);
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    const stat = await fs.stat(file);
    console.log(`downloaded ${(stat.size / 1048576).toFixed(1)} MB → ${file}`);

    const targetEnv = parseConnection(target);

    const args = ["--no-owner", "--no-privileges", "--verbose"];
    if (flag("clean")) args.push("--clean", "--if-exists");
    args.push("-d", targetEnv.PGDATABASE, file);
    const maskedDb = `${targetEnv.PGUSER}@${targetEnv.PGHOST}:${targetEnv.PGPORT}/${targetEnv.PGDATABASE}`;
    console.log(`\npg_restore target: ${maskedDb}${flag("execute") ? "" : "  (DRY RUN — nothing written)"}`);
    if (!flag("execute")) {
        console.log("Re-run with --execute to perform the restore.");
        return;
    }

    if (flag("prepare")) {
        const psqlBin = path.join(path.dirname(bin), "psql");
        const prepareSql = [
            "CREATE SCHEMA IF NOT EXISTS extensions;",
            `CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4() RETURNS uuid
             AS $$ SELECT gen_random_uuid() $$ LANGUAGE sql;`,
        ].join("\n");
        console.log("\n--prepare: creating extensions schema + uuid stub on target …");
        const prep = await new Promise((resolve, reject) => {
            const child = spawn(psqlBin, ["-v", "ON_ERROR_STOP=1", "-c", prepareSql], {
                env: { ...process.env, ...targetEnv },
                stdio: ["ignore", "ignore", "inherit"],
            });
            child.on("error", reject);
            child.on("close", (c) => resolve(c ?? -1));
        });
        if (prep !== 0) {
            console.error(`--prepare failed (psql exited ${prep})`);
            process.exit(prep);
        }
        console.log("--prepare: done");
    }

    let restoreErr = "";
    const code = await new Promise((resolve, reject) => {
        const child = spawn(bin, args, {
            env: { ...process.env, ...targetEnv },
            stdio: ["ignore", "inherit", "pipe"],
        });
        child.stderr.on("data", (d) => {
            restoreErr += d.toString();
            process.stderr.write(d);
        });
        child.on("error", reject);
        child.on("close", (c) => resolve(c ?? -1));
    });
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    if (code !== 0) {
        // On non-Supabase targets these environment differences are expected
        // and never affect tables/data — treat a noise-only run as success.
        const noisePatterns = [
            /transaction_timeout/,
            /schema "public" already exists/,
            /role "(anon|service_role|authenticated)" does not exist/,
            /schema "auth" does not exist/,
        ];
        const errorLines = restoreErr
            .split("\n")
            .filter((l) => l.includes("pg_restore: error"));
        const fatal = errorLines.filter((l) => !noisePatterns.some((rx) => rx.test(l)));
        if (fatal.length === 0 && errorLines.length > 0) {
            console.log(
                "\nRESTORE OK — non-Supabase target: only known environment noise (see header of this file)"
            );
            return;
        }
        console.error(`pg_restore exited ${code}`);
        process.exit(code);
    }
    console.log("RESTORE OK");
}

main().catch((err) => {
    console.error("FAILED:", err.message ?? err);
    process.exit(1);
});
