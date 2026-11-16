# Evidence — repomix agent packs

**Date:** Mon Nov 16 2026

## What was done

1. Located all four agent files at `/home/lordwhitefire/.config/opencode/agent/`:
   - `reverse-engineering-agent.md`
   - `product-management-agent.md`
   - `openspec-architect.md`
   - `developer-agent.md`

2. Located all skill directories at `/home/lordwhitefire/.config/opencode/skills/`:
   - RE: `re-triage`, `re-static-analysis`, `re-dynamic-lab`, `re-reporting`, `re-external-references`
   - PM: `product-management-comprehend`, `-identify`, `-report`, `-cut`, `-list`, `-evaluate`, `-summarize`
   - Openspec: `openspec-propose`, `openspec-apply-change`, `-update-change`, `-sync-specs`, `-archive-change`, `-explore`

3. Created four repomix config files at `athletica/` root:
   - `repomix-re-agent.config.json`
   - `repomix-pm-agent.config.json`
   - `repomix-openspec-agent.config.json`
   - `repomix-dev-agent.config.json`

3. Ran `repomix --config` for each — all succeeded.

4. Output files created at `athletica/` root:
   - `repomix-re-agent.txt` (41,871 bytes)
   - `repomix-pm-agent.txt` (42,256 bytes)
   - `repomix-openspec-agent.txt` (82,547 bytes)
   - `repomix-dev-agent.txt` (17,343 bytes)

5. Prepended header to each:
   ```
   === AGENT RULES ===
   Every artifact this agent creates must live in its own developer-workspace/ directory.
   Every agent must record evidence of its work (commands run, files created, verification)
   in its own developer-workspace/. Real deliverables go outside the workspace.
   No stray files anywhere.
   ```

## Verification

- All four files exist and are non-empty
- Each contains the agent definition + skill content
- Header prepended to each
- Nothing pushed