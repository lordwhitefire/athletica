/**
 * Issue a one-time door-key link for an admin.
 *
 * Run from the repo root:
 *   node rollout/scripts/issue-admin-key.mjs admin@athletica.com
 *
 * Prints one URL. Send it to the admin privately. Opening it deposits the
 * door-key cookie and redirects to /admin/login. The link works once.
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
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node rollout/scripts/issue-admin-key.mjs <admin-email>');
    process.exit(1);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = loadEnv();

  // Look up the admin's auth user by email via the Auth Admin API.
  const userRes = curl(
    SUPABASE_URL + '/auth/v1/admin/users',
    '-H', 'apikey: ' + SUPABASE_SERVICE_ROLE_KEY,
    '-H', 'Authorization: Bearer ' + SUPABASE_SERVICE_ROLE_KEY
  );

  let userData;
  try {
    userData = JSON.parse(userRes);
  } catch (e) {
    console.error('Failed to parse user list response:', userRes.slice(0, 200));
    process.exit(1);
  }

  const user = (userData.users || []).find((u) => u.email === email);

  if (!user) {
    console.error('No Supabase auth user found for ' + email);
    console.log('Existing users:');
    (userData.users || []).forEach((u) => console.log('  -', u.email));
    process.exit(1);
  }

  const token = randomToken();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Insert the door key into rollout.admin_access_keys.
  const insertRes = curl(
    SUPABASE_URL + '/rest/v1/admin_access_keys',
    '-X', 'POST',
    '-H', 'apikey: ' + SUPABASE_SERVICE_ROLE_KEY,
    '-H', 'Authorization: Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
    '-H', 'Accept-Profile: rollout',
    '-H', 'Content-Profile: rollout',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      kind: 'door',
      user_id: user.id,
      token_hash: tokenHash,
      browser_label: email,
      expires_at: expiresAt,
    })
  );

  if (insertRes.includes('violates row-level security') || insertRes.includes('error')) {
    console.error('Failed to insert door key:', insertRes.slice(0, 300));
    process.exit(1);
  }

  const appUrl = process.env.ADMIN_APP_URL ?? 'http://localhost:3011';
  const link = appUrl + '/admin/key/' + token;

  console.log('Door-key link for ' + email + ':');
  console.log(link);
  console.log('');
  console.log('Send this privately. It works once, then expires.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
