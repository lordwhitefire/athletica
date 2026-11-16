# Changelog Gen 001 — Tool Guarding & Narrative Contradictions

> Date: 2026-07-15
> Scope: WebForge verification tool rewrite + 56 agent file narrative fixes

---

## Tool: `verify_work.ts` — Full Rewrite

**Error:** The existing `verify_work.ts` was a sign-off recorder (storing PASS/FAIL decisions), not the 5-action verification tool the supervisors needed.

**Fix:** Rewrote from scratch with 5 fixed safe-check actions:

| Action | What it does |
|---|---|
| `run_tests` | Runs `npm test`, returns pass/fail + output |
| `run_lint` | Runs linter, returns errors/warnings |
| `check_diff` | Shows `git diff` for a given file/folder |
| `check_build` | Runs production build, returns result |
| `compare_screenshot` | Compares before/after via ImageMagick, shows pixel diff |

### Bug 1 — compare_screenshot pixel count shows "unknown"

**Error:** `compare -metric AE` outputs pixel count to stderr. The shell redirect `2>&1` sent it to stdout. When images differ (exit ≠ 0), `execSync` threw, and the catch block read `e.stderr` — which was empty (redirected). Result: "Pixels different: unknown" instead of the real count.

**Fix:** Removed `2>&1`. The catch block now reads `e.stderr` directly (which ImageMagick uses for `-metric AE` output). Verified: same-image diff = 0 pixels, different-image diff = 662666 pixels.

### Bug 2 — Import style mismatch

**Error:** Used top-level `import { execSync }` and `require("fs")`/`require("path")` inside functions, inconsistent with `memory.ts`/`registry.ts` which use dynamic `import()` throughout.

**Fix:** Removed all top-level imports and `require()` calls. All imports (`execSync`, `fs`, `path`, `os`, `isWebForgeAgent`) are now dynamic `await import()` inside `execute()`.

### Bug 3 — Missing WebForge Tool Guard

**Error:** No `isWebForgeAgent()` check. Any agent (including non-WebForge) could call `verify_work`. The `memory.ts` tool has this guard; `verify_work.ts` was missing it.

**Fix:** Added `isWebForgeAgent(fs, path, callerAgent, webforgeRoot)` guard at the top of `execute()`. The guard walks up from the resolved project path to find the nearest `.webforge/agents.json` with real agent entries (skipping auto-generated stubs like `{ "agents": [] }`).

### Path Resolution Fix

**Error:** `resolveProjectPath()` used `active-project.txt` path as first priority, but the active project (`/home/lordwhitefire/current-project/athletica`) has no `package.json`. The frontend subdirectory has `package.json` but an auto-generated empty `.webforge/`. This caused "No package.json found" errors.

**Fix:** Path resolution now checks candidates in order (active-project.txt → cwd) and returns the first one with a `package.json`. The guard separately walks up from that path to find the real `.webforge/agents.json`.

---

## Agent Narrative Fixes — Lead-* (20 files)

**Error:** 20 `lead-*.md` agents have `safe_edit: deny`, `safe_bash: deny` in YAML (correct — supervisors shouldn't edit), but their narrative says:
- Review checklist: "run `bun run lint` via safe_bash"
- Law table: "Law 2: No file over 300 lines → `safe_edit`"
- Tools Available: lists `safe_edit`, `safe_bash`

**Fix:** Replaced all 4 narrative references per file (80 total replacements):
| Before | After |
|---|---|
| `run \`bun run lint\` via safe_bash` | `use \`verify_work({ action: "run_lint" })\` to check` |
| Law 2: `\| \`safe_edit\` \|` | `\| \`read\` + \`verify_work\` \|` |
| Law 3: `\| \`safe_edit\` logs \|` | `\| \`memory\` \|` |
| Tools: `\`safe_edit\`, \`safe_bash\`` | `\`verify_work\` (for review/compile checks)` |

**Files:** lead-aegis, lead-archive, lead-basin, lead-canyon, lead-chapter, lead-crest, lead-critique, lead-faro, lead-folio, lead-gorge, lead-marina, lead-medic, lead-scribe, lead-spark, lead-stratus, lead-terra, lead-tide, lead-veritas, lead-volume, lead-zen

---

## Agent Narrative Fixes — Rook/Weld (2 files)

**Error:** Last-in-chain HR workers have `edit: deny`, `bash: deny` in YAML but their narrative tells them to use `safe_edit`/`safe_bash`. YAML permission denies the very tools they need.

**Fix:**
1. YAML: `edit: deny` → `edit: allow`, `bash: deny` → `bash: allow`
2. Narrative: `safe_edit` → `edit`, `safe_bash` → `bash` across all sections (review checklist, implementation steps, Law table, Tools Available, Permission Assignment knowledge)
3. `safe_bash({ command: "bun run lint" })` → `bash({ command: "npm run lint" })`

**Files:** rook.md, weld.md

---

## Agent Narrative Fixes — Probe/Odin (34 files, previous session)

**Error:** Intelligence workers (probe-*/odin-* variants) have `safe_edit: deny`, `memory: allow` in YAML but narrative tells them to use `safe_edit`/`safe_bash` to record findings.

**Fix:** Replaced all `safe_edit`/`safe_bash` narrative references with `memory({ action: "write", file: "research/<area>-findings.md", ... })`.

**Files:** probe-* (17 variants), odin-* (17 variants)

---

## Overall Stats

| Metric | Value |
|---|---|
| Tool files rewritten | 1 (`verify_work.ts`) |
| Agent files fixed | 244 (across all batches) |
| Total narrative replacements | 500+ |
| Clean files (no YAML/narrative contradictions) | 306 / 306 ✅ |
| Remaining contradictions | **0** — all resolved |

### Batch Summary

| Batch | Files | Pattern Applied |
|---|---|---|
| Probe/Odin variants | 34 | narrative `safe_edit`/`safe_bash` → `memory` |
| Lead-* (team leads) | 20 | narrative `safe_edit`/`safe_bash` → `verify_work` + `read` |
| Rook/Weld (HR workers) | 2 | YAML `edit: allow`, `bash: allow`; narrative → `edit`/`bash` |
| Jr-* (juniors, 49) + Meta (4) | 53 | narrative `safe_edit`/`safe_bash` → `edit`/`bash` |
| Quality variants (verdict, janus, pixel, sentry, scalpel, pulse, patch — 108) | 108 | YAML `edit: deny` → `edit: allow`; narrative → `edit`/`bash` |
| Sr-* (seniors, 11) + Directors (9) | 20 | narrative → `verify_work` + `read` |
| System Doc (annotator/archivist/chronicler/scribe) | 4 | reverted buggy `edit`/`bash` → back to correct `safe_edit`/`safe_bash` |
| Clio (System Doc head) + Dorian (Intel director) | 2 | Law/Tools descriptive refs → `verify_work`/`read`/`memory` |
| CEO | 1 | YAML `edit: allow`, `bash: allow`; narrative → `edit`/`bash` |
| **Total** | **244 agent + 1 tool** | |
