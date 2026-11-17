# FM-05 — Analytics pipeline (salt rotation + visitor hash + telemetry)

**Phase:** 1 | **Spec:** redirect-click | **Depends on:** FM-02 | **Status:** ⬜ Pending

## What we're building

The server-side analytics enrichment pipeline that computes the visitor hash (SipHash64 with a rotating 90-second salt + grace window), runs the bot filter (UA-parser library + Headless Chrome override, unparseable UAs accepted), resolves the IP through the 6-header priority chain, assigns named drop-reasons with per-reason telemetry, and writes events in the correct pipeline order.

## Why it matters

This is what makes the analytics honest and the dashboards real. Without salt rotation, a captured hash set could be cross-referenced later (linkability). Without the grace window, a visitor whose salt rotated between two events would be double-counted. Without named drop-reasons, you can't see *why* events disappear. Without the 6-header IP chain, you get the wrong country behind Cloudflare/proxies.

## What success looks like (benchmarks)

- After this, a visitor's identity hash = `SipHash64(salt, user_agent + ip + domain + root_domain)`, stored as BIGINT (not hex).
- After this, the salt rotates every 90 seconds; two salts are valid at any time (current + previous); salts older than 48 hours are deleted; the salts are cached in memory.
- After this, a visitor whose salt rotated between two events within the grace window is still linked (the pipeline tries `current` then `previous`).
- After this, the same visitor on two different Athletica domains produces **two different hashes** (cross-site unlinkability — the domain is in the hash input).
- After this, the IP is resolved via the 6-header chain (`x-plausible-ip`→`cf-connecting-ip`→`x-forwarded-for`→`b-forwarded-for`→`forwarded`→`conn.remote_ip`), and the port is stripped from IPv4/IPv6.
- After this, a spoofed `x-forwarded-for` does NOT override `cf-connecting-ip` when behind Cloudflare.
- After this, a Headless Chrome UA is dropped (explicit override) even when the UA-parser classifies it as a client.
- After this, an unparseable UA is **accepted** (not dropped).
- After this, every dropped event has a named `drop_reason` (`bot, spam_referrer, invalid, dc_ip, threat_ip, persist_error` at minimum), and the counts are queryable as a grouped total.
- After this, the pipeline runs in order: bot filter → enrichment → expensive lookups (GeoIP) → shield checks → persistence.

## Context the Builder needs

- The salt rotation: a scheduled job (Vercel cron, 90s) or an in-process timer; two salts in memory (current + previous); `crypto.randomBytes(16)` for generation; a `salts` table (or in-memory) with `inserted_at` for the 48h cleanup.
- The grace window: hash with `current`; if no session matches, retry with `previous`.
- The 6-header chain (RE-06 §2.5). Order matters. Strip the port via regex (IPv4 `1.2.3.4:5678` → `1.2.3.4`; IPv6 similarly).
- The bot filter: use `ua-parser-js` (or equivalent maintained library). Add explicit `client.name === "Headless Chrome"` override. Do NOT drop unparseable UAs.
- Drop-reason enum: stored as a text/enum column; telemetry = a grouped `SELECT drop_reason, count(*)` query.
- Pipeline composition: small functions, each returns enriched-or-dropped; order is bot (cheap) → enrich → expensive → shield → persist.

## Boundaries

- Do not store the raw IP in any row (only the hash + the `""`-or-absent `ip` field).
- Do not drop unparseable UAs (accept them — rather over-count than under-count a real visitor).
- Do not skip the grace window (current-then-previous).
- Do not put the domain outside the hash input (cross-site unlinkability requires it).
- Do not let a salt-rotation failure crash the pipeline (fail to `current` salt only; log).
- Do not use ClickHouse (Postgres + monthly partitions scales to millions/month — RE-06 §5).
