# Reverse-Engineering Workspace

This workspace holds **all evidence of reverse-engineering work** for the Athletica rebuild.
Real deliverables (the new app's source) live in the repo, never here.

## Convention (adapted from the `reverse-engineering-agent` protocol)

Each capability we need to study becomes an **engagement**. Each engagement studies one or
more **samples** (cloned source repos). Each sample gets its own dated folder with the
agent's standard artifacts.

```
reverse-engineering-workspace/
  README.md                                      this file
  INDEX.md                                        registry of all engagements + status
  engagements/
    <NN-capability-slug>/
      <sample-slug>/
        <YYYY-MM-DD>/
          scope.md        authorization, ownership, mode, allowed actions
          sample.md       hash, size, type, provenance, handling
          analysis.md     static + dynamic notes (working record)
          report.md       what it does, evidence, conclusion, limits
          evidence/       command outputs, excerpts, hashes, screenshots
  samples/                                       cloned source repos (read-only)
    <sample-slug>/
```

## Rules (absolute)

1. **Ownership gate first.** No engagement starts without a `scope.md` recording the
   ownership basis. Open-source repos are studied under their declared licence (MIT,
   AGPLv3, etc.); we extract *rules and behaviour*, not copy code. Where a licence would
   impose obligations on redistribution (e.g. AGPLv3 copyleft), that obligation is noted
   and the build will not include verbatim code from that source.
2. **Static only.** We do not execute sample code in this workspace. `rg`, `ast-grep`,
   `file`, `readelf`, `nm`, `strings`, `xxd` only. No `npm install`, no `python -m`, no
   running the sample's binaries or scripts.
3. **No modifying originals.** Cloned repos in `samples/` are read-only. Any annotation
   or excerpt goes into the engagement's `evidence/` folder, never back into the sample.
4. **Evidence per claim.** Every finding in `report.md` cites a file path + line range
   (or a command + output excerpt in `evidence/`). Unsourced claims are opinions and
   marked as such.
5. **Three confidence words.** `confirmed` / `likely` / `not proven`. "Nothing found"
   is not "safe" — we say what was tested and what was not.
6. **Stack-agnostic.** Language is irrelevant. PHP, Rust, Ruby, Elixir, Go, Node — we
   study the most proven implementation of each capability and extract rules, then
   re-implement in our chosen stack.
7. **Workspace isolation.** The scopes, sample notes, reports, and evidence in this
   workspace **are** committed to the repo — they are the verification record other
   agents read to check every claim. `samples/` (the cloned source repos) is **not**
   committed: it is large and each clone carries its own `.git`. Evidence never ships
   as part of the product.

## Engagement order

Driven by what the affiliate marketplace needs, foundational first:

| # | Capability | Primary sample | Status |
|---|---|---|---|
| 01 | Short-link redirect + click tracking + bot filter + rate limit | YOURLS, Dub | reported |
| 02 | Affiliate tracking + commissions + payout workflow | Raider, Weferral | reported |
| 03 | ASIN → Amazon URL derivation + marketplace routing + dead-link detection | Amazon Auto Links | reported |
| 04 | Manual product catalog + admin CRUD + bulk import | Spree (Solidus — not studied) | reported |
| 05 | Multi-lock admin auth + RLS-at-DB | athletica/rollout (own), NextBase | reported |
| 06 | Privacy-first click analytics + visitor hashing | Plausible (Umami — not studied) | reported |
| 07 | Storefront UX — product grid, detail page, "Buy on Amazon" CTA | Vercel Commerce | reported |

See `INDEX.md` for live status.
