const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const envLines = envContent.split('\n')
const env = {}
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim()
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key.trim()] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkProfilesTable() {
  try {
    console.log('🔍 Checking profiles table structure...\n')

    // Get a sample profile to see the structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message)
      return
    }

    console.log('✅ Profiles table exists and is accessible')
    console.log(`   Found ${profiles.length} profiles (showing max 1)`)
    
    if (profiles.length > 0) {
      console.log('\n📋 Sample profile structure:')
      const sample = profiles[0]
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} = ${sample[key]}`)
      })
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`\n📊 Total profiles in database: ${count}`)
    }

    // Test specific columns that might be missing
    console.log('\n🔍 Testing specific columns...')
    
    const columnsToTest = [
      'id', 'email', 'full_name', 'role', 'student_id', 
      'department_id', 'is_active', 'created_at', 'updated_at'
    ]

    const existingColumns = []
    
    for (const column of columnsToTest) {
      const { data, error } = await supabase
        .from('profiles')
        .select(column)
        .limit(1)

      if (!error) {
        existingColumns.push(column)
      }
    }

    console.log('   ✅ Existing columns:', existingColumns.join(', '))
    console.log('   ❌ Missing columns:', columnsToTest.filter(col => !existingColumns.includes(col)).join(', '))

    // Check if users have is_active status
    if (existingColumns.includes('is_active')) {
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, email, is_active')
        .limit(5)

      console.log('\n👤 Sample user active status:')
      activeUsers?.forEach(user => {
        console.log(`   ${user.email}: ${user.is_active ? 'Active' : 'Inactive'}`)
      })
    } else {
      console.log('\n⚠️  is_active column does not exist - all users will show as inactive')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkProfilesTable()