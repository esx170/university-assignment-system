import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Manually adding department_id column...')
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Test if column already exists by trying to select it
    console.log('Testing if department_id column exists...')
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('department_id')
      .limit(1)

    if (!testError) {
      console.log('Column already exists!')
      
      // Step 2: Assign departments to users since column exists
      const { data: departments } = await supabaseAdmin
        .from('departments')
        .select('id, code, name')

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role')

      let assignmentCount = 0
      const assignments = []

      if (departments && profiles) {
        const csDept = departments.find(d => d.code === 'CS')
        const mathDept = departments.find(d => d.code === 'MATH')
        const seDept = departments.find(d => d.code === 'SE')

        for (const profile of profiles) {
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
        message: 'department_id column already exists - assigned departments to users',
        details: {
          columnExists: true,
          departmentAssignments: assignmentCount,
          assignments: assignments.slice(0, 10)
        }
      })
    }

    // Step 2: Column doesn't exist, try to add it using a workaround
    console.log('Column does not exist, attempting to add it...')
    
    // Create a temporary profile with department_id to force schema update
    const tempId = crypto.randomUUID()
    
    try {
      // This will fail but might trigger schema cache update
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: tempId,
          email: 'temp-schema-test@test.com',
          full_name: 'Temp User',
          role: 'student',
          department_id: null
        })
    } catch (insertError) {
      console.log('Insert failed as expected:', insertError)
    }

    // Try to use the SQL editor approach through RPC
    const sqlCommands = [
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID;',
      'ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id);'
    ]

    const results = []
    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql })
        results.push({ sql, success: !error, error: error?.message })
      } catch (rpcError) {
        results.push({ sql, success: false, error: 'RPC not available' })
      }
    }

    // Test if column now exists
    const { data: finalTest, error: finalTestError } = await supabaseAdmin
      .from('profiles')
      .select('department_id')
      .limit(1)

    if (!finalTestError) {
      return NextResponse.json({ 
        success: true,
        message: 'department_id column added successfully via SQL',
        details: {
          sqlResults: results,
          columnNowExists: true
        }
      })
    }

    return NextResponse.json({ 
      error: 'Could not add department_id column automatically',
      details: {
        sqlResults: results,
        testError: testError.message,
        finalTestError: finalTestError?.message
      },
      manualSql: 'ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);',
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Run: ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);',
        '4. Then run this API again to assign departments'
      ]
    }, { status: 500 })

  } catch (error: any) {
    console.error('Manual add department column error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}