/**
 * Issue a one-time invite code for a new admin.
 *
 * Run from the repo root:
 *   node rollout/scripts/issue-invite.mjs
 *
 * Prints one URL. Send it to the invitee privately. Opening it shows the
 * sign-up form; submitting it creates the account and deposits the door-key
 * cookie. The code works once.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * rollout/.env.local.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');

function loadEnv() {
  const src = fs.readFileSync(ENV_PATH, 'utf8');
  const get = (name) => {
    const line = src.split(/\r?\n/).find((l) => l.startsWith(name + '='));
    if (!line) throw new Error(name + ' not found in ' + ENV_PATH);
    return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  };
  return {
    SUPABASE_URL: get('NEXT_PUBLIC_SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: get('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

function randomToken() {
  return createHash('sha256').update(crypto.randomUUID() + Date.now().toString()).digest('hex');
}

function curl(url, ...extraArgs) {
  return execFileSync('curl', ['-s', url, ...extraArgs], { encoding: 'utf8' });
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = loadEnv();

  const token = randomToken();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  // Insert the invite code into rollout.admin_access_keys.
  const insertRes = curl(
    SUPABASE_URL + '/rest/v1/admin_access_keys',
    '-X', 'POST',
    '-H', 'apikey: ' + SUPABASE_SERVICE_ROLE_KEY,
    '-H', 'Authorization: Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
    '-H', 'Accept-Profile: rollout',
    '-H', 'Content-Profile: rollout',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      kind: 'invite',
      user_id: null,
      token_hash: tokenHash,
      browser_label: null,
      expires_at: expiresAt,
    })
  );

  if (insertRes.includes('violates row-level security') || insertRes.includes('"error"')) {
    console.error('Failed to insert invite code:', insertRes.slice(0, 300));
    process.exit(1);
  }

  const appUrl = process.env.ADMIN_APP_URL ?? 'http://localhost:3011';
  const link = appUrl + '/admin/signup?code=' + token;

  console.log('Invite code link:');
  console.log(link);
  console.log('');
  console.log('Send this privately. It works once, then expires (24 hours).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
