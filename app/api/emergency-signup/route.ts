import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, student_id, department_id } = body

    console.log('=== EMERGENCY SIGNUP - SIMPLE PROFILE CREATION ===')

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

    // Step 2: Handle department ID
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

    // Step 3: Create user directly in profiles table (no auth dependency)
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
    if (realDepartmentId) profileData.department_id = realDepartmentId

    console.log('Creating user directly in profiles table...')

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      
      // Try minimal profile
      const minimalData = {
        id: userId,
        email,
        full_name,
        role: 'student',
        created_at: new Date().toISOString()
      }

      const { data: minimalProfile, error: minimalError } = await supabaseAdmin
        .from('profiles')
        .insert(minimalData)
        .select()
        .single()

      if (minimalError) {
        return NextResponse.json({
          error: 'Failed to create user account',
          details: minimalError.message
        }, { status: 500 })
      }

      console.log('Minimal profile created successfully!')
    }

    console.log('User created successfully via emergency method!')

    // Store password temporarily in a simple way (for demo purposes)
    // In production, you'd want proper password hashing
    const tempPassword = Buffer.from(password).toString('base64')

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role: 'student',
        student_id
      },
      tempAuth: {
        email,
        password: tempPassword // Base64 encoded for temporary storage
      },
      message: 'Account created successfully! Use the emergency signin.',
      method: 'Emergency bypass - direct profile creation'
    })

  } catch (error: any) {
    console.error('Emergency signup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}