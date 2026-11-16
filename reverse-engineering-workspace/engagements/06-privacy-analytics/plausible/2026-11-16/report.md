# Report — Engagement 06, Sample: Plausible

**Engagement:** 06 — Privacy-first click analytics + visitor hashing
**Sample:** Plausible (plausible/analytics), Elixir + Phoenix, AGPLv3
**Commit analysed:** `aa48a053e7387acde2d2d58aba358e54031250fd` (2026-11-16)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

Plausible is **AGPLv3**. Strong copyleft — no verbatim code transplant (would
force our app AGPLv3). Extract rules only; re-implement in fresh TypeScript.

## 1. What is it?

A privacy-first, cookie-free, Google-Analytics-free open-source web analytics
platform. ~21k GitHub stars. Elixir + Phoenix backend, JS tracker, ClickHouse
analytics store. Last commit today. 33 MB, 2,153 files.

## 2. What does it do? (rules and behaviour)

### 2.1 Visitor hash formula — the privacy innovation

`lib/plausible/ingestion/event.ex:566-595`:

```
user_id = SipHash64(salt, user_agent + remote_ip + domain + root_domain + replay_session_id)
```

**Rule (confirmed):** five inputs:
1. `salt` — the rotating salt (current or previous)
2. `user_agent` — full UA string
3. `remote_ip` — visitor IP (after header resolution)
4. `domain` — the tracked site domain
5. `root_domain` — registrable domain (via PublicSuffix)
6. `replay_session_id` — optional session-replay ID (EE only; empty string in OSS)

**Rule (confirmed — cross-site unlinkability):** the hash includes `domain` +
`root_domain`. The same visitor on two different Plausible-tracked sites gets
**two different hashes**. Sites cannot collude to de-anonymize a visitor by
comparing hash sets. Strongest privacy guarantee short of not storing any
identifier.

**Rule (confirmed):** hash function is **SipHash** (fast, cryptographically-keyed,
non-cryptographic). Resistant to collision attacks, appropriate for an identifier
that needs to be stable within a salt window but unlinkable across windows.

**Rule (confirmed):** hash output is 64-bit, stored as `UInt64` in ClickHouse
(`clickhouse_session_v2.ex:39`). Not a hex string — ~50% smaller, faster to
index/join. Use `BIGINT` in Postgres.

### 2.2 Salt rotation — the unlinkability guarantee

`lib/plausible/session/salts.ex` (96 lines, full). A GenServer manages two salts:
`current` and `previous`.

**Rule (confirmed):**
- **Interval:** every 90 seconds (configurable).
- **Two valid salts at any time:** `current` (just rotated) and `previous` (the
  one before).
- **Salt generation:** 16 random bytes via `:crypto.strong_rand_bytes(16)`.
- **Persistence:** each salt INSERTed into a `salts` table with `inserted_at`.
- **Cleanup:** salts older than 48 hours are DELETEd.
- **Cache:** salts cached in ETS (`:protected`, `{:read_concurrency, true}`) for
  fast lock-free reads from ingestion workers.

**Rule (confirmed — grace window):** `put_user_id` hashes with `salts.current`.
`register_session` *also* generates `previous_user_id` with `salts.previous` and
passes it to the persistor. The persistor tries `current_user_id` first; if no
session matches, tries `previous_user_id`. This gives a **one-rotation (90s) grace
window** where a visitor whose salt rotated between two events is still linked to
the same session.

**Rule (confirmed — unlinkability):** because the salt rotates every 90s and old
salts are deleted after 48h, an attacker who captures today's hashes cannot link
them to next week's. Stable within 90s, linkable across the grace window, then
permanently unlinkable.

### 2.3 Bot filtering — UAInspector library + explicit overrides

`lib/plausible/ingestion/event.ex:255-285`:

```elixir
case parse_user_agent(event.request) do
  {:ok, %UAInspector.Result{client: %UAInspector.Result.Client{name: "Headless Chrome"}}} ->
    drop(event, :bot)

  {:ok, %UAInspector.Result.Bot{}} ->
    drop(event, :bot)

  {:ok, %UAInspector.Result{} = user_agent} ->
    update_session_attrs(event, %{...})

  _any ->
    event
end
```

**Rule (confirmed):** bot detection uses the **`UAInspector`** Elixir library — a
maintained UA-database parser, NOT a hand-maintained string list like Dub's.
UAInspector classifies each UA as `Result.Bot` (known crawler) or `Result.Client`
(real browser). Both paths handled.

