# Area 01 — Project Setup

## Status
✅ Decided

## Decisions Made
- **Project name**: Athletica — Football/Sports E-Commerce Platform
- **Client**: Self (builder/owner), Nigerian market for football/sports gear
- **Target audience**: Nigeria (primary), potentially international
- **Currency**: NGN (primary), product schema includes `currency` field
- **Hosting**: Vercel (hobby tier) for frontend
- **Environment separation**: dev (local), production only — no staging environment yet
- **Deadline**: Not specified
- **Budget**: Not specified (free tiers: Vercel Hobby, Supabase Free, Sanity Free, Upstash Free)

*Source: context/goal.md lines 3-7, tech-stack.md lines 10-15, key-findings.md lines 97-98*

## Next Steps
- Set up staging environment (separate Vercel project + Supabase project)
- Create `.env.example` for developer onboarding
- Decide on domain name (`.com.ng` or `.com`)

## References
- `context/goal.md` — Project goal document
- `tech-stack.md` — Full tech stack details
- `data-flow.md` — Data architecture
