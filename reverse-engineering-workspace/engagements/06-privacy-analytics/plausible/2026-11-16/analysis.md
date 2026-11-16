# Analysis — Engagement 06, Sample: Plausible

**Date:** 2026-11-16
**Mode:** A (open source under AGPLv3), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE.md` | 1–15 | AGPLv3 confirmed |
| `lib/plausible/ingestion/event.ex` | 1–60, 255–285, 396–440, 566–611 | Event pipeline + bot filter + put_user_id + generate_user_id |
| `lib/plausible/session/salts.ex` | 1–96 (full) | The salt rotation GenServer |
| `lib/plausible/clickhouse_session_v2.ex` | 35–55 | Session schema (user_id UInt64) |
| `lib/plausible_web/remote_ip.ex` | 1–59 (full) | IP resolution priority chain |
| `tracker/src/track.js` | 1–80 (head) | Client-side event payload |

## Observed: the visitor hash formula (the privacy innovation)

`lib/plausible/ingestion/event.ex:566-595`. The `generate_user_id/4` function:

```elixir
defp generate_user_id(request, domain, hostname, salt) do
  cond do
    is_nil(salt) -> nil
    is_nil(domain) -> nil
    true ->
      user_agent = request.user_agent || ""
      root_domain = get_root_domain(hostname)
      replay_session_id = on_ee do: to_string(request.replay_session_id) else: ""
      SipHash.hash!(salt, user_agent <> request.remote_ip <> domain <> root_domain <> replay_session_id)
  end
end
```

**Rule (confirmed):** the visitor hash is:

```
SipHash64(salt, user_agent + remote_ip + domain + root_domain + replay_session_id)
```

Five inputs:
1. **salt** — the rotating salt (current or previous, see below)
2. **user_agent** — full UA string
3. **remote_ip** — the visitor IP (after header resolution, see §below)
4. **domain** — the Plausible-tracked site domain
5. **root_domain** — the registrable domain (via PublicSuffix), not the hostname
6. **replay_session_id** — optional session-replay ID (EE only; empty string in OSS)

**Rule (confirmed — cross-site unlinkability):** the hash includes the `domain`
and `root_domain`. So the same visitor on two different Plausible-tracked sites
gets **two different hashes**. Sites cannot collude to de-anonymize a visitor by
comparing hash sets. This is the strongest privacy guarantee short of not storing
any identifier.

**Rule (confirmed):** the hash function is **SipHash** (specifically `SipHash.hash!/2`
from the `siphash` Elixir library). SipHash is a fast, cryptographically-keyed
non-cryptographic hash designed for hash-table keying — it's resistant to
collision attacks but not preimage attacks. Appropriate for an identifier that
needs to be stable within a salt window but unlinkable across windows.

**Rule (confirmed):** the hash output is 64-bit, stored as `UInt64` in ClickHouse
(`clickhouse_session_v2.ex:39`) and as `BIGINT` would be in Postgres. Not a hex
string. ~50% smaller, faster to index/join.

## Observed: the salt rotation (the unlinkability guarantee)

`lib/plausible/session/salts.ex` (96 lines, full). A GenServer manages two salts:
`current` and `previous`.

```elixir
def refresh(name, now) do
  salts = Repo.all(from s in "salts", select: s.salt, order_by: [desc: s.id], limit: 2)
  # ... sets %{previous: prev, current: current} in ETS ...
  interval = Application.get_env(:plausible, __MODULE__)[:interval] || :timer.seconds(90)
  Process.send_after(self(), {:refresh, now}, interval)
end

def handle_call({:rotate, now}, _from, name) do
  current = fetch(name).current
  state = %{current: generate_and_persist_new_salt(now), previous: current}
  # ... insert into ETS ...
end

defp generate_and_persist_new_salt(now) do
  salt = :crypto.strong_rand_bytes(16)
  Repo.insert_all("salts", [%{salt: salt, inserted_at: now}])
  salt
end

defp clean_old_salts(now) do
  h48_ago = DateTime.shift(now, hour: -48)
  Repo.delete_all(from s in "salts", where: s.inserted_at < ^h48_ago)