**Rule (confirmed — explicit override):** even when UAInspector classifies a UA
as `Result.Client`, Plausible explicitly drops **Headless Chrome** by checking
`client.name == "Headless Chrome"`. Hand-maintained override for a known-evasive
pattern the library misses (Puppeteer/Playwright-driven scraping).

**Rule (confirmed):** if the UA cannot be parsed (`_any` clause), the event is
**NOT dropped** — accepted with no UA enrichment. Opposite of Dub's "if no UA,
treat as bot." For affiliate analytics, Plausible's stance is correct — rather
over-count than under-count a real visitor with an odd UA.

### 2.4 The drop_reason enum (15 named reasons)

`lib/plausible/ingestion/event.ex:24-40`:

```elixir
@type drop_reason() ::
  :bot | :spam_referrer | GateKeeper.policy() | :invalid | :dc_ip |
  :threat_ip | :site_ip_blocklist | :site_country_blocklist |
  :site_page_blocklist | :site_hostname_allowlist | :verification_agent |
  :lock_timeout | :no_session_for_engagement | :persist_timeout |
  :persist_error | :persist_decode_error
```

**Rule (confirmed):** every drop reason is a **named atom**, not a string.
Telemetry per reason (`emit_telemetry_dropped(event, reason)`) — you can count
"N events dropped for :bot, M for :dc_ip, K for :spam_referrer" in one grouped
query. Observability is built-in.

Notable reasons:
- `:dc_ip` — datacenter IP (drops AWS/GCP/Azure ranges; real users don't browse
  from datacenters)
- `:threat_ip` — known threat IP from a threat-intel feed
- `:spam_referrer` — known spam referrer from a blocklist
- `:verification_agent` — Plausible's own site-verification crawler

### 2.5 IP resolution priority chain

`lib/plausible_web/remote_ip.ex:6-37`. The order:

1. `x-plausible-ip` — Plausible's own header (trusted proxy setups)
2. `cf-connecting-ip` — Cloudflare
3. `x-forwarded-for` — generic proxy (first IP in the chain)
4. `b-forwarded-for` — Bunny CDN
5. `forwarded` — RFC 7239 standard
6. `conn.remote_ip` — fallback to socket peer IP

**Rule (confirmed):** handle ALL CDN/proxy headers, not just `x-forwarded-for`.
Order matters — a spoofed `x-forwarded-for` should NOT override Cloudflare's
`cf-connecting-ip` when behind Cloudflare.

**Rule (confirmed):** the function strips the port from IPv4 and IPv6 addresses
via a regex. Important because ClickHouse / hashing may not handle
`1.2.3.4:5678` cleanly.

### 2.6 Client-side payload — privacy-first design

`tracker/src/track.js:1-80`. The payload sent to `/api/event` is minimal:

```javascript
payload.n = eventName          // 'pageview' or custom event name
payload.u = URL                 // the page URL
payload.r = document.referrer    // referrer (or null)
payload.p = options.props        // custom props
payload.h = hostname             // the site hostname
```

**Rule (confirmed — no client-side cookies):** the tracker sets **NO cookies**,
reads NO localStorage for identification, generates NO client-side fingerprint.
The visitor identifier is computed SERVER-SIDE from `IP + UA + domain + salt`.
Client sends only what the server cannot know (URL, referrer, props).

**Rule (confirmed):** client-side exclusion via `localStorage.plausible_ignore`
flag + path matcher for excluding specific paths (`/admin/*`).

### 2.7 The server-side enrichment pipeline

`lib/plausible/ingestion/event.ex:130-180`. A sequence of `put_*` functions:

1. `put_user_agent` — parse UA, drop bots, extract OS/browser/screen_size
2. `put_basic_info` — domain, site_id, timestamp, event_name
3. `put_user_id` — compute visitor hash with `salts.current`
4. `put_salts` — attach salts map (for grace-window retry)
5. `put_props` — custom event props
6. `put_hostname`, `put_pathname`, `put_referrer`, `put_utm_params`
7. `put_geo` — GeoIP lookup
8. `drop_shield_rule_*` — IP / hostname / page / country blocklist checks
9. `register_session` — try `current_user_id` first, then `previous_user_id`
10. `persist` — buffer to ClickHouse

