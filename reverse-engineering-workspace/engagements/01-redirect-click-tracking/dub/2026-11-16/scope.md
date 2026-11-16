# Scope — Engagement 01, Sample: Dub

**Date:** 2026-11-16
**Engagement:** 01 — Short-link redirect + click tracking + bot filter + rate limit
**Sample slug:** dub
**Mode:** A — open-source RE under licence, static only

## 1. The target

Dub (dubinc/dub) — an open-source link attribution platform that powers 250M+ clicks
and 12M+ links per month. Used by Twilio, Zillow, Vercel, Raycast. Next.js + Prisma +
PlanetScale (MySQL) + Upstash Redis + Tinybird (analytics) + NextAuth. Turborepo
monorepo. Last commit 2026-10-26.

Local path: `reverse-engineering-workspace/samples/dub/`

## 2. The question

YOURLS gave us the redirect + synchronous click-log spine. Dub answers the gaps:

1. **Bot filtering** — how does Dub classify and exclude bots at 250M clicks/month scale?
   UA list, behavioural signals (dwell time, JS challenge), or both?
2. **Rate limiting on the redirect endpoint** — Upstash Redis sliding window? Per-IP or
   per-link? What are the thresholds?
3. **Click pipeline** — are clicks written synchronously (like YOURLS) or queued
   (Tinybird ingestion, background worker, QStash)? At Dub's scale the latter is likely.
4. **Edge runtime** — Dub deploys the redirect on Vercel Edge. What does that constrain
   (no Node APIs, GeoIP from request header, etc.)?
5. **Edge cases** — dead-link detection, link expiry/disable, custom redirects per
   geo/UA.

## 3. Ownership basis (mode A — open source under AGPLv3)

| Field | Value |
|---|---|
| Repository owner | Dub Technologies, Inc. |
| Licence | **AGPLv3** for the open-core repo (`LICENSE.md` confirmed); portions under `apps/web/app/(ee)/` are under a separate commercial EE licence |
| Permission basis for RE | AGPLv3 §5–7 permit reading, studying, modifying, and running the source. We exercise only the *reading and studying* rights. |
| What we extract | **Rules, behaviour, data-flow patterns, edge-case handling, configuration thresholds.** Stack-agnostic patterns we will re-implement in our own code. |
| What we will NOT do | **No verbatim code copy.** AGPLv3 §13 network-use copyleft would require us to release our full app source under AGPLv3 if we adapt substantial portions and deploy it. Our build will re-implement the rules in fresh code, not vendor Dub's source. |
| What we will NOT do (cont.) | Run Dub; `pnpm install`; execute any of its scripts; touch the EE-licensed directories except to read their structure for pattern reference. |

**This is the critical difference from the YOURLS engagement (which was MIT):** we are
extracting *rules*, not code. Every excerpt in `evidence/` is for understanding, not
for transplanting. The build's commit messages will need to record "rule derived from
Dub, re-implemented in fresh code" if any Dub pattern is closely followed.

## 4. Mode

**A** — open-source software under a strong copyleft licence. Static analysis only.
No dynamic work, no lab. The EE portions are studied for *behaviour shape* only (e.g.
"the analytics dashboard pulls from Tinybird" — we note the pattern, we don't read
or copy the EE source).

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `ast-grep`, plain `Read`. Turborepo monorepo, so
  paths under `apps/`, `packages/`.
- **Dynamic analysis:** no. No `pnpm install`, no Next.js build, no edge function
  invocation.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.
- **EE-licensed directories:** read top-level structure only for behaviour shape;
  do not read EE source files in depth. Their existence and routing is noted; their
  code is not.

## 6. Out of scope

- Dub's full dashboard UI (we have a separate engagement for storefront/admin UX).
- Dub's billing/subscription logic (not relevant to our model).
- EE features we'd never build (SAML SSO, etc.).
- Performance benchmarking (we reason from source, not from a running instance).

## 7. Tools present

`rg`, `ast-grep`, `file`, `xxd`, `strings`, `readelf`, `nm`, `objdump`, `python3`,
`node`. All sufficient for a TypeScript/Next.js source tree.

## 8. Stop conditions

Stop and say what is missing if: a rule cannot be supported by `file:line`; the sample
turns out to be a non-official fork; a question requires dynamic analysis (then mark
`not proven` and list what a run would add); or copying code would be required to
answer the question (then stop — we re-implement, we don't copy).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
