# Area 56 — Admin Panel

## Status
✅ Decided

## Decisions Made
- **Architecture**: Embedded in the same Next.js app (routes under `/admin/*`)
- **Layout**: AdminShell wrapper with `force-dynamic` export
- **Auth**: Supabase Auth + `profiles.role === "admin"` check (cookie-based session)
- **Access control**: Admin-only routes protected by server-side session verification
- **Features built**:
  - Dashboard with stats, quick actions, preview hub
  - Homepage Editor (redesigned with DnD via dnd-kit, EditPopup, Overview grid, 9 variant forms)
  - Product CRUD (create/edit/delete with image upload, gallery, sizes, prices)
  - Brands Manager (CRUD with logo upload)
  - Navigation Editor (tree-based, drag-and-drop)
  - Media Library (image upload and management)
  - Amazon Links Editor (affiliate link management)
  - Batch Upload (CSV import with parsing)
  - Site Settings (logo, brand, footer, social, copyright)
  - Build Status (Vercel deployment status display)

*Source: architecture.md lines 246-259, key-findings.md lines 18-30*

## Next Steps
- Build admin order management panel (requires order management first)
- Build admin user management panel (list users, edit roles)
- Fix homepage editor bugs (#1 AutoSuggest links, #3 Save All, #4 duplicate query, #11 >60s load time)
- Complete variant-specific forms for product_carousel and category_carousel

## References
- `architecture.md` lines 246-259 — Admin panel structure
- `key-findings.md` lines 18-30 — Built admin features
- `app/admin/` — Admin routes
- `src/components/admin/` — Admin components
