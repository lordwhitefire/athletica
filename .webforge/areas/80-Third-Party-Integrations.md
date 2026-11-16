# Area 80 — Third Party Integrations

## Status
✅ Decided (Partial)

## Decisions Made

### Integrated
| Service | Purpose | Status |
|---|---|---|
| **Supabase** | Auth, database (profiles) | ✅ Integrated |
| **Sanity** | CMS (products, content) | ✅ Integrated |
| **Upstash Redis** | Rate limiting | ✅ Integrated |
| **Sentry** | Error tracking (client + server + edge) | ✅ Integrated |
| **Vercel** | Hosting, deployment | ✅ Integrated |
| **GitHub Actions** | Sanity → JSON sync workflow | ✅ Integrated |
| **Pollinations.ai** | AI-generated placeholder product images | ✅ Used during migration |

### Not Yet Integrated
| Service | Purpose | Priority |
|---|---|---|
| **Paystack** | Nigerian payment processing | 🔴 Critical |
| **Stripe** | International payment processing | 🟠 High |
| **Email (Resend/SendGrid)** | Order confirmations, password reset | 🟠 High |
| **SMS (Termii)** | Nigerian SMS notifications | 🟡 Medium |
| **Analytics (Posthog/GA4)** | User behavior tracking | 🟡 Medium |
| **Google Search Console** | SEO monitoring | 🟡 Medium |
| **Cookie consent (GDPR/NDPR)** | Legal compliance | 🟠 High |

*Source: tech-stack.md lines 66-95, key-findings.md lines 89-98, key-findings.md lines 153-169*

## Next Steps
- Register Paystack account, get API keys, add to `.env.example`
- Register Stripe account for international payments
- Set up email service (Resend recommended for Next.js)
- Set up analytics (Posthog has generous free tier)
- Add cookie consent solution
- Register Google Search Console for SEO monitoring

## References
- `tech-stack.md` lines 66-95 — All integrated services
- `key-findings.md` lines 153-169 — Recommendations for build phase
