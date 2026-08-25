/*
 * ARCH-REC-007 Round 2 / WP-R2-C — Automatic rolling database snapshots.
 *
 * Owner-specified design (openspec/tasks/ARCH-REC-007/task.md):
 *   - Trigger: on every authenticated admin-panel load, check the newest
 *     `athletica-db-*.dump` file asset in Sanity. Younger than the interval
 *     (default 3 days) → do nothing. Older → take exactly ONE new snapshot.
 *   - Snapshot: pg_dump of the `public` schema ONLY (auth/storage schemas are
 *     never dumped), custom format, uploaded to Sanity as a plain file asset
 *     with the UTC timestamp in the filename and asset metadata.
 *   - Retention: capped at 7 assets; pushing past the cap deletes the oldest.
 *   - Non-blocking: invoked from app/admin/layout.tsx via after(), so the
 *     response is already sent when any work happens. Every failure is
 *     logged with a [db-snapshot] prefix on the server console and NEVER
 *     breaks or slows the admin experience.
 *   - Single-flight: a module-level promise lock guarantees that several
 *     admins loading simultaneously trigger at most one snapshot.
 *
 * Server-only: reads SUPABASE_DB_URL and SANITY_WRITE_TOKEN from env.
 */
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServerClient } from "@supabase/ssr";
import { adminClient } from "@/lib/admin-sanity";
import { getEnv } from "@/lib/env";

/*
 * Next.js forbids request APIs like cookies() INSIDE an after() callback.
 * The caller therefore reads the cookie store during render and hands it in;
 * this minimal structural type keeps that handoff dependency-free.
 */
type CookieReader = {
    getAll(): { name: string; value: string }[];
};

type SnapshotAsset = {
    _id: string;
    _createdAt: string;
    originalFilename: string | null;
};

export type SnapshotHeartbeatResult = {
    triggered: boolean;
    detail: string;
};

const SNAPSHOT_FILENAME_PREFIX = "athletica-db-";

function intervalMs(): number {
    const days = Number(process.env.DB_SNAPSHOT_INTERVAL_DAYS ?? 3);
    const d = Number.isFinite(days) && days > 0 ? days : 3;
    return d * 24 * 60 * 60 * 1000;
}

function maxSnapshots(): number {
    const n = Number(process.env.DB_SNAPSHOT_MAX_FILES ?? 7);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 7;
}

async function listSnapshotAssets(): Promise<SnapshotAsset[]> {
    const result = await adminClient.fetch<SnapshotAsset[]>(
        `*[_type == "sanity.fileAsset" && defined(originalFilename) && originalFilename match $pattern] | order(_createdAt asc) {_id, _createdAt, originalFilename}`,
        { pattern: `${SNAPSHOT_FILENAME_PREFIX}*` }
    );
    return result ?? [];
}

async function probeVersion(bin: string): Promise<{ major: number; minor: number } | null> {
    return new Promise((resolve) => {
        const child = spawn(bin, ["--version"], { stdio: ["ignore", "pipe", "ignore"] });
        let out = "";
        child.stdout?.on("data", (d: Buffer) => (out += d.toString()));
        child.on("error", () => resolve(null));
        child.on("close", () => {
            const m = out.match(/PostgreSQL\)\s+(\d+)\.(\d+)/);
            resolve(m ? { major: Number(m[1]), minor: Number(m[2]) } : null);
        });
    });
}

/*
 * pg_dump must be >= the server's version. Prefer PG_DUMP_BIN, then whatever
 * is on PATH, then the highest versioned PostgreSQL client installed in the
 * Debian/Ubuntu layout (/usr/lib/postgresql/<v>/bin).
 */
