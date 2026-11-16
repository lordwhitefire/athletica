# 04 — The 80-Area Checklist (FULL MARKETPLACE)

**Blueprint:** Athletica
**Mode:** Plan — every area is **Decided**, **Skip**, or **Pending**.

The 80 areas from `web-development-areas.md`. Each has one Home. Full rationale + citation: `product-management/02-area-decisions-evidence.md`.

**Counts:** Decided 66 · Skip 14 · Pending 0. **Total 80.** Plus 17 gap questions (all Decided).

The 14 Skips are structural to the business model (affiliate marketplace, not retailer; web-only) — not MVP shortcuts. Everything the RE engagements studied is in scope and built.

---

## By Home

### UI (7)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 03 | Design system | Decided | Black/lemon, Tailwind v4; price pill (admin only). |
| 04 | Brand and identity | Decided | Athletica across all surfaces. |
| 09 | Responsive and cross-device | Decided | Phone-first storefront; PC + admin. |
| 10 | Cross-browser compatibility | Decided | In-app browsers + evergreen. |
| 12 | Assets and media | Decided | Sanity media library; Supabase stores URL only. |
| 23 | Animation and interactions | Decided | Carousel, gallery, toast/confirm; no pop-up CTA. |
| 79 | Design tokens and theming | Decided | Tailwind v4 tokens; admin.css dark. |

### UX Thread (8)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 06 | Routing and navigation | Decided | `/` homepage, `/shop` catalog, `/product/[slug]`, `/go/[id]`, `/admin/*`, `/affiliate/*`. |
| 11 | Accessibility | Decided | Contrast/focus/alt/keyboard; axe check before launch. |
| 24 | Notifications and feedback | Decided | Toast + confirm + action-state; honest states everywhere. |
| 25 | Forms and validation | Decided | Admin editor + affiliate signup/payout + CSV mapping. |
| 26 | Internationalization | Decided | 22 marketplace locales; URL param switch; English base. |
| 29 | Redirect and URL management | Decided | `/go/[id]`→302; branded not-found; `X-Robots-Tag: noindex`. |
| 45 | Onboarding flow | Decided | Affiliate multi-step signup + admin invite. |
| 64 | Multi-step flows and wizards | Decided | Affiliate signup, payout request, CSV import wizard. |

### Data (4)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 49 | Multi-tenancy | Decided | Single platform; ownership RLS for affiliate's own tables. |
| 52 | Audit logs and activity history | Decided | analytics + admin action log + payout transitions + append-only balance. |
| 59 | Soft delete vs hard delete | Decided | Soft via `deleted_at`; balance rows append-only. |
| 62 | Timezone and localization | Decided | UTC storage; per-marketplace locale config. |

### Business logic (6)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 36 | Inventory management | Skip | Amazon holds inventory. |
| 38 | Shipping and delivery | Skip | Amazon ships. |
| 39 | Discount and promotions | Decided | Full affiliate commissions/payouts (per-campaign, recurring, FX, reversals). |
| 40 | Order management | Skip | Amazon is the order system. |
| 54 | Subscription and feature gating | Decided | Affiliate recurring commission (toggle + nullable limit). |
| 60 | Collaboration features | Decided | Affiliate↔admin payout review workflow. |

