# Scope — Engagement 01, Sample: YOURLS

**Date:** 2026-11-16
**Engagement:** 01 — Short-link redirect + click tracking + bot filter + rate limit
**Sample slug:** yourls
**Mode:** A — own-software-style RE on open-source code under licence

## 1. The target

YOURLS (Your Own URL Shortener) — a self-hosted PHP URL shortener that has been in
continuous production use since 2009 and is deployed by hundreds of thousands of sites.
Cloned from the official repository `https://github.com/YOURLS/YOURLS.git` at
shallow depth on 2026-11-16.

Local path: `reverse-engineering-workspace/samples/YOURLS/`

## 2. The question

What are the **rules and behaviour** by which YOURLS:

1. Resolves a short keyword to its destination URL and issues a redirect.
2. Records a click event for that redirect.
3. Filters bot / crawler traffic out of click counts.
4. Enforces rate limits (if any) on the redirect endpoint.
5. Handles edge cases: unknown keyword, expired/disabled links, redirects to itself,
   malicious destinations, geo-routing, custom redirects per user-agent or IP.

We extract rules and behaviour, not code. YOURLS is **MIT licensed**, so we *may* study
the source freely and may even adapt snippets into the new app with attribution. The
obligation is documented; the build decision comes later.

## 3. Ownership basis (mode A — open source under licence)

| Field | Value |
|---|---|
| Repository owner | The YOURLS Contributors |
| Licence | MIT (see `LICENSE` in sample root) |
| Licence obligations | Retain copyright notice + permission notice in any substantial copy/adaptation |
| Permission basis for RE | MIT explicitly permits "use, copy, modify, merge, publish, distribute, sublicense" — reading the source to extract rules is fully within this grant |
| What we will extract | Rules, behaviour, data-flow patterns, edge-case handling |
| What we will NOT do | Run the sample; redistribute the source; claim authorship of YOURLS code |

## 4. Mode

**A** — open-source software under a permissive licence. No malware lab, no dynamic
analysis, no third-party target. Static analysis only.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `ast-grep`, `file`, `readelf`, `nm`, `strings`, `xxd`,
  plain `Read` of source files.
- **Dynamic analysis:** no. We will not run YOURLS or any of its scripts. No `composer
  install`, no PHP execution, no test suite run.
- **Network:** no. Sample is fully local; no outbound calls.
- **Modify original:** no. Sample in `samples/YOURLS/` is read-only. Excerpts and
  annotations go only into the engagement's `evidence/` folder.
- **Patch / forward-engineer:** no. This engagement is extract-rules-and-report only.
  Any build on these rules happens in the repo, not here.

## 6. Out of scope

- YOURLS's admin UI design (we have a separate engagement for storefront/admin UX).
- YOURLS's plugin system (we extract the redirect + tracking rules, not the extension
  mechanism — unless a rule depends on it).
- Performance benchmarking (we reason from the code, not from a running instance).
- Comparison with other samples in this engagement (Dub comes later, comparison is in
  the consolidated `report.md`).

## 7. Tools present

`rg`, `ast-grep`, `file`, `xxd`, `strings`, `readelf`, `nm`, `objdump`, `python3`,
`node`. `gdb`, Ghidra, radare2 absent — not needed for a PHP source tree.

## 8. Stop conditions

Stop and say what is missing if: a rule cannot be supported by a file:line citation;
the sample is found to be a non-official fork; the licence is found to differ from MIT;
or a question requires dynamic analysis (then mark it `not proven` and list what a lab
run would add).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
