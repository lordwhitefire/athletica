# ALIGN-01 — Full system alignment investigation

**Status:** 🟡 In progress — static half done; runtime evidence: `/` 200, `/shop` 200, `/admin/products` 200 with JI1092. A/B/E fixed; remaining runtime checks are in `findings.md`.
**Source:** `ATHLETICA-OPENSPEC-ALIGNMENT-DRAFT.md` — `REMAREMA6/deliverables`, reference revision
`19230dd621d48b98e88637e049e29eea43dccac2` (2026-11-17).
**Purpose:** establish what the system actually is, with evidence, before any architecture rewrite or
code fix. This is the investigation the draft asks for. It is not implementation.

## Why this is first

The draft lists eight conflicts between the product intent, the data model, the services, the UI,
and the reports. The architecture currently disagrees with the code in ways that are already proven:

- FM-01 is marked ✅, but the app does not start at all.
- The seven full-marketplace specs are prose, not OpenSpec deltas — `openspec validate --all` fails.
- Reports claim things the repository contradicts.

Fixing symptoms one at a time is guessing. This investigation replaces guesswork with evidence.

## Prerequisite — the server must be on

**Done 2026-11-17:** the gate is merged into `src/proxy.ts`, `src/middleware.ts` is removed, and
`next dev` is running on port 4252. `/` and `/shop` return 200 with the product;
`/admin/products` returns 200 with a valid door key + admin session, and 404 without a door
key. A/B/E are fixed; the remaining checks are in `findings.md` under "Still to check at
runtime".

The server is not the goal. It is the instrument: findings A, E, F and G cannot be settled by reading
files; they need a running app.

## Scope — the eight findings

| # | Finding | What must be established |
|---|---|---|
| A | The app does not build cleanly | The complete current set of TypeScript/build errors, their causes, which are symptoms of a deeper mismatch, and what a real green state means. |
| B | Data model and behaviour disagree | Whether types, validation, admin behaviour, public catalogue, and service contracts express one product lifecycle (draft/active/archived/proposed/rejected), plus price, variants, categories, collections, publication rules. |
| C | Schema access and affiliate boundaries | How each part accesses `rollout` vs `affiliate`; who owns each record; where user-level access control applies; where trusted server access is right. Confirm exposed schemas with the owner. |
| D | Payout-term enforcement | Trace the intended meaning of payout terms through decisions, data model, and financial flows. The cron branch and the RPC are known stubs — confirm what they actually do and what is missing. |
| E | UI and backend contracts | Check the current state again: bulk actions, CSV import, affiliate/payout workspaces, and any screen that implies behaviour the backend does not have. |
| F | Sign-in options | Google/GitHub remain visible, are not implemented, must say "coming soon", and must not start OAuth or imply success. |
| G | Change set vs report | Establish what the latest commit actually changed, whether the UI was touched, and whether report and diff agree. |
| H | Baseline reconciliation | Which patches, reports, and documents still apply; which are historical; what the real current baseline is. |

**Plus anything else found**, including the spec-format failure: the seven
`athletica-full-marketplace` specs have no `## ADDED Requirements` sections and no scenarios, so the
change cannot be validated, synced, or archived as written.

## Evidence required

- `npx tsc --noEmit` — the full error list, counted.
- `npx next build` (or the dev start) — the real build/runtime state.
- `git log`, `git show`, `git diff` — commit vs report; baseline for old patches.
- Live database, read-only: `npx supabase db query --db-url "$SUPABASE_DB_URL"` — schemas, columns,
  constraints, RLS enabled/forced, policies, function definitions.
- Route inventory — every page and API route, compared with what the UI calls.
- The running app — each behavioural finding checked in the browser.
- Owner-only: Supabase dashboard exposed schemas. Repository SQL cannot prove it.

## Output — the investigation is done when

1. A finding-by-finding table: **confirmed / partly correct / outdated / incorrect**, each with the
   evidence that settles it.
2. A list of important problems the draft did not list.
3. A proposed architecture/specification plan, per draft section 6:
   - the issues and specification gaps it proposes to address,
   - the intended outcome of each piece,
   - which documents and specs would change,
   - how the work groups into moments or phases, by real dependency,
   - dependencies, risks, unresolved questions, and owner decisions,
   - how we will know the architecture and specs are aligned when it is complete.
4. Nothing else.

## Review gate

Per draft section 7: **no application code, no database or migration change, no implementation, and
no specification rewrite** until the owner and reviewer approve the plan. The investigation itself is
read-only.

## Boundaries

- Do not edit `rollout/`.
- Do not run writes against the database; read-only queries only.
- Do not install packages.
- Do not trust a report. Verify it against the repository and the running app.
- Do not choose a technical solution before the evidence justifies it.
