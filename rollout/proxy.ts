import { NextRequest, NextResponse } from 'next/server'

// Supabase auth cookies are named sb-{projectRef}-auth-token.
// Any sb-* cookie means a session exists; we let the handler do the real check.
function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.startsWith('sb-'))
}

// Paths that must be reachable without a session (login, signup, key deposit).
const EXEMPT_PATHS = ['/admin/login', '/admin/signup']
const EXEMPT_PREFIXES = ['/admin/key/']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Let exempt routes through — nobody should be blocked from reaching sign-up/sign-in.
  if (EXEMPT_PATHS.includes(path)) return NextResponse.next()
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) return NextResponse.next()

  // Only admin routes are gated here.
  const isAdminRoute =
    path.startsWith('/admin/') || path.startsWith('/api/admin/')
  if (!isAdminRoute) return NextResponse.next()

  // Fast path: no session cookie → 404 immediately, never call Supabase.
  if (!hasSessionCookie(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Session cookie present → let the handler do the real requireAdmin() check.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
