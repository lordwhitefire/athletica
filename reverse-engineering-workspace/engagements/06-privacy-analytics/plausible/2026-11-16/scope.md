# Scope — Engagement 06, Sample: Plausible

**Date:** 2026-11-16
**Engagement:** 06 — Privacy-first click analytics + visitor hashing
**Sample slug:** plausible
**Mode:** A — open-source RE under licence, static only

## 1. The target

Plausible (plausible/analytics) — a privacy-first, Google-Analytics-free,
open-source web analytics platform. Elixir + Phoenix backend, JS tracker, ClickHouse
analytics store. ~21k GitHub stars. Last commit today (2026-11-16). 33 MB,
2,153 files.

Local path: `reverse-engineering-workspace/samples/plausible/`

## 2. The question

Engagement 01 (Dub) gave us click tracking at scale. Engagement 06 asks: how does
a privacy-first analytics platform hash visitors without cookies, and how does it
filter bots without a hand-maintained list?

1. **Visitor hashing** — how is a visitor identified without cookies? What goes
   into the hash? How is the salt managed? Is it rotated? What's the grace
   window?
2. **Bot filtering** — hand-maintained UA list (like Dub) or a maintained library?
   Any explicit overrides?
3. **Event schema** — what's in a click/pageview event? Client-side payload vs
   server-side enrichment?
4. **Drop reasons** — how many ways can an event be dropped? Are they named +
   counted?
5. **IP resolution** — how does the server get the visitor's real IP behind
   Cloudflare / proxies?
6. **Privacy guarantees** — what makes it "privacy-first"? No cookies, no
   fingerprinting, salt rotation, cross-site unlinkability?

## 3. Ownership basis (mode A — AGPLv3)

| Field | Value |
|---|---|
| Repository owner | Plausible HQ OÜ |
| Licence | **AGPLv3** (`LICENSE.md` confirms) |
| Permission basis for RE | AGPLv3 permits use, study, modification. We exercise *study*. |
| What we extract | Visitor hash formula, salt rotation pattern, bot filter strategy, event schema, drop-reason enum, IP resolution priority chain. |
| What we will NOT do | Copy Elixir/JS source into our build (AGPLv3 §13 copyleft would force our app AGPLv3). Run Phoenix. `mix`. |

## 4. Mode

**A** — open source under strong copyleft. Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on Elixir + JS source.
- **Dynamic analysis:** no. No `mix`, no Phoenix server.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- Plausible's full dashboard UI (separate engagement for storefront/admin UX).
- Plausible's billing/subscription logic.
- Plausible's stats query layer (ClickHouse SQL).
- The EE-licensed features (we extract the core only).

## 7. Tools present

`rg`, `find`, `file`, `python3`, `node`. Sufficient for Elixir + JS source.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if copying code would be
required (then stop — re-implement, don't copy, per AGPLv3).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
