# FM-26 — Documentation + handoff

**Phase:** 6 | **Spec:** hardening | **Supersedes:** ROLL-18 | **Depends on:** all | **Status:** ⬜ Pending

## What we're building

The documentation + handoff package: `rollout/README.md` (real setup/run/deploy — replace the create-next-app default), `.env.example` (current), a changelog, API docs (route handler notes), an admin guide (one-pager), an affiliate guide, the architect handoff (layer-by-layer file map from `blueprint/`), and the smoke-test notes per phase.

## Why it matters

Code without docs is a black box. The owner needs to operate the admin + read analytics + review payouts without asking. The next developer needs to clone, read, and run without a kickoff call. The architect handoff maps every blueprint decision to the files that implement it.

## What success looks like (benchmarks)

- After this, `rollout/README.md` is a real setup/run/deploy doc (not the create-next-app default); a new developer can clone, install, configure `.env.local` from `.env.example`, and run the app locally without asking a question.
- After this, `.env.example` lists every env var the app needs (Supabase URL/anon/service, Sanity token, Upstash, Sentry, Amazon tags per-marketplace, Creators API creds, email) with a one-line comment each.
- After this, a changelog exists + is kept current per release.
- After this, API docs (route handler comments or an `api/` note) describe each `/api/*` endpoint's purpose + auth requirement.
- After this, the admin guide (one-pager) covers: sign in, manage products + variants + categories, bulk ops, CSV import, media library, read analytics, review payouts, manage affiliates.
- After this, the affiliate guide covers: signup, verify, create trackers, read balance, request a payout.
- After this, the architect handoff maps every blueprint decision to the implementing file(s).
- After this, the smoke-test notes per phase are recorded (the critical-path manual checks from the phase gates).

## Context the Builder needs

- The blueprint (`blueprint/`) is the source for the architect handoff.
- Existing: `rollout/README.md` (default create-next-app — replace), `rollout/.env.example` (update), `rollout/AGENTS.md` (Next.js 16 notes — keep).
- The owner ruling: no full test suite; the smoke notes are the critical-path checks, not a test runner.

## Boundaries

- Do not leave the create-next-app default README.
- Do not let `.env.example` drift from the actual env usage.
- Do not write docs that hide mistakes in complicated wording — write for a smart person who just joined.
- Do not skip the smoke-test notes (they're the owner's ruling replacement for a test suite).
- The architect handoff is a file map, not a re-statement of the blueprint — it points at files.
