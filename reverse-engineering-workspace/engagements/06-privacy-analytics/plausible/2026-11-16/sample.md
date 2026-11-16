# Sample — Plausible

## Identity

| Field | Value |
|---|---|
| Name | Plausible (plausible/analytics) |
| Type | Elixir + Phoenix backend, JS tracker, ClickHouse analytics store |
| Version / commit | `aa48a053e7387acde2d2d58aba358e54031250fd` (2026-11-16) |
| Provenance | `git clone --depth 1 https://github.com/plausible/analytics.git` on 2026-11-16 |
| Licence | **AGPLv3** |
| Size | 33 MB |
| File count | 2,153 (excluding `.git/`, `node_modules/`, `deps/`) |

## Provenance handling

Shallow clone of the official repo. Working tree read-only.

## Layout (key directories)

```
plausible/
  LICENSE.md                           AGPLv3
  lib/
    plausible/
      ingestion/
        event.ex                       THE EVENT PIPELINE (611 lines)
        request.ex                     request parsing + UA extraction
        persistor.ex                   event persistence
      session/
        salts.ex                       THE SALT ROTATION GENSERVER (96 lines)
      clickhouse_session_v2.ex         session schema (user_id: UInt64)
      clickhouse_event_v2.ex           event schema
      shields.ex                       IP/hostname/country/page blocklists
    plausible_web/
      remote_ip.ex                     IP resolution priority chain (59 lines)
      plugs/
  tracker/
    src/
      plausible.js                     the tracker entry
      track.js                         the event payload builder (176 lines)
      config.js                        tracker config
      engagement.js                    engagement tracking
      custom-events.js                 custom event support
  priv/                                migrations + ClickHouse schema
```

## Lab status

Not applicable. Mode A, static-only.

## Handling rule

Treat as read-only reference under AGPLv3. No verbatim code transplant. Extract
rules and re-implement in fresh TypeScript.

## Open triage questions

1. **Visitor hash formula** — what fields go in? salt rotation interval?
2. **Bot filter** — UAInspector library or hand-maintained list?
3. **Event schema** — client payload vs server enrichment?
4. **Drop reasons** — how many, how named?
5. **IP resolution** — which CDN headers, what priority?
6. **Cross-site unlinkability** — does the hash include the site domain?
