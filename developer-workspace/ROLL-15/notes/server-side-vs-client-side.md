# Note — Server-side scripting and the split that matters

**Date:** Sun Nov 01 2026
**Context:** ROLL-15 planning. The owner said *"the whole rollout should be server side scripting."*
**Purpose:** record what that means honestly, so it isn't re-litigated from scratch next session.

---

## The owner's intent, stated plainly

The owner wants `rollout` to be server-side scripting. Read charitably, the concern is real and
correct: **nothing that matters should run in the browser, where anyone can read or forge it.**

## What "server-side scripting" actually means

From Wikipedia's [Server-side scripting](https://en.wikipedia.org/wiki/Server-side_scripting):

> "…scripts on a web server which produces a response customized for each user's request. These
> scripts may assemble client characteristics for use in customizing the response based on those
> characteristics, the user's requirements, **access rights**, etc."

And the property that makes it matter for auth:

> "Server-side scripting also enables the website owner to **hide the source code** that generates
> the interface, whereas, with client-side scripting, the user has access to all the code received
> by the client."

So the deciding test is simple:

| A check runs here | Can a stranger defeat it? |
|---|---|
| Browser (client-side) | **Yes** — they can read the code and forge the answer |
| Server (server-side) | **No** — they only ever see the 404, never the test |

Note on terminology: **"server UI" is not a standard term** — it appears in no glossary. The
conventional words are *server-side scripting / SSR*, *client-side UI*, and *admin UI / admin panel*.
Recorded so a future session doesn't hunt for a definition that doesn't exist.

## The restaurant analogy (how it was explained to the owner)

Two rooms:

- **The kitchen** — secret recipes, the money, and the owner deciding who gets in. That's the server.
- **The dining room** — where you sit, look at the menu, and point at what you want. That's the browser.

The recipes and the money stay in the kitchen; if they were in the dining room anyone could take them.

**Pressing a button in the dining room does not open the kitchen.** You are only telling the kitchen
"I'd like this." The kitchen then checks whether you're allowed, and slams the door if you're not.
So a stranger clicking every admin button achieves nothing — **the buttons don't decide anything, the
kitchen does.**

"Make everything server-side" would mean making everything happen in the kitchen: no dining room, no
tables, no menu, no way to order. Both rooms are needed — neither alone is a restaurant.

## The distinction that settles it

| | Runs where | Does it leak? |
|---|---|---|
| **Authority** — secrets, role checks, data access, the 404 decision | **Server** | Never |
| **Interaction** — which thumbnail is active, what is typed in a box | Browser | Harmless — it is the user's own action, not a decision |

A client-side screen holds no authority. That is why gating the API routes is the real security work,
not rewriting the screens.

## Current state of `rollout` (verified by read-only recon, 2026-10-31)

Already server-side:

| Piece | Type |
|---|---|
| Root `layout.tsx` | Server Component |
| Product page `src/app/product/[slug]/page.tsx` | **Server Component** |
| `src/app/go/[id]/route.ts` | Route handler |
| All 5 `/api/*` routes | Route handlers |
| All of `src/lib/**` | Server modules |

Next.js 16 makes **Server Components the default**, so `rollout` is already majority server-side.

Client-side (`'use client'`), and why it must be:

| Screen | Needs client because |
|---|---|
| `ProductDetailsClient.tsx` | thumbnail click swaps hero image → `useState` |
| `src/app/admin/products/page.tsx` | search, sort, filter, pagination, modals |
| `product-editor.tsx` | form state, save bar, modal, media browser |
| `[id]/edit/page.tsx` | loads a product by id |

From Next.js's own docs (`node_modules/next/dist/docs/01-app/01-getting-started/server-and-client-components`):

> Use **Client Components** when you need state and event handlers (`onClick`), lifecycle logic
> (`useEffect`), browser-only APIs (`localStorage`, `window`), custom hooks.

These cannot be built as pure Server Components.

**Concrete proof of why the split is safe:** the admin products page is a client component, yet it
holds no data of its own — it fetches from `/api/admin/*`, and those route handlers are server-side.
The authority lives in the handler, not the screen.

## What follows for ROLL-15

1. **Keep all authority server-side** — T1 (`requireAdmin()`), T2 (gate all four API handlers),
   T4 (layout gate), T5 (proxy). Unchanged from the plan.
2. **T2 is the security work.** It closes the service-role exposure, which is the actual hole.
3. **Optional, owner's call:** convert the admin write operations to **Server Actions** so
   create/update/publish/delete go through server functions instead of `fetch` to `/api/admin/*`.
   Smaller client bundle, fewer exposed endpoints, same authority.

## Open decision

- **(a)** Keep security server-side; convert admin writes to Server Actions. *Recommended.*
- **(b)** Attempt a full server-side rewrite of the admin screens — a substantial rebuild that
  loses snappy client-side filtering unless done carefully.

Also unresolved from earlier: whether `import 'server-only'` is usable in this Next 16 install. The
npm package is absent from `rollout/node_modules`, but Next's docs state installing it is **optional**
and that "Next.js handles `server-only` and `client-only` imports internally." Verify against the
installed docs before relying on either answer — do not build from memory.

## Linked

- `developer-workspace/ROLL-15/plan.md` — the ROLL-15 task plan this note qualifies
- `developer-workspace/ROLL-15/todo.md` — the task list
