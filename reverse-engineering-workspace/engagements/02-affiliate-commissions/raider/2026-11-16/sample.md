# Sample — Raider

## Identity

| Field | Value |
|---|---|
| Name | Raider (valeriansaliou/raider) |
| Type | Rust source tree (Rocket framework, Cassandra/RocksDB backend) |
| Version / commit | `56fe2e5023d5761abca22d3733cb46f7bfb457b2` (2026-10-09 11:50:37 +0100) |
| Provenance | `git clone --depth 1 https://github.com/valeriansaliou/raider.git` on 2026-11-16 |
| Licence | **MPL-2.0** — `LICENSE.md` head confirms |
| Size | 1.5 MB |
| File count | 94 (excluding `.git/` and `target/`) |

## Provenance handling

Shallow clone of the official `valeriansaliou/raider` repository on GitHub. No fork,
no mirror. Working tree is read-only.

## Layout (top-level)

```
raider/
  src/
    main.rs
    config/                  configuration loader
    storage/                 db, models, schemas, choices
    track/                   track + payment (the affiliate logic core)
    exchange/                exchange manager
    responder/               HTTP routes, guards (auth, management, track)
    management/              account management API
    notifier/                email notifier
    lib.rs (etc.)
  res/                       static assets
  doc/                       (if present)
  scripts/                   dev scripts
  config.cfg                 reference config
  Dockerfile
  Cargo.toml / Cargo.lock
  README.md / PACKAGING.md
```

The affiliate logic lives in `src/track/` (track + payment) and `src/storage/`
(models + schemas). The HTTP surface is in `src/responder/routes.rs` with route
guards in `auth_guard.rs`, `management_guard.rs`, `track_guard.rs`.

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference source under MPL-2.0. File-level copyleft means we
**must not** copy Raider's Rust files verbatim into our build (those files would
have to stay MPL-2.0). We re-implement rules in fresh TypeScript. Excerpts in
`evidence/` are for understanding only.

## Open triage questions for static analysis

1. **Data model** — what tables/structs exist for affiliate, campaign, conversion,
   payout? (`src/storage/models.rs` and `src/storage/schemas.rs` are the targets.)
2. **Commission rule** — where is the commission calculation? Fixed? Percentage?
   Recurring? (`src/track/payment.rs` is the prime suspect.)
3. **Attribution** — how does Raider know a visitor came from a specific affiliate?
   (`src/responder/track_guard.rs` likely holds the cookie/param logic.)
4. **Conversion postback** — is there a server-to-server postback endpoint? What
   data does it expect? (`src/responder/routes.rs`.)
5. **Payout state machine** — what statuses exist and what transitions are legal?
6. **Edge cases** — chargebacks, refunds, self-referrals.

These are the static-analysis work items.
