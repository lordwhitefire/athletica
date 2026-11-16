# Area 41 — CMS Integration

## Status
✅ Decided

## Decisions Made
- **CMS**: Sanity v5 (standalone studio at `studio-athletica/`)
- **Content editable**: Products, homepage, navigation, brands, Amazon affiliate links, site settings
- **Content preview**: Not implemented (no preview before publishing)
- **Who updates content**: Owner/admin via Sanity Studio
- **Sync mechanism**: GitHub Actions workflow (`sanity-json-update.yml`) — Sanity webhook triggers JSON file sync
- **Frontend reads**: Static JSON files (`data/*.json`), not direct Sanity API queries
- **Admin mutations**: Write directly to Sanity via `@sanity/client` with write token, then `revalidatePath()`
- **Document types**: 8 — product, brand, homepage, navigation, navItem, navLink, amazonLinks, siteSettings

*Source: tech-stack.md lines 71-73, tech-stack.md lines 154-162, data-flow.md lines 27-43, architecture.md lines 238-243*

## Next Steps
- Deploy Sanity schema (missing `variant`/`snapshot` fields for product_carousel and category_carousel)
- Add content preview functionality
- Consider adding more Sanity document types (blog posts, reviews)

## References
- `tech-stack.md` lines 154-162 — Sanity Studio configuration
- `data-flow.md` lines 27-43 — Sanity → JSON sync pipeline
- `studio-athletica/` — Standalone Sanity Studio
