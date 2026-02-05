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

async function showTableStructures() {
  try {
    console.log('🔍 Checking database table structures...\n')

    // Check courses table
    console.log('📚 Courses table:')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)

    if (coursesError) {
      console.log('   ❌ Error:', coursesError.message)
    } else {
      console.log(`   ✅ Found ${courses.length} courses`)
      if (courses.length > 0) {
        console.log('   Sample course structure:')
        Object.keys(courses[0]).forEach(key => {
          console.log(`     ${key}: ${typeof courses[0][key]}`)
        })
      }
    }

    // Check assignments table structure by trying different selects
    console.log('\n📝 Assignments table structure test:')
    
    const possibleColumns = [
      'id', 'title', 'description', 'course_id', 'due_date', 'max_points',
      'instructor_id', 'status', 'created_at', 'updated_at'
    ]

    const existingColumns = []
    
    for (const column of possibleColumns) {
      const { data, error } = await supabase
        .from('assignments')
        .select(column)
        .limit(1)

      if (!error) {
        existingColumns.push(column)
      }
    }

    console.log('   ✅ Existing columns:', existingColumns.join(', '))
    console.log('   ❌ Missing columns:', possibleColumns.filter(col => !existingColumns.includes(col)).join(', '))

    // Check profiles table
    console.log('\n👤 Profiles table:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      console.log('   ❌ Error:', profilesError.message)
    } else {
      console.log(`   ✅ Found ${profiles.length} profiles`)
      if (profiles.length > 0) {
        console.log('   Sample profile structure:')
        Object.keys(profiles[0]).forEach(key => {
          console.log(`     ${key}: ${typeof profiles[0][key]}`)
        })
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

showTableStructures()