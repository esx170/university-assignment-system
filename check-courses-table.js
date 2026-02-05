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

async function checkCoursesTable() {
  try {
    console.log('🔍 Checking courses table structure...\n')

    // Try to query the courses table directly
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)

    if (coursesError) {
      console.log('❌ Courses table error:', coursesError.message)
      return
    }

    console.log('✅ Courses table exists and is accessible')
    console.log(`   Found ${courses.length} courses (showing max 1)`)
    
    if (courses.length > 0) {
      console.log('\n📋 Sample course structure:')
      const sample = courses[0]
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} = ${sample[key]}`)
      })
    }

    // Try to get total count
    const { count, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`\n📊 Total courses in database: ${count}`)
    }

    // Test the relationship query that's failing
    console.log('\n🔗 Testing courses-departments relationship...')
    const { data: coursesWithDepts, error: relationError } = await supabase
      .from('courses')
      .select(`
        *,
        departments (
          id,
          name,
          code
        )
      `)
      .limit(1)

    if (relationError) {
      console.log('❌ Relationship query failed:', relationError.message)
      console.log('   This means the foreign key relationship is missing')
    } else {
      console.log('✅ Relationship query works')
      console.log('   Sample with department:', JSON.stringify(coursesWithDepts[0], null, 2))
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkCoursesTable()