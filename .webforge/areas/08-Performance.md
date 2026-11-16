# Area 08 — Performance

## Status
✅ Decided (Partially Implemented)

## Decisions Made
- **Core Web Vitals**: Measured via `web-vitals` library (v5.3.0)
- **Image optimization**: `next/image` with remote patterns for `cdn.sanity.io` and `media.futbolmania.com`
- **Lazy loading**: Next.js Image component handles lazy loading natively
- **Font loading**: Local `@font-face` declarations (no Google Fonts CDN — eliminates FOUT and external HTTP)
- **Third-party scripts**: Sentry integrated via `withSentryConfig()`, bundle analyzer env-gated
- **Caching strategy**: ISR with 60s revalidate; React `cache()` for request deduplication
- **Bundle analyzer**: Configured, env-gated (`ANALYZE=true`)
- **Known performance issue**: Homepage editor page takes >60s to load (critical bug #11)
- **Lighthouse target**: Not specified

*Source: tech-stack.md lines 18-23, tech-stack.md lines 38-42, key-findings.md line 82, key-findings.md lines 97-98*

## Next Steps
- Fix homepage editor >60s load time (root cause: memoize `sanityCdnUrl` + lazy preview)
- Set target Lighthouse scores
- Consider adding Vercel Speed Insights

## References
- `tech-stack.md` — Bundle analyzer, Sentry config
- `key-findings.md` lines 80-86 — Performance gaps
