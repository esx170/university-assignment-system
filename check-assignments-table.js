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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAssignmentsTable() {
  try {
    console.log('🔍 Checking assignments table structure...\n')

    // Try to query the assignments table directly
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)

    if (assignmentsError) {
      console.log('❌ Assignments table error:', assignmentsError.message)
      
      // Check if it's a "table doesn't exist" error
      if (assignmentsError.message.includes('does not exist') || assignmentsError.code === 'PGRST106') {
        console.log('   The assignments table does not exist in the database')
        console.log('   Need to apply the enhanced schema')
      } else {
        console.log('   Other error accessing assignments table')
      }
      return
    }

    console.log('✅ Assignments table exists and is accessible')
    console.log(`   Found ${assignments.length} assignments (showing max 1)`)
    
    if (assignments.length > 0) {
      console.log('\n📋 Sample assignment structure:')
      const sample = assignments[0]
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} = ${sample[key]}`)
      })
    }

    // Try to get total count
    const { count, error: countError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`\n📊 Total assignments in database: ${count}`)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAssignmentsTable()