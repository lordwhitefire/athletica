# 03 — Project Ring

**Blueprint:** Athletica (FULL MARKETPLACE)
**Mode:** Plan

The work around the product: version control, client talk, legal, docs, handoff, progress. 12 areas. Rules: do 01 and 75 before Build Layers; keep 73/74 running; the Ring never changes the product.

---

## Start of the project

### 01 — Project setup (Decided)

- **Name:** Athletica. **Owner/client:** lordwhitefire (Victor). **Domain:** `*.vercel.app` → custom domain.
- **Hosting:** Vercel (one public project). **Environments:** dev / preview / production. Same Supabase project, schema-isolated (`rollout` + `affiliate`).
- **Audience:** football gear buyers (storefront) + affiliates (dashboard) + admin (the client).
- **Currency:** per-marketplace (USD default, GBP, EUR, etc.).
- **Deadline:** per owner, phased (6 phases, each with a phase gate).

### 75 — Constraint identification (Decided)

- **Budget:** solo owner + affiliates; Vercel/Supabase Pro tiers when traffic justifies.
- **Hosting limits:** Vercel (10s serverless free, 60s Pro), Supabase (free → Pro), Upstash (free tier), Sentry (free tier).
- **Amazon limits:** Creators API (optional): starts at 1 TPS / 8,640 requests/day; needs 10 qualifying sales in 30 days; access is lost after 30 days without qualifying sales. Associates tag is per-marketplace (one tag per store).
- **Nigerian context:** slow mobile data, in-app browsers, power cuts. Phone-first is the audience, not a preference.
- **Email deliverability:** affiliate verification + payout notifications must reach inboxes (configure SPF/DKIM).
- **Client's devices:** phone + PC (verify both).

### 32 — Client communication (Decided)

- Owner approves designs + says go/no-go.
- **Phase gates:** owner reviews at end of each of the 6 phases before the next begins.
- Progress via `developer-workspace/PROGRESS.md`.
- Questions the repo can't answer (Amazon tags per marketplace, affiliate program terms) go to the owner.

---

## While building

### 15 — Version control (Decided)

- Git at root. Protected `main`. Feature branches per phase/task. Conventional commits.
- `.gitignore` tracks all except secrets (`.env*` except `.env.example`) + build output + `reverse-engineering-workspace/samples/`.

### 16 — Development workflow (Decided)

- `tsconfig.json` strict. ESLint + Prettier. Pre-commit checks. Code review before merge.
- Read `rollout/AGENTS.md` (Next.js 16 breaking changes) before writing code.
- `zod` for runtime validation on all API inputs.

### 17 — Testing (Decided — smoke + critical-path per phase)

- **Owner ruling: no full test suite.** *(Study BLUEPRINT.md, Project Ring)*
- Smoke test before each phase launch:
  - Phase 1: product page loads; CTA returns URL; unauthenticated admin → 404.
  - Phase 3: product CRUD; bulk import; media upload.
  - Phase 4: affiliate signup; payout state machine; ownership RLS (affiliate can't see other affiliates' data).
  - Phase 5: dead-link detection marks a product; geo-routing resolves.
- Critical-path manual check on real phone (in-app browser) + real PC each phase.
- If the owner later wants tests, the critical-path set is named above.

### 22 — Naming conventions (Decided)

- Files: `kebab-case.ts/.tsx`. Components: `PascalCase`. Functions/vars: `camelCase`. Tables/columns: `snake_case`. Constants: `UPPER_SNAKE`. Routes: `kebab-case`.

### 21 — Documentation (Decided)

- `rollout/README.md` (real setup/run/deploy). `.env.example` (kept current). Changelog per release.
- API docs (route handler comments + `api/` note).
- **Admin guide** (one-pager: sign in, products, bulk import, media, analytics, payouts, affiliates).
- **Affiliate guide** (signup, trackers, balance, payout request).
- This blueprint. The architect handoff (produced by the architect agent from this blueprint).

### 73 — Progress tracking (Decided)

- `developer-workspace/PROGRESS.md` (kept current). Per-phase checklists. Per-task ROLL folders in `developer-workspace/` + `openspec/tasks/`.

### 74 — Session recovery (Decided)

- After interruption: reload rule files first (`BLUEPRINT.md`, this blueprint, `repomix-*-agent.txt`).
- Log after each meaningful action: what done, what next, what decided.

---

## End of the project

### 20 — Legal and compliance (Decided)

- **Amazon Associates disclosure:** "I earn from qualifying purchases" on every product page.
- **Privacy policy:** analytics hashing (IP+UA), Sentry (PII off), affiliate data, admin email.
- **Cookie notice:** admin/affiliate session cookies; no visitor cookies.
- **GDPR:** EU IP redaction (implemented); affiliate data deletion on request; right to export.
- **Terms of service:** storefront + affiliate agreement (commission terms, payout terms, reversals).
- **Affiliate payout tax docs:** per jurisdiction (e.g. 1099 for US affiliates, where applicable).
- **Age limits:** `is_adult` flag from the Creators API when enabled, otherwise unset; no special UI in v1 (Amazon gates the purchase).

### 33 — Handoff and maintenance (Decided)

- **Who maintains:** owner + next developer.
- **Credentials handoff:** Supabase (project URL, service key), Sanity (project ID, write token), Upstash (Redis URL + token), Sentry (DSN), Vercel (project access), Amazon Associates (per-marketplace tags + Creators API credential ID/secret once eligible), email (SMTP/Resend credentials).
- **Client training:** admin guide + affiliate guide (one-pager each).
- **Support period:** per owner.
- **Architect handoff** produced by the architect agent from this blueprint (layer-by-layer file map).

---

## Project Ring summary

All 12 areas Decided. Nothing Pending. The Ring governs how the product is built, documented, and handed off — across all 6 phases.