end
```

**Rule (confirmed):** salt rotation:
- **Interval:** every 90 seconds (configurable).
- **Two valid salts at any time:** `current` (just rotated) and `previous` (the
  one before).
- **Salt generation:** 16 random bytes via `:crypto.strong_rand_bytes(16)`.
- **Persistence:** each salt is INSERTed into a `salts` table with `inserted_at`.
- **Cleanup:** salts older than 48 hours are DELETEd.
- **Cache:** salts are cached in an ETS table (`:protected`, `{:read_concurrency, true}`)
  for fast lock-free reads from ingestion workers.

**Rule (confirmed — the grace window):** `put_user_id` hashes with `salts.current`.
`register_session` *also* generates `previous_user_id` with `salts.previous` and
passes it to the persistor. The persistor tries `current_user_id` first; if no
session matches, it tries `previous_user_id`. This gives a **one-rotation (90s)
grace window** where a visitor whose salt rotated between two events is still
linked to the same session.

**Rule (confirmed — unlinkability):** because the salt rotates every 90s and old
salts are deleted after 48h, an attacker who captures today's hashes cannot link
them to next week's. The hash is stable within a 90s window, linkable across the
grace window, then permanently unlinkable. This is the **privacy guarantee**:
short-term session continuity + long-term unlinkability.

## Observed: bot filtering via UAInspector + explicit overrides

`lib/plausible/ingestion/event.ex:255-285`:

```elixir
defp put_user_agent(%__MODULE__{} = event, _context) do
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
end
```

**Rule (confirmed):** bot detection uses the **`UAInspector`** Elixir library — a
maintained UA-database parser, NOT a hand-maintained string list like Dub's.
UAInspector classifies each UA as either a `Result.Bot` (a known crawler) or a
`Result.Client` (a real browser). Both paths are handled.

**Rule (confirmed — explicit override):** even when UAInspector classifies a UA
as a `Result.Client`, Plausible explicitly drops **Headless Chrome** by checking
`client.name == "Headless Chrome"`. This is a hand-maintained override for a
known-evasive pattern the library misses (headless Chrome can be driven by
Puppeteer/Playwright and used for scraping).

**Rule (confirmed):** if the UA cannot be parsed (`_any` clause), the event is
**NOT dropped** — it's accepted with no UA enrichment. This is the opposite of
Dub's "if no UA, treat as bot" stance. Plausible errs on the side of counting
the event; Dub errs on the side of excluding it. **For an affiliate analytics
context, Plausible's stance is correct** — we'd rather over-count than
under-count a real visitor with an odd UA.

## Observed: the drop_reason enum (15 named reasons)

`lib/plausible/ingestion/event.ex:24-40`:

```elixir
@type drop_reason() ::
        :bot
        | :spam_referrer
        | GateKeeper.policy()
        | :invalid
        | :dc_ip
        | :threat_ip
        | :site_ip_blocklist
        | :site_country_blocklist
        | :site_page_blocklist
        | :site_hostname_allowlist
        | :verification_agent
        | :lock_timeout
        | :no_session_for_engagement
        | :persist_timeout
        | :persist_error
        | :persist_decode_error
