import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Adding department_id column to profiles table...')
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Try to add the column using SQL
    console.log('Attempting to add department_id column...')
    
    // First, let's try a simple approach - just add the column without foreign key constraint
    const { data: addColumnResult, error: addColumnError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID;'
    })

    if (addColumnError) {
      console.error('Failed to add column via exec_sql:', addColumnError)
      
      // Alternative approach: try to insert a test record to see if column exists
      const testId = crypto.randomUUID()
      const { error: testError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: testId,
          email: 'test-column-check@test.com',
          full_name: 'Test User',
          role: 'student',
          department_id: null
        })

      // Clean up test record
      if (!testError) {
        await supabaseAdmin.from('profiles').delete().eq('id', testId)
        return NextResponse.json({ 
          success: true,
          message: 'department_id column already exists and is working'
        })
      }

      return NextResponse.json({ 
        error: 'Failed to add department_id column',
        details: addColumnError.message,
        suggestion: 'Please add the column manually in Supabase SQL Editor:\nALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);'
      }, { status: 500 })
    }

    console.log('Column addition successful, now adding foreign key constraint...')

    // Step 2: Add foreign key constraint
    const { data: fkResult, error: fkError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id);'
    })

    if (fkError) {
      console.log('Foreign key constraint failed, but column should exist:', fkError.message)
    }

    // Step 3: Verify the column exists by testing an update
    console.log('Verifying column exists...')
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (profilesError) {
      throw new Error('Failed to query profiles: ' + profilesError.message)
    }

    if (profiles && profiles.length > 0) {
      // Test updating with department_id
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ department_id: null })
        .eq('id', profiles[0].id)

      if (updateError) {
        return NextResponse.json({ 
          error: 'Column may not exist - update test failed',
          details: updateError.message
        }, { status: 500 })
      }
    }

    // Step 4: Assign departments to users
    console.log('Assigning departments to users...')
    
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('id, code, name')

    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')

    let assignmentCount = 0
    const assignments = []

    if (departments && allProfiles) {
      const csDept = departments.find(d => d.code === 'CS')
      const mathDept = departments.find(d => d.code === 'MATH')
      const seDept = departments.find(d => d.code === 'SE')

      for (const profile of allProfiles) {
        let deptId = null
        
        // Smart assignment
        if (profile.email.includes('cs') || profile.role === 'instructor') {
          deptId = csDept?.id
        } else if (profile.email.includes('math')) {
          deptId = mathDept?.id
        } else if (profile.email.includes('se')) {
          deptId = seDept?.id
        } else {
          // Round-robin for students
          deptId = departments[assignmentCount % departments.length]?.id
        }

        if (deptId) {
          const { error: assignError } = await supabaseAdmin
            .from('profiles')
            .update({ department_id: deptId })
            .eq('id', profile.id)

          if (!assignError) {
            assignmentCount++
            const dept = departments.find(d => d.id === deptId)
            assignments.push({
              email: profile.email,
              department: dept?.code
            })
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'department_id column added and configured successfully',
      details: {
        columnAdded: true,
        foreignKeyAdded: !fkError,
        departmentAssignments: assignmentCount,
        assignments: assignments.slice(0, 5) // Show first 5 assignments
      }
    })

  } catch (error: any) {
    console.error('Add department column error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}