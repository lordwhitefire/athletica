# Scope — Engagement 05, Sample: athletica/rollout (own)

**Date:** 2026-11-16
**Engagement:** 05 — Multi-lock admin auth + RLS-at-DB
**Sample slug:** athletica-rollout-own
**Mode:** Own-software RE — this is OUR code

## 1. The target

`athletica/rollout` — the admin panel for the Athletica football affiliate
marketplace. Lives in our own repo at `/home/lordwhitefire/current-project/athletica/rollout/`.
Next.js 16 + Supabase (auth + Postgres + RLS) + Upstash Redis. The three-locks
admin auth design we built earlier.

Local path: `/home/lordwhitefire/current-project/athletica/rollout/` (in-repo, NOT cloned)

## 2. The question

Reverse-engineer our OWN three-locks design so the rules are explicit and can be
carried into the new single-app build. Specifically:

1. **Lock #1 — Invite code.** How is an admin invited? Where is the code stored?
   Hashed? One-time? Revocable? Expiring? Re-validated at submit time?
2. **Lock #2 — Door-key cookie.** What is it? How is it issued? Sliding renewal?
   Hashed? What does it actually authenticate (spoiler: nothing — it's a gate)?
3. **Lock #3 — Supabase JWT + role.** How is the admin role set? Where is it
   checked? Fail-closed behaviour?
4. **RLS-at-DB.** What policies exist? What's the deny-by-default pattern? How do
   service_role, anon, and authenticated interact?
5. **The fail-silent rule.** Why 404 not 401/403?
6. **The per-page gate pattern.** How is each admin route protected? One-liner?

## 3. Ownership basis — own software, no licence gate

| Field | Value |
|---|---|
| Repository owner | Us (lordwhitefire / athletica) |
| Licence | N/A — our own code, not a third-party sample |
| Permission basis | We own it; we may study, copy, modify freely |
| What we extract | The rules of our three-locks design, made explicit so they can be re-implemented in the new build |
| What we will NOT do | Run the dev server. Modify the source. (It's our reference for the new build.) |

This is the only engagement where the sample is ours. The protocol still applies —
triage, evidence, analysis, report — but there's no licence gate and no
"don't copy" rule. We're documenting our own design choices.

## 4. Mode

**Own-software RE.** Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on TypeScript source + SQL.
- **Dynamic analysis:** no. No `next dev`, no Supabase queries.
- **Network:** no.
- **Modify original:** no — preserve as the reference.
- **Patch / forward-engineer:** no — the new build will re-implement these rules
  in its own codebase, not edit this one.

## 6. Out of scope

- The product catalog model (engagement 04 covered Spree's pattern; ours is
  simpler and was built before this RE exercise).
- The analytics / click pipeline (engagement 06 covers Plausible/Umami).
- The storefront UI (engagement 07).
- The Supabase project setup / migrations beyond the three SQL files in the repo.

## 7. Tools present

`rg`, `find`, `file`, `python3`, `node`. Sufficient for TypeScript + SQL.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if a design choice is
undocumented and unclear, mark it `not proven` and propose what the new build
should do instead.

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