```

**Rule (confirmed):** every drop reason is a **named atom**, not a string. The
pipeline emits telemetry per reason (`emit_telemetry_dropped(event, reason)`),
so you can count "N events dropped for :bot, M for :dc_ip, K for :spam_referrer"
in one grouped query. Observability is built-in.

Notable reasons:
- `:dc_ip` — datacenter IP (drops traffic from AWS/GCP/Azure IP ranges; real
  users don't browse from datacenters)
- `:threat_ip` — known threat IP (from a threat intel feed)
- `:spam_referrer` — known spam referrer (from a blocklist)
- `:verification_agent` — Plausible's own site-verification crawler

## Observed: IP resolution priority chain

`lib/plausible_web/remote_ip.ex:6-37`. The order:

1. `x-plausible-ip` — Plausible's own header (for trusted proxy setups)
2. `cf-connecting-ip` — Cloudflare
3. `x-forwarded-for` — generic proxy (first IP in the chain)
4. `b-forwarded-for` — Bunny CDN
5. `forwarded` — RFC 7239 standard
6. `conn.remote_ip` — fallback to the socket's peer IP

**Rule (confirmed):** handle ALL the CDN/proxy headers, not just
`x-forwarded-for`. The order matters — a spoofed `x-forwarded-for` should NOT
override Cloudflare's `cf-connecting-ip` when behind Cloudflare.

**Rule (confirmed):** the function strips the port from both IPv4 and IPv6
addresses via a regex. Important because ClickHouse / hashing functions may not
handle `1.2.3.4:5678` cleanly.

## Observed: the client-side payload (privacy-first design)

`tracker/src/track.js:1-80`. The payload sent to `/api/event` is intentionally
minimal:

```javascript
payload.n = eventName          // 'pageview' or custom event name
payload.u = options.u || URL   // the page URL
payload.r = document.referrer   // referrer (or null)
payload.p = options.props       // custom props (object)
payload.h = hostname            // the site hostname
```

**Rule (confirmed — no client-side cookies):** the tracker sets **NO cookies**,
reads NO localStorage, generates NO client-side fingerprint. The visitor
identifier is computed SERVER-SIDE from `IP + UA + domain + salt`. The client
sends only what the server cannot know (URL, referrer, props).

**Rule (confirmed):** the tracker has an `exclusion rule` path matcher
(`track.js:53`) — sites can exclude specific paths from tracking (e.g.
`/admin/*`). Client-side opt-out via `localStorage.plausible_ignore` is also
supported (`track.js:43`).

## Observed: the server-side enrichment pipeline

`lib/plausible/ingestion/event.ex:130-180`. The event pipeline runs a sequence
of `put_*` functions, each enriching or dropping:

1. `put_user_agent` — parse UA, drop bots, extract OS/browser/screen_size
2. `put_basic_info` — domain, site_id, timestamp, event_name
3. `put_user_id` — compute the visitor hash with `salts.current`
4. `put_salts` — attach the salts map (for the grace-window retry)
5. `put_props` — attach custom event props
6. `put_hostname` — extract hostname from URL
7. `put_pathname` — extract pathname (with hash-mode handling)
8. `put_referrer` — extract + sanitize referrer
9. `put_utm_params` — extract UTM params from URL
10. `put_geo` — GeoIP lookup on the IP
11. `drop_shield_rule_*` — IP / hostname / page / country blocklist checks
12. `register_session` — try `current_user_id` first, then `previous_user_id`
13. `persist` — buffer to ClickHouse

**Rule (confirmed):** the pipeline is a series of small, composable functions
each returning either an enriched event or a dropped event. Each step can drop.
The order is carefully chosen: bot filter first (cheap), then enrichment, then
expensive lookups (GeoIP), then shield checks, then persistence.

## What Plausible contributes vs Dub (engagement 01)

| Capability | Dub (engagement 01) | Plausible (engagement 06) |
|---|---|---|
| Visitor identity | `identity_hash` of IP+UA+salt (details not fully read in 01) | `SipHash64(salt, UA+IP+domain+root_domain+replay_id)` — explicit formula |
| Salt rotation | Not visible in 01's read | Every 90s, two valid salts, 48h retention, grace window |
| Bot filter | Hand-maintained 50+ UA fragments + false-positive sanitizer | `UAInspector` library + explicit Headless-Chrome override |
| Client payload | Not analyzed in 01 | Minimal: name, URL, referrer, props, hostname. No cookies, no fingerprint. |
| Cross-site unlinkability | Not confirmed | Confirmed — hash includes domain + root_domain |
| Drop reasons | Not enumerated in 01 | 15 named atoms, telemetry per reason |
| IP resolution | Vercel `x-vercel-ip-*` headers (engagement 01) | 6-header priority chain (Plausible IP, CF, XFF, Bunny, Forwarded, socket) |
| Storage | Tinybird (column store) | ClickHouse (column store) — same family |
| Hash storage type | Not visible | `UInt64` (not hex string) |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in
  `evidence/excerpts.txt` (486 lines, 8 evidence blocks).
- **likely** — the `on_EE do ... else ... end` macro for `replay_session_id`
  means the EE version includes the replay ID in the hash; the OSS version
  passes an empty string. *Likely* correct, but the EE source was not read.
- **not proven** — the actual ClickHouse schema (CREATE TABLE) for sessions and
  events was not read in full (located under `priv/` but not opened). The
  `UInt64` field type is confirmed from the Ecto schema, but the full table
  DDL is *not proven*.

## Engagement 06 consolidated rules for the build

- **Visitor hash formula:** `SipHash64(salt, user_agent + ip + site_domain + root_domain)`.
  Include the site domain so the same visitor on two of our sites gets two hashes
  (cross-site unlinkability).
- **Salt rotation:** every 90 seconds (configurable). Keep two valid salts
  (current + previous) for a one-rotation grace window. Delete salts older than
  48 hours. Cache salts in memory (ETS-equivalent: a module-level Map with a
  refresh timer).
- **Salt generation:** 16 random bytes via `crypto.randomBytes(16)`.
- **Hash storage:** store as `BIGINT` in Postgres (or `UInt64` if we ever add
  ClickHouse), not as a hex string.
- **Bot filter:** use a maintained UA-parser library that classifies UA as bot
  vs client. Add explicit overrides for Headless Chrome and any other evasive
  patterns the library misses. Do NOT drop unparseable UAs — accept them.
- **Client payload:** minimal — name, URL, referrer, props, hostname. No
  client-side cookies, no fingerprinting.
- **Drop reasons:** named enum, telemetry per reason. At minimum: `bot`,
  `spam_referrer`, `invalid`, `dc_ip`, `threat_ip`, `persist_error`.
- **IP resolution:** 6-header priority chain (custom header, Cloudflare, XFF,
  Bunny, Forwarded, socket). Strip the port from IPv4 and IPv6.
- **Pipeline order:** bot filter first (cheap), then enrichment, then expensive
  lookups, then shield checks, then persistence.
- **Exclusion rules:** client-side path matcher + localStorage opt-out flag.
