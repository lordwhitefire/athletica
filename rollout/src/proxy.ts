import { NextRequest, NextResponse } from "next/server";

// Supabase auth cookies are named sb-{projectRef}-auth-token.
// Any sb-* cookie means a session exists; we let the handler do the real check.
function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
}

// Paths that must stay reachable without a session:
//  - /admin/signin       — gated by the door-key cookie inside the page itself
//  - /admin/signup       — gated by the one-time invite code inside the page itself
//  - /admin/key/*        — the one-time link that deposits the door-key cookie
//  - /api/admin/auth/*   — signin / signup / signout run before or outside a session
const EXEMPT_PATHS = ["/admin/signin", "/admin/signup"];
const EXEMPT_PREFIXES = ["/admin/key/", "/api/admin/auth/"];

// Duplicated from src/lib/auth/door-key.ts on purpose: the proxy must not rely
// on shared modules — Next docs: "Proxy is meant to be invoked separately of
// your render code... you should not attempt relying on shared modules."
const DOOR_KEY_COOKIE = "admin_door_key";
const DOOR_KEY_MAX_AGE = 30 * 24 * 60 * 60;

// Lock #2 — the door key. The cookie is not authentication; it only makes
// /admin/* and /api/admin/* unreachable to anyone without it. Validated
// against rollout.admin_access_keys through the SECURITY DEFINER RPC, so the
// service-role key never enters the gate.
async function hasValidDoorKey(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(DOOR_KEY_COOKIE)?.value;
  if (!token) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/validate_door_key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Profile": "rollout",
        "Accept-Profile": "rollout",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ token_value: token }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    return typeof data === "string" && data.length > 0;
  } catch {
    return false;
  }
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute =
    path.startsWith("/admin/") || path.startsWith("/api/admin/");

  const res = NextResponse.next();

  // Slide the door-key cookie's browser lifetime on every admin visit, so an
  // active admin never needs a second link. This only extends the browser-side
  // expiry — it grants nothing. Validity is checked against the server's record
  // on every admin request below.
  const doorKey = req.cookies.get(DOOR_KEY_COOKIE)?.value;
  if (isAdminRoute && doorKey) {
    const secure = req.nextUrl.protocol === "https:";
    // The matcher covers /admin/* and /api/admin/*. A cookie scoped only to
    // /admin is not sent to /api/admin/*, so keep one cookie per path.
    for (const path of ["/admin", "/api/admin"]) {
      const parts = [
        `${DOOR_KEY_COOKIE}=${doorKey}`,
        `Path=${path}`,
        "HttpOnly",
        secure ? "Secure" : "",
        "SameSite=Lax",
        `Max-Age=${DOOR_KEY_MAX_AGE}`,
      ].filter(Boolean);
      res.headers.append("Set-Cookie", parts.join("; "));
    }
  }

  // Let exempt routes through — nobody should be blocked from reaching sign-in/sign-up.
  if (EXEMPT_PATHS.includes(path)) return res;
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) return res;

  // Only admin routes are gated here.
  if (!isAdminRoute) return res;

  // Lock #2: no valid door key → 404, never reach the app.
  if (!(await hasValidDoorKey(req))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // No session cookie → 404 immediately.
  if (!hasSessionCookie(req)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Session cookie present → let the handler / page do the real check.
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};