# Plan — get the server back on

## What is wrong

The shop has **two guards at the same door**. Next.js 16 allows only one. So the shop refuses to open.

The guards are two files:

- `middleware.ts` — checks the secret door key.
- `proxy.ts` — checks if you have a login session.

Next.js sees both and stops.

## What I want to do

1. **Keep one guard:** `proxy.ts`.
2. **Teach it the other guard's job:** check the secret door key too.
3. **Remove the second guard:** delete `middleware.ts`.
4. **Start the server.** Leave it on.

That is the whole fix.

## What stays the same

- The secret door key still works.
- The admin badge check still works.
- The public shop is not touched.
- The database is not touched.
- No new package.

## What you will see when it is done

- The server starts and stays on.
- `/admin/products` with no door key → **404** (the door looks like it does not exist).
- `/admin/signin` with a valid door key → the sign-in page loads.
- `/admin/products` with a door key but no admin badge → **404**.
- The public pages load normally.

## What could still block the door

The key check needs a small function in the database (`validate_door_key`). It **exists** in the live
database (verified 2026-11-17), and ten valid door keys exist. So this is no longer a separate
owner step. If the key check fails after the merge, it is a code or cookie problem, not a missing
function.

## Two details that will bite if copied blindly

1. `middleware.ts` only matches `/admin/:path*`. It does **not** guard `/api/admin/:path*`.
   The merged `proxy.ts` already matches both; keep both, and apply the door-key check to both.
2. `middleware.ts` passes `req.cookies` to `createRouteClient`, but that helper expects the
   `cookies()` store. That line is a TypeScript error today. Adapt the cookie source; do not
   paste the line.

## What I will not touch

- Product pages, affiliate pages, analytics, or design.
- The database, schema, or security rules.
- `next.config.ts` or the pixel-match CSS.
- I will not commit or push. You do.

## Order

1. Architecture — **done**. The documents now say one guard, `proxy.ts`, with the door key inside it.
2. The code change — one file edited, one file deleted.
3. Start the server and check the four doors listed above.
