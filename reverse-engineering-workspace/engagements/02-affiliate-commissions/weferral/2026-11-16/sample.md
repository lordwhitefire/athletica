# Sample — Weferral

## Identity

| Field | Value |
|---|---|
| Name | Weferral (WeferralHq/weferral) |
| Type | React + webpack **dashboard frontend only** (no backend in this repo) |
| Version / commit | `cfaf9a093b31912970a17d4169ba57706212d9d6` (2024-06-28) |
| Provenance | `git clone --depth 1 https://github.com/WeferralHq/weferral.git` on 2026-11-16 |
| Licence | **MIT** (Copyright 2019 Tomasz O.) |
| Size | 11 MB |
| File count | 476 (excluding `.git/` and `node_modules/`) |

## Provenance handling

Shallow clone of the official `WeferralHq/weferral` repository on GitHub. No fork,
no mirror. Working tree read-only.

## Layout (top-level)

```
weferral/
  app/
    components/         shared UI components (Card, Nav, Sidebar, …)
    layout/              page layout chrome
    routes/
      Pages/
        Commission/      admin commission list page
        Campaign/        campaign list + field defs
        ParticipantCommision/   affiliate-facing commission view
        ParticipantPayout/     affiliate-facing payout view
      Forms/
        CreateCampaign/  the campaign form (the commission-type contract)
  build/                 webpack config
  config.js
  package.json           name = 'weferral-dashboard' (frontend only)
```

The `CreateCampaign` form and `Campaign/campaign-fields.js` are the two artifacts
that reveal the commission-type contract. `ParticipantPayout.js` reveals the
payout status field shape.

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference. MIT permits direct adaptation, but we re-implement
rules in fresh TypeScript for build consistency. **Critical caveat:** the backend
is NOT in this repo. We can only confirm what the UI *sends* and *expects* — the
actual calculation, validation, and state-machine logic is unobservable from
source here.

## Open triage questions

1. What fields does the `CreateCampaign` form POST to the backend?
2. Are `reward_type` and `commission_type` separate fields?
3. Is recurring commission bounded by a limit? What's the helper text?
4. Is `minimum_cash_payout` per-campaign or global?
5. Does the payout row carry `status` and `dateScheduledFor`? (Implies a state
   machine in the backend.)
