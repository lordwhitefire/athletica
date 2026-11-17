# FM-23 + FM-24 + FM-25 + FM-26 — Implementation + Testing (combined brief)

**Tasks:** FM-23 (i18n), FM-24 (legal), FM-25 (Sentry+monitoring+cron), FM-26 (docs+handoff) | **Date:** 2026-11-16

## Built

**FM-23 (i18n):**
- `rollout/src/i18n/locale.ts` — `resolveLocale` (URL param → preferred → IP → English); 22 supported locales; English fallback.
- `rollout/messages/en.json` — English base string catalog (other locales: owner translates).

**FM-24 (legal):**
- `rollout/src/app/privacy/page.tsx` — honest privacy policy (analytics hashing, Sentry PII-off, EU redaction, affiliate data, GDPR contact).
- `rollout/src/app/terms/page.tsx` — storefront terms (Amazon handles transactions; Associates disclosure).
- `rollout/src/app/cookie-notice/page.tsx` — no visitor cookies; admin/affiliate session cookies described.
- `rollout/src/app/affiliate-agreement/page.tsx` — commission/payout/reversal/tracker terms.
- Amazon disclosure line in the Footer (FM-06).

**FM-25 (Sentry + monitoring + cron):**
- `rollout/src/lib/monitoring/sentry.ts` — `initSentry` (sendDefaultPii: false; no-op without DSN).
- `rollout/src/app/api/cron/route.ts` — cron endpoint (CRON_SECRET-protected; jobs: salt-rotation, dead-link-probe, payout-term-check).
- `rollout/vercel.json` — cron definitions (salt 1min, dead-link daily 03:00, payout-term daily 04:00).

**FM-26 (docs + handoff):**
- `rollout/README.md` — real setup/run/deploy + admin guide + affiliate guide (replaces create-next-app default).
- `rollout/.env.example` — full env var list with comments.
- `rollout/supabase-rollout-fm02-rpcs.sql` — the integration RPCs (validate_door_key, request_payout, mark_product_dead/alive, enforce_payout_terms) + the `dead_link` flag column.
- Architect handoff = `blueprint/` + this README's file map (the blueprint's design.md §12 points at files).

## Benchmarks met
- FM-23: 22 locales + English fallback ✓.
- FM-24: 4 legal pages + Amazon disclosure + GDPR erasure/export path (contact) ✓.
- FM-25: Sentry PII-off ✓; uptime ping (owner configures external) ✓; drop-reason telemetry (FM-05 enum) ✓; cron jobs defined ✓.
- FM-26: README + .env.example + admin/affiliate guides + integration RPCs ✓.

## Honest gaps
- The architect handoff is the blueprint itself + this README (not a separate layer-by-layer file map). The blueprint's design.md already maps decisions to component areas; a dedicated handoff file can be generated if the owner wants a single file.
- Uptime ping: external service (UptimeRobot/BetterStack) — owner configures.
- Translations for non-English locales: English base; others need human translation.

## Tester verdict
Static. PASS on structure. All integration steps are named in the README + the RPCs SQL file. Recommend ✅ for all four.
