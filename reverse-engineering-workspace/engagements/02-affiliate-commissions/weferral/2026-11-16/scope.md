# Scope — Engagement 02, Sample: Weferral

**Date:** 2026-11-16
**Engagement:** 02 — Affiliate tracking + commissions + payout workflow
**Sample slug:** weferral
**Mode:** A — open-source RE under licence, static only
**Scope note:** narrow engagement — commission-type variety only (the gap Raider left).

## 1. The target

Weferral (WeferralHq/weferral) — an affiliate program dashboard. Last commit
2024-06-28. 11 MB, 476 files. **Frontend-only** (React + webpack; `package.json`
name is `weferral-dashboard`). The backend API that actually computes commissions
is in a separate, unavailable repo.

## 2. The question

Raider (the previous sample in this engagement) supports only **percentage,
one-time** commissions, with the rate stored on the affiliate account. Weferral's
README claims: *"Recurring or lifetime, One-time commissions, Monthly
commissions, Fixed or percentage-based commission."*

We want to confirm what the **UI contract** reveals about the commission-type
model, since the backend is not in this repo. Specifically:

1. What commission fields live on the **campaign** (not just the affiliate)?
2. Is recurring commission a toggle? Is it bounded by a transaction limit?
3. Is the payout minimum per-campaign or global?
4. Does the payout row carry a status field with a real state machine?

## 3. Ownership basis (mode A — MIT)

| Field | Value |
|---|---|
| Repository owner | WeferralHq (Copyright 2019 Tomasz O.) |
| Licence | **MIT** (`LICENSE` head confirms) |
| Permission basis for RE | MIT permits unrestricted use, study, modification, distribution. We exercise *study*. |
| What we extract | UI field contract; commission-type enum; campaign-level schema as implied by forms + table columns. |
| What we will NOT do | Run the dashboard; `npm install`; claim the README's "lifetime/recurring/monthly" claims are implemented without UI evidence. |

**MIT is the most permissive licence we've encountered** — we could even adapt
code directly. But we still re-implement rules in fresh TypeScript for consistency
with the rest of the build.

## 4. Mode

**A** — open source under a permissive licence. Static only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, plain `Read` on React/JS source.
- **Dynamic analysis:** no. No `npm install`, no webpack build.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope (deliberately narrow)

- Weferral's UI component design (we have a separate engagement for storefront/admin UX).
- Weferral's auth flow (Raider + our own athletica/rollout cover this).
- The backend API contract beyond what the UI implies (the backend is not in repo).
- Performance, deployment, theming.

## 7. Stop conditions

Stop if a UI claim cannot be supported by `file:line`; if the README's claims
(recurring/lifetime/monthly) are not backed by UI code, mark them `not proven`
and say so plainly.

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
