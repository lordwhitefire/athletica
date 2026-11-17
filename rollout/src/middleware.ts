// FM-01: Next.js middleware — Lock #2 (door-key) as a first-line filter.
//
// The door-key cookie does NOT authenticate anyone (per RE-05 athletica-own §2.1).
// Its only job: make /admin/* unreachable to anyone without the cookie.
// The actual auth (Lock 3, JWT role) is checked per-route in requireAdmin().
//
// A request to /admin/* without a valid door-key cookie → 404 (fail-silent).
// The door-key is validated against rollout.admin_access_keys (kind='door',
// not revoked, not expired). On a valid check, the route handler proceeds to
// Lock 3.

import { NextResponse, type NextRequest } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route-client';

export const config = {
  // Only the admin surface is gated here. The public storefront + /go/[id] + /affiliate/* are not.
  matcher: ['/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  // Fast path: if there's no door-key cookie at all, 404 immediately.
  const doorKey = req.cookies.get('admin_door_key')?.value;
  if (!doorKey) {
    return new NextResponse(null, { status: 404 });
  }

  // Validate the door-key against the DB (SHA-256 hash lookup, sliding renewal).
  // We use the route client (anon) + an RPC to avoid exposing the service key here.
  // The RPC `validate_door_key` is a SECURITY DEFINER function (owner creates it in Supabase;
  // see integration instructions) that hashes the cookie + looks up the row + slides expiry.
  const supabase = createRouteClient(req.cookies);
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc('validate_door_key', { token_value: doorKey });

  if (error || !data) {
    // Invalid / revoked / expired → 404. Do not reveal which.
    return new NextResponse(null, { status: 404 });
  }

  // Valid → let the request proceed to the route handler (Lock 3, requireAdmin).
  return NextResponse.next();
}