### Functionality (18)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 07 | SEO and discoverability | Decided | `generateMetadata` + JSON-LD + sitemap + robots on all public pages. |
| 34 | Payment integration | Skip | Amazon handles payment. |
| 35 | Product catalog | Decided | Full catalog: products + variants + categories + collections + browse + search. |
| 37 | Cart and checkout | Skip | No cart; CTA → Amazon. |
| 41 | CMS integration | Decided | Sanity full media library. |
| 42 | Reviews and testimonials | Decided | Amazon reviews via Creators API when enabled; section hidden when there is no data. |
| 44 | User management | Decided | Admins (three-locks) + affiliates (self-serve + approval). |
| 46 | Dashboard and data visualization | Decided | Live admin analytics + affiliate dashboard. |
| 47 | Real-time features | Decided | SSE for live dashboards. |
| 48 | Notification system | Decided | Email (affiliate events, Sentry, invites) + in-app toast. |
| 50 | File management | Decided | Full media library (upload, browse, delete). |
| 51 | Search and filtering | Decided | Public storefront search + admin search. |
| 53 | Import and export | Decided | Two-phase CSV import + analytics/ledger/payout CSV export. |
| 55 | Settings and configuration | Decided | Amazon Associates tags (the admin's, per-marketplace), Sentry, rate-limit, salt, Creators API (optional), affiliate program settings. |
| 56 | Admin panel | Decided | Full workspace (products, categories, media, analytics, affiliates, payouts, settings). |
| 67 | Push notifications (mobile) | Skip | No mobile app. |
| 68 | Device features | Skip | No mobile app. |
| 71 | Deep linking | Skip | No mobile app; `/go/[id]` is web redirect. |

### Engine (25)

#### Architecture (4)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 02 | Stack decisions | Decided | Next.js 16.3.4 + Supabase + Sanity + Upstash + Sentry + ua-parser-js + Creators API client (optional). |
| 05 | Frontend architecture | Decided | App Router; Server Components for data; layered action-client. |
| 65 | Platform targets | Decided | Web only (phone + PC). |
| 78 | Landing page vs app shell | Decided | Storefront homepage at `/`; admin + affiliate shells separate. |

#### Integration (3)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 57 | API design | Decided | REST `/api/*` + S2S postback + affiliate dashboard API. |
| 61 | Webhooks (outgoing) | Skip | None; Creators API (when enabled) polled. |
| 80 | Third party integrations | Decided | Supabase, Sanity, Amazon (22 marketplaces), Upstash, Sentry, Vercel, email. |

#### Communication between parts (1)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 58 | Background jobs and queues | Decided | `waitUntil` for clicks; Vercel cron for salt/dead-link/Creators-API/payout-term; SSE for live. |

#### Runtime environment (0 areas — uses R1–R5, see `05-gap-questions.md`)

#### Deployment (3)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 18 | Deployment and DevOps | Decided | One Vercel project; preview per PR; `vercel.json` with cron. |
| 66 | App store and distribution | Skip | No mobile app. |
| 70 | App updates | Skip | No mobile app; web = redeploy. |

#### Configuration (1)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 14 | Environment and configuration | Decided | `.env.local`/Vercel; the admin's Associates tags (per-marketplace); Creators API credentials (optional until eligible); leak plan. |

#### Security (4)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 28 | Cookie and session management | Decided | Door-key (admin) + JWT (admin + affiliate); no visitor cookies. |
| 43 | Authentication and authorization | Decided | Three locks (admin) + email/password+approval (affiliate); ownership RLS for affiliate. |
| 63 | Rate limiting and abuse prevention | Decided | Upstash per-endpoint policies; explicit redirect; dedup; signin + signup + postback limits. |
| 77 | Security | Decided | HTTPS; SHA-256 tokens; RLS+FORCE+`(select…)`; EU redaction; `rel="nofollow noopener"`. |

#### Reliability (5)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 13 | Error handling | Decided | Neutral auth errors; plain 404; Sentry; error-tolerant click writes; transactional payouts. |
| 19 | Monitoring and observability | Decided | Sentry + uptime ping + drop-reason telemetry + payout-pipeline + Creators API error-rate alerts. |
| 27 | Offline and PWA | Skip | No PWA; dashboards degrade to polling. |
| 31 | Backup and recovery | Decided | Supabase daily + PITR (Pro); Sanity CDN; git; redeploy rollback. |
| 69 | Offline mode (mobile) | Skip | No mobile app. |

#### Scalability (1)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 76 | Scalability planning | Decided | Single Supabase Pro; monthly partitions; Upstash cache; replicas/ClickHouse at >5M clicks/month. |

#### Resource management (3)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 08 | Performance | Decided | Mobile LCP; `next/image`; `getClaims()`; `waitUntil`; Upstash cache; SSE over polling. |
| 30 | Code splitting and bundle size | Decided | Auto-splitting; admin/affiliate lazy; `<Suspense>`; charts dynamic-imported. |
| 72 | Performance (mobile specific) | Skip | No mobile app; covered by 08. |

### Project Ring (12)

| # | Area | Decision | One-line rationale |
|---|---|---|---|
| 01 | Project setup | Decided | Athletica; Vercel; dev/preview/prod; per-marketplace currency. |
| 15 | Version control | Decided | Git; protected `main`; conventional commits. |
| 16 | Development workflow | Decided | TS strict; ESLint/Prettier; pre-commit; review; read `AGENTS.md`. |
| 17 | Testing | Decided | Smoke + critical-path per phase (owner ruling: no full suite). |
| 20 | Legal and compliance | Decided | Amazon disclosure; privacy; cookie; GDPR; terms; affiliate agreement; payout tax docs. |
| 21 | Documentation | Decided | README; `.env.example`; changelog; API docs; admin guide; affiliate guide; blueprint; handoff. |
| 22 | Naming conventions | Decided | kebab files; PascalCase components; camelCase fns; snake_case tables. |
| 32 | Client communication | Decided | Owner approves; phase gates; progress via `PROGRESS.md`. |
| 33 | Handoff and maintenance | Decided | Credentials handoff; admin + affiliate guides; support per owner. |
| 73 | Progress tracking | Decided | `PROGRESS.md` + per-phase + per-task ROLL folders. |
| 74 | Session recovery | Decided | Reload rule files first; log after each action. |
| 75 | Constraint identification | Decided | Solo owner + affiliates; Vercel/Supabase Pro; Creators API limits and eligibility; Nigerian context; email deliverability. |

---

## Count check

| Home | Decided | Skip | Pending | Total |
|---|---|---|---|---|
| UI | 7 | 0 | 0 | 7 |
| UX Thread | 8 | 0 | 0 | 8 |
| Data | 4 | 0 | 0 | 4 |
| Business logic | 2 | 4 | 0 | 6 |
| Functionality | 13 | 5 | 0 | 18 |
| Engine | 19 | 6 | 0 | 25 |
| Project Ring | 12 | 0 | 0 | 12 |
| **Total** | **66** | **14** | **0** | **80** |

Wait — that totals 65 Decided. Let me recount: 7+8+4+2+13+19+12 = 65. Hmm. Let me recheck Functionality: Decided = 07,35,41,42,44,46,47,48,50,51,53,55,56 = 13. Skip = 34,37,67,68,71 = 5. Total 18 ✓. Business logic: Decided = 39,54,60 = 3 (not 2). Skip = 36,38,40 = 3. Total 6 ✓. So Business logic Decided = 3, not 2.

Recount: UI 7 + UX Thread 8 + Data 4 + Business logic 3 + Functionality 13 + Engine 19 + Project Ring 12 = 66 Decided. ✓ Skip = 0+0+0+3+5+6+0 = 14. ✓ Total 80. ✓

Plus 17 gap questions (all Decided) in `05-gap-questions.md`. Total reviewed: 97.

| Home | Decided | Skip | Pending | Total |
|---|---|---|---|---|
| UI | 7 | 0 | 0 | 7 |
| UX Thread | 8 | 0 | 0 | 8 |
| Data | 4 | 0 | 0 | 4 |
| Business logic | 3 | 3 | 0 | 6 |
| Functionality | 13 | 5 | 0 | 18 |
| Engine | 19 | 6 | 0 | 25 |
| Project Ring | 12 | 0 | 0 | 12 |
| **Total** | **66** | **14** | **0** | **80** |

The 14 Skips: Business logic (36 Inventory, 38 Shipping, 40 Order mgmt — Amazon) · Functionality (34 Payment, 37 Cart/checkout, 67 Push, 68 Device, 71 Deep links — Amazon + no mobile) · Engine (61 Webhooks, 66 App store, 27 Offline/PWA, 69 Offline mobile, 70 App updates, 72 Mobile perf — no webhooks + no mobile + no PWA). All structural, not deferrals.
