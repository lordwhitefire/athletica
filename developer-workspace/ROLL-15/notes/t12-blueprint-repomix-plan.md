# Plan — Blueprint, progress tracker, and agent repomix packs

**Date:** Mon Nov 16 2026
**Owner instruction:** apply blueprint skill; note current progress; pack four agents + their skills
with repomix; note in each pack that agent artifacts belong in their own workspace; keep evidence in
`developer-workspace/`, real output outside it.

---

## Part 1 — Blueprint

Apply the `blueprint` skill to the athletica project. Output: a blueprint assessment against the
80-area checklist, written to `developer-workspace/ROLL-15/notes/blueprint-athletica.md` (evidence
copy) with the real deliverable at `athletica/BLUEPRINT.md`.

## Part 2 — Progress tracker

Write a progress note covering everything done to date across all sub-projects (`rollout/`,
`frontend/`, `studio-athletica/`, `supabase/`), with ROLL-15's current state and remaining owner
actions. Output: `developer-workspace/PROGRESS.md`.

## Part 3 — Repomix packs (4 files, at `athletica/` root)

Each pack = agent `.md` file + every skill `SKILL.md` it references, with a header note that
artifacts must live in that agent's own workspace (no stray files). **Every agent must also record
evidence of its work** — commands run, files created, verification — in its own `developer-workspace/`.
Real deliverables go outside the workspace.

| # | Agent | Agent file (global) | Skills to include | Output file |
|---|---|---|---|---|
| 1 | Reverse-engineering | `~/.config/opencode/agent/reverse-engineering-agent.md` | `re-triage`, `re-static-analysis`, `re-dynamic-lab`, `re-reporting`, `re-external-references` | `athletica/repomix-re-agent.txt` |
| 2 | Product management | `~/.config/opencode/agent/product-management-agent.md` | `product-management-comprehend`, `-identify`, `-report`, `-cut`, `-list`, `-evaluate`, `-summarize` | `athletica/repomix-pm-agent.txt` |
| 3 | Openspec architect | `~/.config/opencode/agent/openspec-architect.md` | `openspec-propose`, `openspec-apply-change`, `openspec-update-change`, `openspec-sync-specs`, `openspec-archive-change`, `openspec-explore` | `athletica/repomix-openspec-agent.txt` |
| 4 | Developer | `~/.config/opencode/agent/developer-agent.md` | (inline in agent file — no separate skill dirs) | `athletica/repomix-dev-agent.txt` |

**Method:** create a repomix config per agent (include = agent file + skill dirs, output = the file
above), run `repomix --config`, then prepend a header block covering both rules: artifacts in own
workspace, evidence in own workspace, deliverables outside.

## Part 4 — Evidence

Everything I did — commands run, files created, verification — recorded in
`developer-workspace/ROLL-15/notes/repomix-packs-evidence.md`. The real deliverables (packs,
blueprint, progress) go at `athletica/` root, outside the workspace.

---

## Order

1. Blueprint (Part 1)
2. Progress tracker (Part 2)
3. Four repomix packs (Part 3)
4. Evidence log (Part 4)

One commit at the end, nothing pushed.