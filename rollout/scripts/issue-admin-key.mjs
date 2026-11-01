/**
 * Issue a one-time door-key link for an admin.
 *
 * Run from the repo root:
 *   node rollout/scripts/issue-admin-key.mjs admin@athletica.com
 *
 * Prints one URL. Send it to the admin privately. Opening it deposits the
 * door-key cookie and redirects to /admin/login. The link works once.
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from rollout/.env.local.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ENV_PATH = path.resolve(
  process.cwd(),
  'rollout/.env.local'
);

function loadEnv(): { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string } {
  const src = fs.readFileSync(ENV_PATH, 'utf8');
  const get = (name: string) => {
    const line = src.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (!line) throw new Error(`${name} not found in ${ENV_PATH}`);
    return line.slice(`${name}=`.length).trim().replace(/^["']|["']$/g, '');
  };
  return { SUPABASE_URL: get('SUPABASE_URL'), SUPABASE_SERVICE_ROLE_KEY: get('SUPABASE_SERVICE_ROLE_KEY') };
}

function randomToken(): string {
  return createHash('sha256').update(crypto.randomUUID() + Date.now().toString()).digest('hex');
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node rollout/scripts/issue-admin-key.mjs <admin-email>');
    process.exit(1);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = loadEnv();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the admin's auth user by email.
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (userError || !users) {
    console.error(`No Supabase auth user found for ${email}`);
    process.exit(1);
  }

  const token = randomToken();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from('admin_access_keys')
    .insert({
      kind: 'door',
      user_id: users.id,
      token_hash: tokenHash,
      browser_label: email,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error('Failed to insert door key:', insertError.message);
    process.exit(1);
  }

  const base = SUPABASE_URL.replace('.supabase.co', '').replace('https://', '');
  // The link is served by the Next.js app, not Supabase. Use localhost:3011
  // in dev; production URL comes from your deployment.
  const appUrl = process.env.ADMIN_APP_URL ?? 'http://localhost:3011';
  const link = `${appUrl}/admin/key/${token}`;

  console.log(`Door-key link for ${email}:`);
  console.log(link);
  console.log('');
  console.log('Send this privately. It works once, then expires.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
