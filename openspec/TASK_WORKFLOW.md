# Task Workflow Protocol — Builder + Tester Pairs

**Authority**: This document governs how every implementation task is structured from now on. No exceptions.

---

## Core Principle

**Agents understand intent, not instructions.** Every task file is a *knowledge explanation* — what we're building, why it matters, what success looks like. The agent figures out *how*.

---

## The Pair Rule

For **every** implementation step, produce **two files** in a dedicated folder under `openspec/tasks/`:

```
openspec/tasks/ARCH-XXX/
├── task.md       → Builder's knowledge explanation
└── testing.md    → Tester's knowledge explanation
```

---

## `task.md` — Builder's Knowledge Explanation

**Purpose**: Transfer *intent* so the Builder understands the "what" and "why," not the "how."

**Structure**:
1. **What we're building** — one or two sentences, plain language
2. **Why it matters** — what this enables, what breaks without it
3. **What success looks like** — concrete, observable outcomes (not "it works")
4. **Context the Builder needs** — existing files, data shapes, APIs, constraints
5. **Boundaries** — what NOT to touch, what's out of scope
6. **Acceptance benchmarks** — shaped like: *"After this, when the user does X, Y should happen."*

**Forbidden**: Step-by-step instructions, "make sure it works," implementation details, file paths to edit.

---

## `testing.md` — Tester's Knowledge Explanation

**Purpose**: Transfer *intent* so the Tester understands the *behavior to verify*, not test cases to run.

**Structure**:
1. **What behavior to verify** — the same outcomes from `task.md`, framed as questions
2. **How to verify in the browser** — load the page with Lighthouse, interact, observe
3. **Lighthouse protocol**:
   - Lighthouse lives at `~/Lighthouse` (load it on Google Chrome)
   - Navigate to the relevant page/route
   - Perform the user action described in the benchmarks
   - Observe: Did the right data load? Did the interaction do what we said?
   - **No screenshots. No pixel diffs. No UI matching.** Only: *Does it behave correctly?*
4. **What "working" means** — the specific behavioral checks:
   - Data comes from the right source (Supabase, not Sanity/JSON)
   - Filtering/sorting happens in the database (not browser)
   - Cart stores IDs, fetches live data on view
   - Links go to Amazon with correct affiliate info
   - Admin edits save to Supabase, not Sanity
5. **What to report** — a plain-language report:
   - What you tested
   - What you observed (behavior, not UI)
   - Whether it matched the intent
   - Any gaps or surprises

**Forbidden**: "Run npm test," "check snapshot," "verify UI matches design."

---

## The Loop (One Pair at a Time)

```
1. Architect writes task.md + testing.md for ONE registry entry (e.g., ARCH-01)
2. You run Builder with task.md        → Builder writes implementation_report.md
3. You run Tester with testing.md      → Tester writes testing_report.md
4. You bring BOTH reports to Architect
5. Architect reads both against the task's benchmarks
   a. Matches → tick registry, next task
   b. Doesn't match → Architect writes reconciliation pair (fix + verify)
6. Repeat until registry entry is ✅
```

---

## Registry Discipline

- `openspec/tasks-registry.md` is the **single source of truth** for what's next
- Only the Architect ticks entries (after reviewing reports)
- One entry at a time — no parallel tracks

---

## What This Replaces

| Old Way | This Way |
|---|---|
| Orchestrator + codified validation | Architect reads reports, decides |
| Instructions ("do X, then Y") | Knowledge explanations ("here's why") |
| Screenshot/UI testing | Lighthouse behavioral verification |
| "Make sure it works" | "After this, when user does X, Y happens" |
| Rigid schema checks | Intent → behavior match |

---

## Quick Reference for Me (the Architect)

When writing the next task pair:
1. Pick the next ⬜ entry from `openspec/tasks-registry.md`
2. Create `openspec/tasks/ARCH-XXX/`
3. Write `task.md` — knowledge explanation for Builder
4. Write `testing.md` — knowledge explanation for Tester (with Lighthouse steps)
5. Present both to user
6. Wait for reports
7. Review → tick or reconcile

**Never** write implementation code. **Never** tell the Builder *how*. **Never** skip the Tester.

---

*Created: 2026-08-19 — this protocol is now active for all future tasks.*