import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('🔧 Adding missing columns to courses table using SQL...')

    const results = []

    // Add department_id column
    try {
      console.log('1. Adding department_id column...')
      const { error: deptIdError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);`
      })
      
      if (deptIdError) {
        console.log('   Error:', deptIdError.message)
        results.push({ column: 'department_id', status: 'failed', error: deptIdError.message })
      } else {
        console.log('   ✅ department_id column added')
        results.push({ column: 'department_id', status: 'success' })
      }
    } catch (error: any) {
      results.push({ column: 'department_id', status: 'error', error: error.message })
    }

    // Add is_active column
    try {
      console.log('2. Adding is_active column...')
      const { error: activeError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`
      })
      
      if (activeError) {
        console.log('   Error:', activeError.message)
        results.push({ column: 'is_active', status: 'failed', error: activeError.message })
      } else {
        console.log('   ✅ is_active column added')
        results.push({ column: 'is_active', status: 'success' })
      }
    } catch (error: any) {
      results.push({ column: 'is_active', status: 'error', error: error.message })
    }

    // Add credits column
    try {
      console.log('3. Adding credits column...')
      const { error: creditsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;`
      })
      
      if (creditsError) {
        console.log('   Error:', creditsError.message)
        results.push({ column: 'credits', status: 'failed', error: creditsError.message })
      } else {
        console.log('   ✅ credits column added')
        results.push({ column: 'credits', status: 'success' })
      }
    } catch (error: any) {
      results.push({ column: 'credits', status: 'error', error: error.message })
    }

    // Add max_enrollment column
    try {
      console.log('4. Adding max_enrollment column...')
      const { error: maxEnrollError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_enrollment INTEGER DEFAULT 50;`
      })
      
      if (maxEnrollError) {
        console.log('   Error:', maxEnrollError.message)
        results.push({ column: 'max_enrollment', status: 'failed', error: maxEnrollError.message })
      } else {
        console.log('   ✅ max_enrollment column added')
        results.push({ column: 'max_enrollment', status: 'success' })
      }
    } catch (error: any) {
      results.push({ column: 'max_enrollment', status: 'error', error: error.message })
    }

    // Update existing courses with default values
    console.log('5. Updating existing courses with default values...')
    
    // Get all courses and departments
    const { data: courses } = await supabaseAdmin.from('courses').select('id, code')
    const { data: departments } = await supabaseAdmin.from('departments').select('id, code')
    
    const updateResults = []
    
    for (const course of courses || []) {
      try {
        // Find matching department
        const coursePrefix = course.code.substring(0, 2).toUpperCase()
        let matchingDept = departments?.find(d => 
          d.code.startsWith(coursePrefix) || 
          course.code.startsWith(d.code)
        )
        
        if (!matchingDept) {
          matchingDept = departments?.find(d => d.code === 'CS')
        }

        // Update using SQL to ensure we can set the new columns
        const updateSql = `
          UPDATE courses 
          SET 
            department_id = '${matchingDept?.id || ''}',
            is_active = true,
            credits = 3,
            max_enrollment = 50
          WHERE id = '${course.id}';
        `

        const { error: updateError } = await supabaseAdmin.rpc('exec_sql', { sql: updateSql })
        
        if (updateError) {
          updateResults.push({ course: course.code, status: 'failed', error: updateError.message })
        } else {
          updateResults.push({ course: course.code, status: 'success', department: matchingDept?.code })
        }
      } catch (error: any) {
        updateResults.push({ course: course.code, status: 'error', error: error.message })
      }
    }

    // Verify the changes
    const { data: updatedCourse } = await supabaseAdmin
      .from('courses')
      .select('*')
      .limit(1)
      .single()

    return NextResponse.json({
      message: 'Courses table columns added successfully',
      columnResults: results,
      updateResults,
      sampleCourse: updatedCourse,
      totalCourses: courses?.length || 0,
      successfulUpdates: updateResults.filter(r => r.status === 'success').length
    })

  } catch (error: any) {
    console.error('Add courses columns error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}