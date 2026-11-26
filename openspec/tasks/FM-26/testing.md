# FM-26 — Testing (documentation + handoff)

**Task:** FM-26 | **Verify behavior, not UI.**

## What behavior to verify

1. Can a new developer clone + run the app using only the README + `.env.example`?
2. Does `.env.example` list every required var?
3. Does the admin guide cover the full workspace workflow?
4. Does the affiliate guide cover signup → tracker → payout?
5. Does the architect handoff map blueprint decisions to files?
6. Are the smoke-test notes per phase recorded?

## How to verify (behavioral)

- **Cold start:** a new developer (or a fresh checkout) clones the repo, reads `rollout/README.md`, copies `.env.example` → `.env.local`, fills in the values, runs the install + dev command → the app runs locally without them asking a question.
- **Env completeness:** cross-check `.env.example` against the actual env usage in the code (`process.env.*` references) → every var is documented with a one-line comment.
- **Admin guide:** read the admin guide → it covers sign in, products + variants + categories, bulk ops, CSV import, media library, analytics, payouts, affiliates. A non-technical owner could follow it.
- **Affiliate guide:** read the affiliate guide → it covers signup, verify, trackers, balance, payout request.
- **Architect handoff:** open the handoff → for each blueprint decision, it names the file(s) that implement it (e.g. "three locks → `auth/admin.ts` + `auth/door-key-validate.ts` + `src/proxy.ts`").
- **Smoke notes:** the smoke-test notes exist for each phase (the critical-path manual checks).

## What "working" means

- The system is operable + maintainable without a kickoff call.
- Docs match reality (no env drift, no missing guide section).
- The handoff traces decisions to code.

## What to report

- Whether the cold-start run succeeded (and any question the developer had to ask — there should be none).
- Any `process.env.*` reference missing from `.env.example`.
- The admin guide's coverage (which workflows are documented).
- The affiliate guide's coverage.
- A sample of the architect handoff's decision→file mappings.
- The smoke-test notes per phase (which are recorded).
