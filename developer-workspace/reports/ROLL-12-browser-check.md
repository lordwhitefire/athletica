# ROLL-12 — Browser Check Report

## Runtime confirmation

Nothing is done until the browser loads and verifies. Server `next dev -p 3011` was started in `rollout/` and confirmed up on `http://127.0.0.1:3011/` before any check.

## Attach discipline (followed)

- Attached to Chrome on CDP `:9222` (already running, attach-only, no launch)
- Confirmed Chrome is not headless (UA: `Mozilla/5.0 (X11; Linux x86_64) ... Chrome/149.0.0.0 ...`)
- Created **one tab** in that window; reused it on subsequent runs
- Did not touch any tab this harness did not open
- Detached on exit — tab stays open for the human
- No screenshots

## Full extraction results

Saved to `developer-workspace/scripts/ROLL-12/runs/home/surface-probe.json` and `surface-probe.txt`.

### Page facts

| Fact | Value |
|------|-------|
| URL | `http://127.0.0.1:3011/` |
| Title | `Create Next App` |
| ReadyState | `complete` |
| UserAgent | `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36` |
| Viewport | 1854 × 927, devicePixelRatio 1 |
| Elements in DOM | 48 |
| Links | present |
| Images | present |
| Buttons | present |
| Forms | present |
| Tabs (`[role="tab"]`) | present |
| Console errors | 6 (all Next.js HMR WebSocket failures — see below) |

### Console errors

All 6 errors are:

```
WebSocket connection to 'ws://127.0.0.1:3011/_next/hmr?id=...' failed:
```

These are Next.js dev-server Hot Module Replacement WebSocket failures — expected when connecting via CDP to `next dev`. They are **not** application errors and are unrelated to ROLL-12.

### Elements, links, images, buttons, tabs, forms, hidden elements, computed styles, CSS variables, viewport, scripts, CSS links, accessibility tree

All captured in `surface-probe.json` — full DOM tree, computed styles, CSS custom properties, accessibility tree, and full element inventory extracted from the runtime. No selective retrieval.

## What was NOT checked

- Look / CSS pixels — no screenshots per procedure
- Interactive behaviour beyond navigation (clicks, form submits) — not driven
- ROLL-12-specific analytics behaviour (source normalization, visitor hashing, bot detection, rate limiting) — these are server-side helpers with no browser surface; verified by the `/tmp` harness (25/25 pass) and `tsc` (exit 0)
- Supabase client schema scoping — server-side only, verified by static inspection (0 bare `createClient<Database>(`, 2 `db: { schema: 'rollout' }`) and `tsc`
- Anything outside the layer's surface

## Intended divergences

None — ROLL-12 has no customer-facing surface changes (page/`/go` wiring is ROLL-13/14). The page at `:3011` is the default Next.js starter page; ROLL-12 does not modify any page.

## Unintended divergences

None found.

## Conclusion

Runtime check: **page loads cleanly** on `:3011`, readyState `complete`, 48 DOM elements, no application console errors (only expected Next.js HMR WebSocket noise). ROLL-12's server-side changes are verified by `tsc` and the 25-check harness. Nothing is silently assumed.
