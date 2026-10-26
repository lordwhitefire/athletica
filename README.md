# Athletica

A football store and affiliate commerce platform: a public storefront for customers, a private admin workspace for the team, and a lightweight affiliate storefront for social traffic.

**Live store:** https://athletica-blond.vercel.app

<!-- Add screenshots here once they are committed (e.g. docs/storefront.png). -->

## Repository layout

- `frontend/` — the store application: public storefront and private admin.
- `rollout/` — the affiliate storefront for Instagram/WhatsApp traffic: product page → Amazon.

## What it is

The store application has two sides:

- **Storefront (public)** — browse the catalogue, search products, manage a cart, check out, track orders and create an account.
- **Admin (private)** — manage products, brands, models, categories, media, homepage content and navigation; import catalogues in bulk; review traffic, product and affiliate analytics.

## Features

### Storefront

- Product catalogue with brands, categories and models
- Search, cart, checkout and order history
- Customer accounts, login and password recovery
- Mobile-first responsive UI
- Privacy, terms, cookies and returns pages

### Admin

- Product, brand, model and category management
- Media library
- Bulk import from CSV/Excel
- Homepage and navigation editor
- Traffic, product and affiliate analytics
- System health and settings
- Invite-only, role-based access

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Data & auth | Supabase (Postgres, Auth, Row Level Security) |
| Content | Sanity |
| Monitoring | Sentry, web-vitals |
| Forms & validation | React Hook Form, Zod |
| State | Zustand |
| Rate limiting | Upstash Redis |
| Testing | Vitest, Testing Library, MSW, jest-axe; Playwright specs in `frontend/e2e/` |

## Project structure

```
frontend/
  src/app/          # storefront, admin and API routes
  src/components/   # shared UI
  src/lib/          # services, Supabase clients, analytics
  e2e/              # end-to-end and visual specs
  supabase/         # schema and migrations

rollout/
  src/app/          # product page, admin and API routes
  supabase-rollout-schema.sql
  supabase-rollout-rls-policies.sql
```

## Getting started

### Store app (`frontend/`)

```bash
git clone https://github.com/lordwhitefire/athletica.git
cd athletica/frontend
npm install
cp .env.example .env.local   # fill in your own credentials
npm run dev
```

Open http://localhost:3000.

### Rollout app (`rollout/`)

From the repository root:

```bash
cd rollout
npm install
cp .env.example .env.local   # fill in your own credentials
npm run dev -- -p 3001       # if the store app is already using port 3000
```

### Environment variables

Each app has its own `.env.example` — Supabase, Sanity, Upstash Redis and Sentry settings. Never commit real credentials; `.env.local` stays local.

### Tests

From the repository root:

```bash
cd frontend
npm run test        # watch mode
npm run test:ci     # single run
npm run coverage    # coverage report
```

End-to-end and visual specs live in `frontend/e2e/`.

### Build

From the repository root:

```bash
cd frontend && npm run build
cd ../rollout && npm run build
```

## Admin access

The admin area is private and invite-only. Accounts are created by the project owner; there is no public sign-up. For access, contact the owner.

## Status

The public store is live; the admin platform is in internal use. The rollout affiliate app is in development.

## License

Private client project — all rights reserved.
