// Script to create initial admin user
// Run this once to set up your first admin account

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    const adminData = {
      email: 'admin@university.edu',
      password: 'Admin123!@#',
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin',
        student_id: null
      },
      email_confirm: true
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser(adminData)

    if (error) {
      console.error('Error creating admin user:', error.message)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminData.email)
    console.log('🔑 Password:', adminData.password)
    console.log('👤 User ID:', data.user.id)
    console.log('')
    console.log('You can now sign in with these credentials and access /admin')
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

createAdminUser()