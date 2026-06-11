import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'admin@athletica.com';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || '4603bb34-13ce55de';

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const body = await res.json();
  if (!res.ok && !body.id && !body.user) {
    // Only throw for unexpected errors — user lookup returns 200 with empty array
    if (!path.includes('/auth/v1/admin/users')) {
      throw new Error(`Supabase API error ${res.status}: ${body.msg || body.error || JSON.stringify(body)}`);
    }
  }
  return body;
}

async function run() {
  // 1. Check if admin user exists
  console.log(`🔍 Checking if admin user exists: ${ADMIN_EMAIL}`);

  const usersData = await supabaseFetch('/auth/v1/admin/users');

  // If users is an object with "users" key, use that; otherwise it might be the raw array
  const usersList = usersData.users || (Array.isArray(usersData) ? usersData : []);
  const existing = usersList.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log(`✅ Admin user FOUND: ${existing.email} (id: ${existing.id})`);

    // Ensure role is "admin" in profiles
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${existing.id}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      }
    );

    if (profileRes.status === 200) {
      // Profile exists — update role
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ role: 'admin' }),
      });
      console.log('✅ Profile role updated to "admin"');
    } else {
      // No profile yet — create one
      await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: existing.id,
          name: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin',
        }),
      });
      console.log('✅ Profile created with role "admin"');
    }

    console.log('\n✅ Admin is ready. You can now run the E2E tests.');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    return;
  }

  // 2. Create admin user via Admin API
  console.log('👤 Admin user not found. Creating now...');

  const createData = await supabaseFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Admin' },
    }),
  });

  const userId = createData.id;
  if (!userId) {
    console.error('❌ Failed to create user:', JSON.stringify(createData));
    process.exit(1);
  }

  console.log(`✅ Admin user CREATED: ${ADMIN_EMAIL} (id: ${userId})`);

  // 3. Create profile with admin role
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      name: 'Admin',
      email: ADMIN_EMAIL,
      role: 'admin',
    }),
  });

  if (!profileRes.ok && profileRes.status !== 409) {
    const body = await profileRes.json().catch(() => ({}));
    console.error('⚠️  Could not create profile:', body.message || body.error || profileRes.statusText);
  } else {
    console.log('✅ Profile created with role "admin"');
  }

  console.log('\n✅ Admin is ready. You can now run the E2E tests.');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

run().catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
