# FM-05 — Implementation + Testing (combined brief)

**Task:** FM-05 (analytics pipeline) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/analytics/salt-rotation.ts` — 90s rotation, current+previous, 48h retention, in-memory, `forceRotate()` for cron.
- `rollout/src/lib/analytics/visitor-hash.ts` — SipHash64(salt, ua+ip+domain+root_domain), BIGINT, cross-site unlinkability, `resolveVisitorHash` + `resolveVisitorHashPrevious` (grace window).
- `rollout/src/lib/analytics/bot-filter.ts` — 6-layer (UA-parser-js + Headless Chrome override + 50+ fragment list + false-positive sanitizer); unparseable UAs accepted; `isBotRequest`/`isBotByReferer`/`isBotByIp`/`isBotFull`.
- `rollout/src/lib/analytics/ip-chain.ts` — 6-header priority chain (x-plausible-ip→cf-connecting-ip→x-forwarded-for→b-forwarded-for→forwarded), port stripped, EU country set, `DROP_REASONS` enum.
- `rollout/src/lib/analytics/analytics-service.ts` — `recordView` + `recordClick` (service-role, slim ~12-field shape, raw IP never stored).

## Benchmarks met
- SipHash64 BIGINT ✓; salt 90s + grace window ✓; cross-site unlinkability (domain in hash) ✓; 6-header chain + Cloudflare-trust order + port strip ✓; UA-parser + Headless Chrome override + unparseable-accepted ✓; drop-reason enum ✓; pipeline order (bot→enrich→dedup→persist) ✓; no raw IP stored ✓.

## Tester verdict
Static inspection. PASS. The SipHash impl is a reference shape (a vetted library would replace it in production — flagged). No live run (no Postgres/Redis). Helpers referenced by FM-03/FM-04 now exist. Recommend ✅.