async function resolvePgDump(): Promise<string | null> {
    const candidates: string[] = [];
    if (process.env.PG_DUMP_BIN) candidates.push(process.env.PG_DUMP_BIN);
    candidates.push("pg_dump");
    try {
        const roots = await fs.readdir("/usr/lib/postgresql");
        for (const r of roots) candidates.push(`/usr/lib/postgresql/${r}/bin/pg_dump`);
    } catch {
        // not a Debian-layout machine; PATH candidate may still work
    }
    const probed = await Promise.all(
        candidates.map(async (bin) => ({ bin, v: await probeVersion(bin) }))
    );
    const usable = probed.filter((p): p is { bin: string; v: { major: number; minor: number } } => p.v !== null);
    if (usable.length === 0) return null;
    usable.sort((a, b) => b.v.major - a.v.major || b.v.minor - a.v.minor);
    return usable[0].bin;
}

/*
 * The connection string is parsed into libpq's PG* environment variables so
 * the database password never appears in argv / the process list.
 */
function parseConnection(conn: string): Record<string, string> {
    const u = new URL(conn);
    if (u.protocol !== "postgresql:" && u.protocol !== "postgres:") {
        throw new Error("SUPABASE_DB_URL must be a postgresql:// connection string");
    }
    const env: Record<string, string> = {};
    if (u.username) env.PGUSER = decodeURIComponent(u.username);
    if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
    if (u.hostname) env.PGHOST = u.hostname;
    if (u.port) env.PGPORT = u.port;
    const db = u.pathname.replace(/^\//, "");
    if (db) env.PGDATABASE = db;
    return env;
}

function utcStamp(d = new Date()): string {
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return (
        `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
        `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`
    );
}

async function runDump(bin: string): Promise<{ file: string; filename: string }> {
    const conn = process.env.SUPABASE_DB_URL ?? "";
    const pgEnv = { ...process.env, ...parseConnection(conn) };
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "athletica-dump-"));
    const filename = `${SNAPSHOT_FILENAME_PREFIX}${utcStamp()}.dump`;
    const file = path.join(dir, filename);

    let stderr = "";
    const code = await new Promise<number>((resolve, reject) => {
        const child = spawn(
            bin,
            ["--schema=public", "--format=custom", "--no-owner", "--no-privileges", "--file", file],
            { env: pgEnv, stdio: ["ignore", "ignore", "pipe"], timeout: 15 * 60 * 1000 }
        );
        child.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
        child.on("error", reject);
        child.on("close", (c) => resolve(c ?? -1));
    });

    if (code !== 0) throw new Error(`pg_dump exited ${code}: ${stderr.trim().slice(-500)}`);
    const stat = await fs.stat(file);
    if (stat.size === 0) throw new Error(`pg_dump produced an empty file: ${stderr.trim().slice(-500)}`);
    return { file, filename };
}

async function heartbeat(cookieStore: CookieReader): Promise<SnapshotHeartbeatResult> {
    const env = getEnv();
    // Read-only session check: token refreshes are skipped (no cookie writes
    // are possible in the after() phase) — a stale session simply means this
    // load triggers no snapshot, which is always safe.
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
        },
    });
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return { triggered: false, detail: "no authenticated admin" };

    if (!process.env.SUPABASE_DB_URL) {
        console.error("[db-snapshot] SUPABASE_DB_URL is not set — snapshots are disabled.");
        return { triggered: false, detail: "missing SUPABASE_DB_URL" };
    }

    const snapshots = await listSnapshotAssets();
    const newest = snapshots[snapshots.length - 1];
    const ageMs = newest ? Date.now() - Date.parse(newest._createdAt) : Infinity;
    if (ageMs < intervalMs()) {
        const hours = Math.round(ageMs / 3_600_000);
        return { triggered: false, detail: `newest snapshot ${hours}h old (< interval)` };
    }
    /*
     * Disk lock closing the Sanity eventual-consistency gap: a snapshot
     * uploaded moments ago may not be visible to the GROQ query above yet
     * (reads-after-write can briefly return stale/empty lists), and
     * module-level memory is not reliable across dev reloads/restarts. The
     * lock file records the trigger time in /tmp; the Sanity timestamp
     * remains the authoritative long-term freshness source.
     */
    if (!(await acquireSnapshotLock())) {
        return { triggered: false, detail: "snapshot recently triggered (lock)" };
    }

    const bin = await resolvePgDump();
    if (!bin) {
        console.error("[db-snapshot] no working pg_dump binary found (set PG_DUMP_BIN).");
        return { triggered: false, detail: "pg_dump not found" };
    }

    try {
        const { file, filename } = await runDump(bin);
        const dumpDir = path.dirname(file);
        try {
            const buffer = await fs.readFile(file);
            const asset = await adminClient.assets.upload("file", buffer, {
                filename,
                contentType: "application/octet-stream",
                label: "db-snapshot",
                title: filename,
                description: `Automatic rolling Postgres snapshot (public schema) taken ${new Date().toISOString()}`,
            });
            console.log(
                `[db-snapshot] uploaded ${filename} (${(buffer.length / 1_048_576).toFixed(1)} MB) as ${asset._id}`
            );

            const cap = maxSnapshots();
            const all = await listSnapshotAssets();
            // Sanity's eventual consistency: the asset we just uploaded is
            // usually NOT visible to our own query yet. Count it explicitly,
            // otherwise every cycle undercounts by one and the cap never holds.
            let visible = all.length + 1;
            let removed = 0;
            while (visible > cap) {
                const oldest = all.shift();
                if (!oldest) break;
                await adminClient.delete(oldest._id);
                removed++;
                visible--;
                console.log(`[db-snapshot] retention: deleted oldest snapshot ${oldest.originalFilename ?? oldest._id}`);
            }
            return { triggered: true, detail: `uploaded ${filename}${removed ? `, pruned ${removed}` : ""}` };
        } catch (err) {
            // Release the lock so the next admin load can retry — otherwise a
            // failed run would suppress snapshots for the whole interval.
            await releaseSnapshotLock();
            throw err;
        } finally {
            await fs.rm(dumpDir, { recursive: true, force: true }).catch(() => {});
        }
    } catch (err) {
        // runDump itself failed — same lock-release rule.
        await releaseSnapshotLock();
        throw err;
    }
}

let inflight: Promise<SnapshotHeartbeatResult> | null = null;

const SNAPSHOT_LOCK_FILE = () => path.join(os.tmpdir(), "athletica-db-snapshot.lock");

/*
 * Exclusive-create lock recording the dump start time. True = we own this
 * snapshot run; false = another load (any process, any tab) took it recently.
 */
async function acquireSnapshotLock(): Promise<boolean> {
    const file = SNAPSHOT_LOCK_FILE();
    const now = Date.now();
    try {
        await fs.writeFile(file, String(now), { flag: "wx" });
        return true;
    } catch (err) {
        const code = (err as NodeJS.ErrnoException | null)?.code;
        if (code !== "EEXIST") {
            console.error("[db-snapshot] lock write failed:", err instanceof Error ? err.message : err);
            return false;
        }
        // File exists — is it fresh?
        try {
            const prev = Number((await fs.readFile(file, "utf8")).trim());
            if (Number.isFinite(prev) && now - prev < intervalMs()) return false;
            // Stale lock from an old/crashed run — take over.
            await fs.writeFile(file, String(now));
            return true;
        } catch (readErr) {
            console.error("[db-snapshot] lock read failed:", readErr instanceof Error ? readErr.message : readErr);
            return false;
        }
    }
}

async function releaseSnapshotLock(): Promise<void> {
    await fs.rm(SNAPSHOT_LOCK_FILE(), { force: true }).catch(() => {});
}

export function adminDbSnapshotHeartbeat(cookieStore: CookieReader): Promise<SnapshotHeartbeatResult> {
    if (inflight) return inflight;
    inflight = heartbeat(cookieStore)
        .catch((err): SnapshotHeartbeatResult => {
            console.error(
                "[db-snapshot] unexpected failure:",
                err instanceof Error ? err.message : err
            );
            return { triggered: false, detail: "error (see server log)" };
        })
        .finally(() => {
            inflight = null;
        });
    return inflight;
}
