# ROLL-15 tasks

- [ ] **T0** — Close the `.env.local` secrets leak (untrack + commit; owner rotates keys)
- [ ] **T0.5** — Commit the uncommitted ROLL-13/14 work honestly

**Checkpoint 0** — no live secret tracked; clean tree for ROLL-15 slices.

- [ ] **T1** — Auth foundation: cookie-aware client + `getAdminUser()` / `requireAdmin()`
- [ ] **T2** — Gate every `/api/admin/*` handler to 404 *(security-critical, before UI)*

**Checkpoint 1** — all four admin APIs return 404 signed-out; `tsc` clean.

- [ ] **T3** — `/admin/login` page + sign-out control
- [ ] **T4** — `/admin` layout gate — 404 for non-admins, exempt `/admin/login`

**Checkpoint 2** — real admin can sign in; signed-out visitor 404s; `/admin/login` renders.

- [ ] **T5** — `proxy.ts` optimistic session refresh + 404 gate
- [ ] **T6** — Dark admin styling: verify existing, style the new surfaces
- [ ] **T7** — Verify + report

**Checkpoint 3** — all benchmarks met and honestly reported; nothing unapproved committed.

---

Commands needing explicit approval before use: `npm install @supabase/ssr@^0.10.3`,
`git rm --cached rollout/.env.local`, and every `git commit`.
