# Scope — Engagement 05, Sample: NextBase

**Date:** 2026-11-16
**Engagement:** 05 — Multi-lock admin auth + RLS-at-DB (comparison sample)
**Sample slug:** nextbase
**Mode:** A — open-source RE under licence, static only

## 1. The target

NextBase (imbhargav5/nextbase-nextjs-supabase-starter) — a Next.js + Supabase
starter kit. Same stack as athletica/rollout (Next.js + Supabase), so a direct
comparison. Last commit 2026-10-02. 31 MB, 489 files. Notably includes a
`.agents/skills/` folder with documented RLS best practices.

Local path: `reverse-engineering-workspace/samples/nextbase/`

## 2. The question

athletica/rollout (sample 1 of this engagement) uses a **three-locks** model:
invite code → door-key cookie → JWT role, with fail-silent 404s. Is this overhead
justified, or does NextBase's simpler model suffice? Specifically:

1. **Lock model.** How many locks does NextBase use? (Likely one — Supabase session.)
2. **Middleware vs per-route.** Does NextBase centralize the gate in middleware?
3. **RLS pattern.** User-ownership-based or role-based? Per-row policies?
4. **RLS performance.** Any `auth.uid()` caching patterns? FORCE RLS?
5. **Role checks.** Where does NextBase check admin role, if at all?
6. **Fail behaviour.** Redirect (reveals URL) or 404 (conceals URL)?
7. **Action client pattern.** Layered auth middleware (actionClient → authActionClient → adminActionClient)?

## 3. Ownership basis (mode A — MIT)

| Field | Value |
|---|---|
| Repository owner | Bhargav Ponnapalli |
| Licence | **MIT** (`LICENSE` head confirms) |
| Permission basis | MIT permits unrestricted use, study, modification. We exercise *study*. |
| What we extract | Single-lock model, middleware pattern, RLS optimization rules (the `(select auth.uid())` caching trick), layered action-client pattern, `getClaims()` performance optimization. |
| What we will NOT do | Copy source into our build (we have our own three-locks design). Run Next.js. `pnpm install`. |

## 4. Mode

**A** — open source under a permissive licence. Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on TypeScript + SQL + MD.
- **Dynamic analysis:** no.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- NextBase's blog / items / private-items feature implementation (we only care
  about the auth + RLS patterns).
- NextBase's full UI components.
- The `setup.sh` script.

## 7. Tools present

`rg`, `find`, `file`, `python3`, `node`. Sufficient.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if copying code would be
required (then stop — re-implement).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
