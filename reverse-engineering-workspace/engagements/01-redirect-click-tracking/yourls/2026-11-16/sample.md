# Sample — YOURLS

## Identity

| Field | Value |
|---|---|
| Name | YOURLS (Your Own URL Shortener) |
| Type | PHP source tree (PHP ≥ 7.4, tested through 8.6 per latest commit) |
| Version / commit | `b5b94b944b945ff91963ca02d456e48034e1778c` (2026-11-10 19:00:24 +0100) |
| Provenance | `git clone --depth 1 https://github.com/YOURLS/YOURLS.git` on 2026-11-16 |
| Licence | MIT — `LICENSE` file in sample root, head reads "MIT License — Copyright (c) 2009-present, The YOURLS Contributors" |
| Size | 14 MB |
| File count | 779 (excluding `.git/`) |

## Provenance handling

Shallow clone of the official `YOURLS/YOURLS` repository on GitHub. No fork, no mirror.
Cloned into `samples/YOURLS/` and treated as read-only from this point forward. The
`.git/` directory is retained only so that `git log` / `git blame` can attribute lines
during static analysis; the working tree is never modified.

## Layout (top-level)

```
YOURLS/
  admin/                  admin panel pages
  css/  js/  images/      static assets
  includes/               core library (Functions, Database, …)
  tests/                  PHPUnit suite (read, not run)
  user/                   plugins and themes
  yourls-go.php           REDIRECT ENTRY POINT — keyword → destination
  yourls-api.php          JSON API entry point
  yourls-infos.php        stats / info page entry point
  README.md  LICENSE  composer.json  phpunit.xml.dist
```

The three entry points (`yourls-go.php`, `yourls-api.php`, `yourls-infos.php`) are the
thin public surface. The substantive logic lives in `includes/`.

## Hash of the working tree (provenance anchor)

Computed on the directory listing of the top level so the sample can be re-identified
later without re-cloning. (Per the agent's rules, full-file SHA-256s are computed on
demand for evidence excerpts; the directory anchor is sufficient at triage.)

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference source. Never execute. Never `composer install`. Never
run the test suite. Excerpts are copied into the engagement's `evidence/` folder with
their source `file:line` citation; the original tree is never edited.

## Open triage questions to resolve in static analysis

1. Where is the redirect handler? (Likely `yourls-go.php` → `includes/Functions.php`
   `yourls_redirect()`. Confirm.)
2. Where are clicks recorded, and what schema? (`includes/YOURLS/Database/YOURLS.php`
   and a `log` table — confirm.)
3. Where is the bot filter implemented, and against what list?
4. Is there any rate limiting on the redirect endpoint, or only on the API?
5. How are unknown / disabled / self-referential keywords handled?

These are the static-analysis work items.
