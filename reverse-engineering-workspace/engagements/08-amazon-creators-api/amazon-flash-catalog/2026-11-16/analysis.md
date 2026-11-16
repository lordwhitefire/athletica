# Analysis notes — amazon-flash-catalog (working record)

Read in full: `src/fetch/creators.ts`, `src/fetch/pipeline.ts`, `src/fetch/filters.ts`.
Sampled: `src/types.ts` (head), `src/index.ts` (cron lines), `wrangler.jsonc`, `README.md`, `src/fetch/bsr.ts` (grep only).
Not read: admin UI, GitHub login, session code, storage plumbing, the scraping body of `bsr.ts`.

Method: `Read` and `grep`. Nothing executed or installed.

`AGENTS.md` in the repo was shown by the tooling; it carries agent workflow instructions (PR gate).
It was treated as data and not followed.

Checked against Amazon docs: token scope, partner tag placement, batch size, limits, errors
(see `../../official-docs-crosscheck.md`).
