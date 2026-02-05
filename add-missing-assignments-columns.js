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

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to assignments table...\n')

    // Add instructor_id column
    console.log('1. Adding instructor_id column...')
    const { error: instructorIdError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE assignments 
        ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
      `
    })

    if (instructorIdError) {
      console.log('   ❌ Failed to add instructor_id:', instructorIdError.message)
    } else {
      console.log('   ✅ instructor_id column added successfully')
    }

    // Add status column
    console.log('2. Adding status column...')
    const { error: statusError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE assignments 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'closed'));
      `
    })

    if (statusError) {
      console.log('   ❌ Failed to add status:', statusError.message)
    } else {
      console.log('   ✅ status column added successfully')
    }

    // Verify the changes
    console.log('\n3. Verifying changes...')
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

    console.log('   ✅ Current columns:', existingColumns.join(', '))
    
    const missingColumns = possibleColumns.filter(col => !existingColumns.includes(col))
    if (missingColumns.length === 0) {
      console.log('   🎉 All required columns are now present!')
    } else {
      console.log('   ❌ Still missing:', missingColumns.join(', '))
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

addMissingColumns()