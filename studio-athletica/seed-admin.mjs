import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
})

const password =
    process.env.ADMIN_TEST_PASSWORD ||
    crypto.randomBytes(4).toString('hex') + '-' + crypto.randomBytes(4).toString('hex')
const email = process.env.ADMIN_TEST_EMAIL || 'admin@athletica.com'
const generated = !process.env.ADMIN_TEST_PASSWORD

async function main() {
    const { data: existing } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'admin')
        .single()

    if (existing) {
        const { error } = await supabase.auth.admin.updateUserById(existing.id, { password })
        if (error) throw error
        console.log(`✅ Admin account UPDATED`)
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Admin' },
        })
        if (error) throw error

        await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', data.user.id)

        console.log(`✅ Admin account CREATED`)
    }

    console.log(`   Email:    ${email}`)
    if (generated) {
        console.log(`   Password: ${password}`)
        console.log(`\n⚠️  Save this password somewhere safe!`)
    } else {
        console.log(`   Password: (from ADMIN_TEST_PASSWORD env)`)
    }
}

main().catch(console.error)
