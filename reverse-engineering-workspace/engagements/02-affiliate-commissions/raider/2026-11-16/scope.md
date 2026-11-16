# Scope — Engagement 02, Sample: Raider

**Date:** 2026-11-16
**Engagement:** 02 — Affiliate tracking + commissions + payout workflow
**Sample slug:** raider
**Mode:** A — open-source RE under licence, static only

## 1. The target

Raider (valeriansaliou/raider) — a high-performance affiliate tracking server written
in Rust on Rocket. Author is Valerian Saliou (also author of `rds` Cassandra driver
and other production Rust infra). 28 Rust source files, ~1.5 MB. Last commit
2026-10-09.

Local path: `reverse-engineering-workspace/samples/raider/`

## 2. The question

What are the **rules and behaviour** by which Raider models an affiliate system?

1. **Data model** — affiliates, campaigns, referrals, conversions, payouts. What
   entities exist and how are they linked?
2. **Commission types** — recurring / lifetime / one-time / fixed / percentage? Where
   is the rule encoded?
3. **Referral attribution** — how is a visitor tied to an affiliate? Cookie? URL
   param? IP fingerprint? Expiry?
4. **Conversion tracking** — server postback? Pixel? Webhook? How does Raider know a
   sale happened?
5. **Payout workflow** — payout requests, minimum thresholds, status transitions
   (pending → approved → paid → rejected), fraud checks.
6. **Affiliate self-service** — what does an affiliate see in their dashboard?
7. **Edge cases** — chargebacks, refunds, self-referrals, commission reversals.

## 3. Ownership basis (mode A — open source under MPL-2.0)

| Field | Value |
|---|---|
| Repository owner | Valerian Saliou |
| Licence | **MPL-2.0** (`LICENSE.md` confirmed) |
| Permission basis for RE | MPL-2.0 §3 permits use, modification, and distribution. We exercise the *reading and studying* right. |
| What we extract | Rules, behaviour, data models, state-machine transitions. |
| MPL-2.0 copyleft scope | **File-level** — if we copy Raider source files verbatim into our build, those files must remain MPL-2.0 and the source must be disclosed. We avoid this by re-implementing rules in fresh TypeScript. Pattern adaptation (not file copying) is unrestricted. |
| What we will NOT do | Copy Rust source files into our build. Run Raider. `cargo build`. Touch `target/`. |

**MPL-2.0 vs AGPLv3 (Dub):** MPL-2.0 is more permissive — file-level copyleft only,
no network-use trigger. We have more freedom here than with Dub, but we still
re-implement rules rather than transplants, for clarity and to keep our codebase
under one licence.

## 4. Mode

**A** — open-source software under a permissive-but-copyleft licence. Static
analysis only. No dynamic work, no lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `ast-grep`, plain `Read` on Rust source.
- **Dynamic analysis:** no. No `cargo`, no Rocket server run.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- Raider's performance characteristics (we reason from source, not benchmarks).
- Raider's deployment config (Docker, Debian packaging) — not relevant to our model.
- Raider's email notifier implementation (we'll use a different stack).

## 7. Tools present

`rg`, `ast-grep`, `file`, `xxd`, `strings`, `python3`, `node`. Rust source needs no
special tools for static reading.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if the sample turns out to be a
non-official fork; if copying code would be required to answer a question (then stop
— re-implement, don't copy).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.
