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

async function checkAssignmentsColumns() {
  try {
    console.log('🔍 Checking assignments table columns...\n')

    // Try to insert a test record to see what columns are expected
    const testAssignment = {
      title: 'Test Assignment',
      description: 'Test description',
      course_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      due_date: new Date().toISOString(),
      max_points: 100,
      status: 'draft'
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert(testAssignment)
      .select()

    if (error) {
      console.log('❌ Insert failed (expected):', error.message)
      console.log('   This tells us about the table structure')
      
      // Try without instructor_id to see if that's the missing column
      if (error.message.includes('instructor_id')) {
        console.log('   ✅ Confirmed: instructor_id column is missing')
      }
    } else {
      console.log('✅ Insert succeeded (unexpected)')
      console.log('   Data:', data)
      
      // Clean up the test record
      if (data && data[0]) {
        await supabase.from('assignments').delete().eq('id', data[0].id)
        console.log('   Cleaned up test record')
      }
    }

    // Try to select with different column combinations
    console.log('\n🔍 Testing different column selections...')
    
    const tests = [
      { name: 'Basic columns', select: 'id, title, description' },
      { name: 'With course_id', select: 'id, title, course_id' },
      { name: 'With instructor_id', select: 'id, title, instructor_id' },
      { name: 'All columns', select: '*' }
    ]

    for (const test of tests) {
      const { data, error } = await supabase
        .from('assignments')
        .select(test.select)
        .limit(1)

      if (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`)
      } else {
        console.log(`   ✅ ${test.name}: Success`)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAssignmentsColumns()