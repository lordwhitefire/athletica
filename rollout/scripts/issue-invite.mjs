#!/usr/bin/env node
// FM-01: Invite-code issuance script — the owner runs this locally to generate
// an admin invite code. The code is redeemed at /admin/signup?code=...
//
// This was flagged as "not in repo" by RE-05 athletica-own §4. This script closes that gap.
//
// Usage:
//   node scripts/issue-invite.mjs <admin-user-id> [browser-label]
//
// It inserts a row into rollout.admin_access_keys with:
//   kind='invite', user_id=<the admin this invite is for (nullable)>,
//   token_hash=sha256(code), expires_at=now()+24h, used_at=null, revoked_at=null.
//
// The raw code is printed ONCE. It is never stored.
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local (or env).

import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local or env.');
  process.exit(1);
}

const userId = process.argv[2];
const browserLabel = process.argv[3] || 'invite';
if (!userId) {
  console.error('Usage: node scripts/issue-invite.mjs <admin-user-id> [browser-label]');
  console.error('  admin-user-id = the auth.users id this invite is bound to (optional in future; required now).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: 'rollout' } });

// Generate a random invite code (32 bytes → url-safe base64).
const rawCode = randomBytes(32).toString('base64url');
const tokenHash = createHash('sha256').update(rawCode).digest('hex');
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

const { error } = await supabase
  .from('admin_access_keys')
  .insert({
    kind: 'invite',
    user_id: userId,
    token_hash: tokenHash,
    browser_label: browserLabel,
    expires_at: expiresAt,
    used_at: null,
    revoked_at: null,
  });

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log('Invite code issued (raw code shown ONCE — copy it now):');
console.log('');
console.log('  Code:        ' + rawCode);
console.log('  Signup URL:  /admin/signup?code=' + rawCode);
console.log('  Expires:     ' + expiresAt);
console.log('  Bound to:    ' + userId);
console.log('');
console.log('The raw code is NOT stored. Only the SHA-256 hash is in the DB.');
