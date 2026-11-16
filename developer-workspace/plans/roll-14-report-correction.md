# Plan — Correct ROLL-14 report.md

**Date:** Sat Oct 31 2026
**File in scope:** `developer-workspace/ROLL-14/report.md` (and nothing else)
**Type:** documentation correction + genuine re-verification

---

## Objective

`developer-workspace/ROLL-14/report.md` contains two classes of error: wrong environment-variable
names, and a static check recorded against a file path that does not exist. Correct both, make the
underlying claim actually verified, and leave an honest record of what was wrong — not a silent edit.

## Why it matters

The check on line 25 reads:

```
- No `athletica-20` in `rollout/src/lib/analytics/affiliate-service.ts`
```

That path does not exist. `rg` against a nonexistent file returns no matches, so the check reads as
"pass" without ever inspecting the real file. The conclusion happens to be true, but **the
verification was not performed.** A report that records green checks it never ran is worse than one
that records nothing.

## Scope

**In scope:** `developer-workspace/ROLL-14/report.md` — variable names, one file path, one added
correction block.

**Explicitly out of scope:**

- Application code — verified already, `athletica-20` genuinely absent from
  `src/lib/affiliate/affiliate-service.ts`
- `.env.example` / `.env.local` — already correct (`AMAZON_TAG`, `AMAZON_MARKETPLACE`,
  `ANALYTICS_HASH_SALT`)
- `openspec/tasks/ROLL-14/task.md` — the spec is correct; owner's territory
- `developer-workspace/ROLL-14/architect-handoff.md` — already records these as *findings*; it is the
  corrected account, not the broken one
- `deviations-report.md`, `product-JI1092.md` — unaffected, no wrong names present
- Any commit or push

## Confirmed blast radius (measured, not assumed)

`rg` across `developer-workspace/` and `openspec/` finds the wrong names in exactly one file —
`ROLL-14/report.md` — at lines 25, 38, 49, 55, 57, 59, 63, 69, 70. `ANALYTICS_HASH_SALT` is a real
variable and is correct wherever it appears; it is left alone.

## Steps

### Step 1 — Re-verify the claim for real, before editing anything

Run the check against the correct path and capture output:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
rg -n "athletica-20" src/lib/affiliate/affiliate-service.ts    # expect no matches
```

This establishes the truth independently of the report. The edit in step 3 must reflect this output,
not the reverse.

### Step 2 — Correct the variable names and the path in place

| Line | From | To |
|---|---|---|
| 25 | `src/lib/analytics/affiliate-service.ts` | `src/lib/affiliate/affiliate-service.ts` |
| 38 | `ANALYTICS_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 49 | `ANALYTICS_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 55 | `ANALYTICS_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 57 | `ANALYTICS_TAG` / `ANALYTICS_MARKETPLACE` | `AMAZON_TAG` / `AMAZON_MARKETPLACE` |
| 59 | `ANALYTICS_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 63 | `ANALYTICS_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 69 | `AMAZON_MARKETPLACE` | `AMAZON_MARKETPLACE` |
| 70 | `AMAZON_MARKETPLACE` | `AMAZON_MARKETPLACE` |

`ANALYTICS_HASH_SALT` is untouched — it is the correct name of a real variable.

Line 27 already reads `AMAZON_TAG` and is correct. Its omission of `AMAZON_MARKETPLACE` from that
sentence is a separate, smaller gap; fixing it is optional and will be noted rather than silently
absorbed.

### Step 3 — Add a correction block at the top of the report

Above "## What was built", insert a dated block stating:

- which two errors existed
- that the line-25 check passed vacuously against a nonexistent path and was not a real verification
- that the claim has now been genuinely re-verified against `src/lib/affiliate/affiliate-service.ts`
- that the rest of the report's conclusions were re-checked and stand

The wrong version stays on record in git history and in the correction block; nothing is deleted.

### Step 4 — Verify the correction

```bash
rg -n "ANALYTICS_TAG|ANALYTICS_MARKETPLACE" developer-workspace/ROLL-14/report.md   # expect none
rg -n "analytics/affiliate-service" developer-workspace/ROLL-14/report.md            # expect none
rg -n "AMAZON_TAG|AMAZON_MARKETPLACE" developer-workspace/ROLL-14/report.md         # expect present
```

## What "done" looks like

- Wrong names: **0** occurrences in the report
- Wrong path: **0** occurrences
- Real names present and correct
- A dated correction block explaining the original error, including the vacuous-pass admission
- `report.md` is the only file modified

## Risks

Near zero. This is a documentation file inside the agent's own workspace. No code, schema, data,
config, or spec is touched. The only thing that could go wrong is over-editing — rewriting claims in
the report that were correct — so the scope stays on the ten lines listed.

## Not doing

Not re-deriving the whole report. Not touching the openspec spec. Not committing.
