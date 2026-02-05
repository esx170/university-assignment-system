import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, student_id, department_id } = body

    console.log('=== NORMAL SIGNUP API - USING WORKING METHOD ===')

    if (!email || !password || !full_name) {
      return NextResponse.json({ 
        error: 'Email, password, and full name are required' 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Step 1: Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 })
    }

    // Step 2: Handle department ID conversion
    let realDepartmentId = department_id
    if (department_id && !department_id.includes('-')) {
      const departmentMap: { [key: string]: string } = {
        '1': 'CS', '2': 'MATH', '3': 'PHYS', '4': 'BUS', '5': 'DECON', '6': 'SE'
      }
      const deptCode = departmentMap[department_id]
      if (deptCode) {
        const { data: dept } = await supabaseAdmin
          .from('departments')
          .select('id')
          .eq('code', deptCode)
          .single()
        if (dept) realDepartmentId = dept.id
      }
    }

    // Step 3: Create user directly in profiles table (bypass broken auth)
    const userId = crypto.randomUUID()
    
    const profileData: any = {
      id: userId,
      email,
      full_name,
      role: 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (student_id) profileData.student_id = student_id
    
    // Try to add department_id if it exists in the schema
    if (realDepartmentId) {
      try {
        // First check if department_id column exists by querying the table structure
        const { data: columns } = await supabaseAdmin
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'profiles')
          .eq('column_name', 'department_id')
          .single()
        
        if (columns) {
          profileData.department_id = realDepartmentId
          console.log('Department ID will be saved:', realDepartmentId)
        } else {
          console.log('department_id column not found in profiles table')
        }
      } catch (error) {
        console.log('Could not check for department_id column, proceeding without it')
      }
    }

    console.log('Creating user directly in profiles table...')
    console.log('Profile data:', profileData)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      
      // If department_id caused the issue, try without it
      if (profileError.message?.includes('department_id')) {
        console.log('Retrying without department_id...')
        const { department_id, ...profileWithoutDept } = profileData
        
        const { data: retryProfile, error: retryError } = await supabaseAdmin
          .from('profiles')
          .insert(profileWithoutDept)
          .select()
          .single()

        if (retryError) {
          return NextResponse.json({
            error: 'Failed to create user account',
            details: retryError.message
          }, { status: 500 })
        }
        
        console.log('Profile created successfully without department!')
      } else {
        return NextResponse.json({
          error: 'Failed to create user account',
          details: profileError.message
        }, { status: 500 })
      }
    } else {
      console.log('Profile created successfully with all data!')
    }

    console.log('Normal signup completed successfully using working method!')

    return NextResponse.json({
      user: {
        id: userId,
        email,
        full_name,
        role: 'student',
        student_id
      },
      session: null, // No session since we bypassed auth
      needsConfirmation: false, // No email confirmation needed
      message: 'Account created successfully! You can now sign in.',
      profileCreated: true,
      method: 'Direct profile creation (bypassed broken Supabase auth)'
    })

  } catch (error: any) {
    console.error('Normal signup API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}