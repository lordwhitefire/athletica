# Athletica — Football Store

A full-featured e-commerce platform for football gear (boots, kits, jerseys, balls, accessories). Live at **[athletica-blond.vercel.app](https://athletica-blond.vercel.app/)**.

## Features

- **Shop** — browsable catalog with categories (Boots, Kits, Jerseys, Balls, Accessories), search, filters, and product pages
- **Cart & Checkout** — add-to-cart, quantity management, and a full checkout flow
- **Accounts** — register, login, password reset, and a profile page
- **Admin panel** — manage products and site content
- **Order tracking** — view order status and history
- **SEO-ready** — metadata, OG/Twitter tags, sitemap-friendly routes
- **Rate-limited APIs** — Upstash rate limiting protects server routes
- **Responsive** — layouts and tested breakpoints from mobile (375px) to desktop (1536px)

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| Database & Auth | Supabase |
| CMS | Sanity (content stored via Sanity and synced to JSON) |
| Edge/monitoring | Upstash Redis + Rate Limit, Sentry |
| Forms/validation | React Hook Form, Zod |
| State | Zustand |
| Extras | dnd-kit (sortable), papaparse (CSV), html-to-image |

## Testing

- **Unit/component tests** — Vitest + React Testing Library + MSW (mock API handlers), with `jest-axe` accessibility checks on components
- **E2E tests** — Playwright
- CI script: `npm run ci` runs unit tests then e2e tests

## Screenshots

![Homepage](public/screenshots/homepage.png)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
...
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run unit tests |
| `npm run e2e` | Run Playwright e2e tests |
| `npm run ci` | Unit + e2e tests in sequence |
