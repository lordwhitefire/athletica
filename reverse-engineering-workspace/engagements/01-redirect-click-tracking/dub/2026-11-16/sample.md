# Sample — Dub

## Identity

| Field | Value |
|---|---|
| Name | Dub (dubinc/dub) |
| Type | TypeScript monorepo (Turborepo + pnpm workspaces) |
| Version / commit | `6b463b4bdd9ed2fd9aa416f67b5b77d317b1471e` (2026-10-26 09:39:24 -0700) |
| Provenance | `git clone --depth 1 https://github.com/dubinc/dub.git` on 2026-11-16 |
| Licence | **AGPLv3** (open core); EE portions under separate commercial licence — `LICENSE.md` head confirms |
| Size | 21 MB |
| File count | 2,375 (excluding `.git/` and `node_modules/`) |

## Provenance handling

Shallow clone of the official `dubinc/dub` repository on GitHub. No fork, no mirror.
The `.git/` directory is retained for `git log` / `git blame` attribution during
static analysis. Working tree is read-only.

## Layout (top-level)

```
dub/
  apps/                Turborepo apps
  packages/            Shared packages (api, db, ui, analytics, …)
  LICENSE.md           AGPLv3 + EE notice
  README.md
  SECURITY.md
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  turbo.json
```

(Deeper layout to be filled during static analysis — primary targets are the redirect
edge route, the bot filter module, and the rate-limit module.)

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference source under AGPLv3. **Never copy verbatim code into our
build** — AGPLv3 §13 copyleft would force our entire app's source public on network
use. We extract rules and re-implement in fresh code. Excerpts copied into
`evidence/` are for understanding only, with their `file:line` citation.

## Open triage questions to resolve in static analysis

1. Where is the redirect edge route? (Likely `apps/web/app/[domain]/[key]/route.ts`
   or `apps/web/app/api/edge/links/...`. Confirm.)
2. Where is the bot filter? UA list? Behavioural checks? Is it on the edge?
3. Where is the rate limiter? Upstash Redis sliding window or token bucket? Per-IP
   or per-link? Thresholds?
4. How is a click event written — sync DB insert, Tinybird HTTP ingest, QStash queue?
5. Where is dead-link detection, if anywhere? Where is link expiry / disable?

These are the static-analysis work items. Each becomes an evidence block in
`evidence/excerpts.txt`.