**Rule (confirmed):** pipeline is composable small functions; each returns either
enriched or dropped event. Order matters: bot filter first (cheap), then
enrichment, then expensive lookups (GeoIP), then shield checks, then persistence.

## 3. How do we know? (evidence)

8 evidence blocks in `evidence/excerpts.txt` (486 lines). Each is a `nl -ba`
numbered excerpt. Licence confirmed from `LICENSE.md`. Provenance: shallow clone
of the official repo at commit `aa48a053e7387acde2d2d58aba358e54031250fd`.

## 4. What did we not prove?

- **The EE-licensed replay_session_id inclusion.** The `on_EE do ... else ... end`
  macro means the EE version includes the replay ID in the hash; the OSS version
  passes an empty string. *Likely* correct, but the EE source was not read.
- **The full ClickHouse schema (CREATE TABLE).** Located under `priv/` but not
  opened. The `UInt64` field type is confirmed from the Ecto schema, but the full
  table DDL is *not proven*.
- **Real-world salt rotation behaviour under load.** Source-confirmed; no
  benchmark run.
- **The actual UAInspector database refresh cadence.** UAInspector bundles a UA
  database; how often it's updated was not checked.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Plausible
(re-implement; AGPLv3):

1. **Visitor hash formula:** `SipHash64(salt, user_agent + ip + site_domain +
   root_domain)`. Include the site domain so the same visitor on two of our
   sites gets two hashes (cross-site unlinkability).
2. **Salt rotation:** every 90s (configurable). Two valid salts (current +
   previous) for the grace window. Delete salts older than 48h. Cache in memory
   (module-level Map + refresh timer).
3. **Salt generation:** 16 random bytes via `crypto.randomBytes(16)`.
4. **Hash storage:** `BIGINT` in Postgres, not hex string.
5. **Bot filter:** use a maintained UA-parser library (e.g. `ua-parser-js` for
   Node) that classifies bot vs client. Add explicit override for Headless
   Chrome. Do NOT drop unparseable UAs — accept them.
6. **Client payload:** minimal — name, URL, referrer, props, hostname. No
   client-side cookies, no fingerprinting.
7. **Drop reasons:** named enum, telemetry per reason. At minimum: `bot`,
   `spam_referrer`, `invalid`, `dc_ip`, `threat_ip`, `persist_error`.
8. **IP resolution:** 6-header priority chain. Strip the port from IPv4/IPv6.
9. **Pipeline order:** bot filter → enrichment → expensive lookups → shield
   checks → persistence.
10. **Exclusion rules:** client-side path matcher + localStorage opt-out flag.

Do **not** take from Plausible:

- The ClickHouse dependency — Postgres with a partitioned `events` table will
  scale to millions of events/month. Add ClickHouse only if we hit a real
  bottleneck.
- The full Phoenix/Elixir stack — we're on Next.js + Supabase.
- The EE-licensed features (session replay, etc.) — out of scope.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| Visitor hash = SipHash64(salt, UA+IP+domain+root_domain+replay_id) | confirmed |
| Salt rotates every 90s, two valid, 48h retention | confirmed |
| Grace window: try current then previous salt | confirmed |
| Cross-site unlinkability via domain in hash | confirmed |
| Bot filter uses UAInspector library + Headless Chrome override | confirmed |
| Unparseable UA → accept (not drop) | confirmed |
| 15 named drop reasons with per-reason telemetry | confirmed |
| 6-header IP resolution priority chain | confirmed |
| Port stripping from IPv4/IPv6 | confirmed |
| Client payload: name, URL, referrer, props, hostname (no cookies) | confirmed |
| Hash stored as UInt64 / BIGINT | confirmed |
| Pipeline order: bot → enrich → lookup → shield → persist | confirmed |
| EE version includes replay_session_id in hash | likely (macro, not read) |
| Full ClickHouse CREATE TABLE schema | not proven (not opened) |
| Real-world rotation behaviour under load | not proven (no benchmark) |

---

**Engagement 06 — Plausible sample: complete.** The engagement registry listed
both Plausible and Umami; given Plausible's vastly more sophisticated visitor-
hashing design (salt rotation + cross-site unlinkability + UAInspector), Umami
would be redundant. **Recommend closing engagement 06 here** and moving to
engagement 07 (Vercel Commerce — storefront UX, the final engagement).
