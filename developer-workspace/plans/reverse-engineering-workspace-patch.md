# Plan — apply and fix `reverse-engineering-workspace.patch`

**Date:** Mon Nov 16 2026
**Owner decision:** Option B — everything in the workspace gets committed, `evidence/` included,
so other agents can verify claims. Solidus and Umami stay, marked *not studied* (no deletions).
Owner confirms all ten investigation scopes were approved.

**Source patch:** `/home/lordwhitefire/Downloads/reverse-engineering-workspace.patch`
(54 diffs, 11,656 insertions, 0 deletions, no secrets)

---

## Order matters

The patch is a diff — you cannot trim a file that does not exist yet. So: **apply first, then
edit the resulting files, then fix `.gitignore`, then commit.**

---

## Step 1 — Apply the patch, skipping `.gitignore`

```bash
cd /home/lordwhitefire/current-project/athletica
git apply --exclude=.gitignore /home/lordwhitefire/Downloads/reverse-engineering-workspace.patch
```

`--exclude` is required: the patch's `.gitignore` hunk expects a 2-line file (`skills/` +
`node_modules/`, blob `2d7753f4`). Athletica's is `/*` plus an allow-list, so that one hunk
cannot apply. Verified: everything else applies cleanly.

**Result:** 53 new files under `reverse-engineering-workspace/`.

---

## Step 2 — Trim the one full-file AGPL block

**File:** `reverse-engineering-workspace/engagements/01-redirect-click-tracking/dub/2026-11-16/evidence/excerpts.txt`

`EVIDENCE 1` is the only block marked *"(full file, 74 lines)"* — a complete verbatim copy of
Dub's `apps/web/middleware.ts`. Dub is **AGPLv3**; this repo is **MIT**. It also breaks the
workspace's own rule (Dub `scope.md`: "No verbatim code copy").

**Change:** drop the 74-line verbatim body. Keep the header, and replace the body with a
citation block:

```
EVIDENCE 1 — edge redirect entry: apps/web/middleware.ts
Source: samples/dub/apps/web/middleware.ts
Commit: 6b463b4bdd9ed2fd9aa416f67b5b77d317b1471e (2026-10-26)
Licence: AGPLv3 — read for rules, not copied
Note: full file NOT reproduced here (AGPLv3). Read it at the commit above:
      git clone https://github.com/dubinc/dub.git && git checkout 6b463b4
      then open apps/web/middleware.ts
Cited lines: <the exact ranges the analysis relies on>
```

**Not touched:** `EVIDENCE 2`–`8` are cited ranges (`record-click.ts:1-130`,
`link.ts`, etc.), not whole files — those stay.

---

## Step 3 — Fix the wrong machine's paths

`/home/z/my-project/athletica/` does not exist here. Replace with
`/home/lordwhitefire/current-project/athletica/` in **5 places**, all inside engagement 05:

- `engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/analysis.md`
- `engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/report.md`
- `engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/scope.md`
- `engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/sample.md`
- `engagements/05-multi-lock-auth-rls/athletica-rollout-own/2026-11-16/evidence/excerpts.txt`

Verify with `grep -rn '/home/z/' reverse-engineering-workspace/` returning nothing.

---

## Step 4 — Factual corrections

| Where | Change |
|---|---|
| `INDEX.md` (line ~140) | "9 samples studied" → **10** |
| `INDEX.md` (line ~11900) | "9 samples studied" → **10** |
| `engagements/02-affiliate-commissions/weferral/2026-11-16/scope.md` | `## 8. Approver` → `## 9. Approver` |

10 is correct: 2+2+1+1+2+1+1.

---

## Step 5 — Note the unstudied samples (do not delete)

In `README.md`, the engagement-order table lists *Solidus* (04) and *Umami* (06). Neither was
studied. **Keep both**, append "(not studied)" so the record is honest.

---

## Step 6 — Make the README agree with reality

| Location | Now says | Change to |
|---|---|---|
| README rule 7 | "Nothing in this workspace is committed to the main repo" | Evidence and reports **are** committed; `samples/` (the clones) are not |
| README engagement table | Status `pending` for all 7 | Rename the column **Planned** — `INDEX.md` holds live status (`reported`) |

---

## Step 7 — Remove third-party PII

| Value | Where |
|---|---|
| `valerian@valeriansaliou.name` | YOURLS evidence |
| `116.12.250.1` | one evidence file |

Replace with `[redacted]`. Both are already public upstream, so this is hygiene, not a leak fix.

---

## Step 8 — `.gitignore` (needs owner's explicit nod)

AGENTS.md forbids touching `.gitignore` unless asked. Committing this folder *requires* one line,
because the root file starts with `/*` (ignore everything, allow-list the rest):

```
/*                                     ← existing, ignores everything
...
!/reverse-engineering-workspace/       ← ADD: un-ignore the workspace
reverse-engineering-workspace/samples/ ← ADD: keep the 422 MB clones out
```

Without the first added line, `git add` silently commits nothing. This is the whole reason the
patch's own `.gitignore` hunk could not work here.

---

## Step 9 — RE agent convention (outside this repo, optional)

`~/.config/opencode/agent/reverse-engineering-agent.md` says the agent writes to `re/` and
never commits. The workspace is `reverse-engineering-workspace/` and is committed. Pick one so
the agent and the folder stop disagreeing.

**Recommendation:** change the agent file's `re/` references to
`reverse-engineering-workspace/`, and relax "never commit" to "never commit `samples/`."

This file is global, not part of athletica — do it only on the owner's word.

---

## Step 10 — Commit

```bash
git add reverse-engineering-workspace .gitignore
git commit -m "Add reverse-engineering workspace: 7 engagements, 10 samples, evidence"
```

Then push only if the owner says so.

---

## Verification

| Check | Expected |
|---|---|
| `git apply --check --exclude=.gitignore` | passes before applying |
| `grep -rn '/home/z/' reverse-engineering-workspace/` | no output |
| `grep -rn 'valerian@\|116.12.250.1' reverse-engineering-workspace/` | no output |
| `grep -rn 'full file' reverse-engineering-workspace/` | no output |
| `git status` after commit | clean |
| Spot-check one citation | e.g. `rollout/src/app/api/admin/auth/signup/route.ts` is 110 lines, as cited |

---

## Out of scope

- The two `(TBD, in repo)` rows in INDEX — the consolidated master document does not exist yet.
- Dub `sample.md`'s "Deeper layout to be filled" — a note left in a reported engagement.
- Changing any report's findings.
- Pushing (waiting on owner).