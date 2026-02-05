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

async function showAssignmentsStructure() {
  try {
    console.log('🔍 Showing actual assignments table structure...\n')

    // Insert a minimal test record to see what columns exist
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title: 'Test Assignment',
        description: 'Test description',
        course_id: '00000000-0000-0000-0000-000000000000',
        due_date: new Date().toISOString(),
        max_points: 100
      })
      .select()

    if (error) {
      console.log('❌ Insert failed:', error.message)
      console.log('   Error details:', error)
    } else {
      console.log('✅ Insert succeeded')
      console.log('\n📋 Actual table structure (from inserted record):')
      
      if (data && data[0]) {
        const record = data[0]
        Object.keys(record).forEach(key => {
          console.log(`   ${key}: ${typeof record[key]} = ${record[key]}`)
        })
        
        // Clean up the test record
        await supabase.from('assignments').delete().eq('id', record.id)
        console.log('\n🧹 Cleaned up test record')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

showAssignmentsStructure()