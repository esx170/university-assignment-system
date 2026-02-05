import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, role, student_id, primary_department_id } = body

    console.log('=== DEBUG CREATE USER ===')
    console.log('Request body:', body)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase configuration'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Step 1: Check if department exists
    if (primary_department_id) {
      const { data: dept, error: deptError } = await supabaseAdmin
        .from('departments')
        .select('id, name, code')
        .eq('id', primary_department_id)
        .single()

      console.log('Department check:', { dept, deptError })
      
      if (deptError || !dept) {
        return NextResponse.json({
          error: 'Invalid department ID',
          details: deptError?.message || 'Department not found',
          department_id: primary_department_id
        }, { status: 400 })
      }
    }

    // Step 2: Create auth user
    console.log('Creating auth user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
        role,
        student_id,
        department_id: primary_department_id
      },
      email_confirm: true
    })

    console.log('Auth user creation result:', { 
      success: !!newUser.user, 
      userId: newUser.user?.id,
      error: createError 
    })

    if (createError) {
      return NextResponse.json({ 
        error: 'Failed to create auth user',
        details: createError.message
      }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ 
        error: 'Auth user creation returned null' 
      }, { status: 500 })
    }

    // Step 3: Wait and check if profile was created by trigger
    console.log('Waiting for trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()

    console.log('Profile check:', { profile, profileError })

    // Step 4: If no profile, create manually
    if (profileError || !profile) {
      console.log('Creating profile manually...')
      
      const profileData: any = {
        id: newUser.user.id,
        email,
        full_name,
        role,
        created_at: new Date().toISOString()
      }

      // Add optional fields
      if (student_id) profileData.student_id = student_id
      if (primary_department_id) {
        // Try to add department_id if column exists
        try {
          profileData.department_id = primary_department_id
        } catch (error) {
          console.log('Department column not available')
        }
      }

      const { data: createdProfile, error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      console.log('Manual profile creation:', { createdProfile, createProfileError })

      if (createProfileError) {
        return NextResponse.json({
          error: 'Failed to create profile',
          details: createProfileError.message,
          authUser: newUser.user,
          profileData
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'User created successfully (manual profile)',
        user: createdProfile,
        authUser: newUser.user
      })
    }

    return NextResponse.json({
      message: 'User created successfully (trigger profile)',
      user: profile,
      authUser: newUser.user
    })

  } catch (error: any) {
    console.error('Debug create user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}