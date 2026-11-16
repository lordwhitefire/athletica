# Area 44 — User Management

## Status
✅ Decided (Partial)

## Decisions Made
- **User profiles**: Stored in Supabase `profiles` table (id, name, email, avatar_url, role, created_at, updated_at)
- **Profile creation**: Auto-created on signup via DB trigger
- **Avatar upload**: Not implemented (avatar_url column exists but no upload UI)
- **Account settings**: `/account` page exists for viewing/editing profile
- **Account deletion**: Not implemented (no soft/hard delete flow)
- **Admin user management**: Not implemented (no admin panel for managing users)
- **RLS policies**: Users can view/update own profile only

*Source: data-flow.md lines 213-233, architecture.md line 17 (account route)*

## Next Steps
- Add avatar upload functionality
- Add account deletion flow (soft delete recommended)
- Build admin user management panel (list, search, filter, edit roles)
- Add account settings page for email/password changes

## References
- `data-flow.md` lines 213-233 — Supabase schema (profiles table)
- `app/account/page.tsx` — Account page
