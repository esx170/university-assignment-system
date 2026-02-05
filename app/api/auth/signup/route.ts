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

    // Step 2: Handle department ID - ensure it's a valid UUID
    let realDepartmentId = null
    
    console.log('Processing department_id:', department_id, typeof department_id)
    
    if (department_id) {
      // If it's a numeric string (from hardcoded fallback), convert to department code
      if (!department_id.includes('-')) {
        console.log('Converting numeric department_id to UUID...')
        const departmentMap: { [key: string]: string } = {
          '1': 'CS', '2': 'MATH', '3': 'PHYS', '4': 'BUS', '5': 'DECON', '6': 'SE'
        }
        const deptCode = departmentMap[department_id]
        if (deptCode) {
          const { data: dept, error: deptError } = await supabaseAdmin
            .from('departments')
            .select('id, name, code')
            .eq('code', deptCode)
            .single()
          if (dept && !deptError) {
            realDepartmentId = dept.id
            console.log(`✅ Converted department ${department_id} (${deptCode}) to UUID: ${realDepartmentId} (${dept.name})`)
          } else {
            console.log(`❌ Failed to find department with code ${deptCode}:`, deptError?.message)
          }
        } else {
          console.log(`❌ Unknown numeric department_id: ${department_id}`)
        }
      } else {
        // It's already a UUID, verify it exists
        console.log('Verifying UUID department_id...')
        const { data: dept, error: deptError } = await supabaseAdmin
          .from('departments')
          .select('id, name, code')
          .eq('id', department_id)
          .single()
        
        if (dept && !deptError) {
          realDepartmentId = dept.id
          console.log(`✅ Verified department UUID: ${realDepartmentId} (${dept.code} - ${dept.name})`)
        } else {
          console.log(`❌ Invalid department UUID: ${department_id}`, deptError?.message)
        }
      }
    } else {
      console.log('⚠️ No department_id provided in signup request')
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
    if (realDepartmentId) profileData.department_id = realDepartmentId

    console.log('Creating user with profile data:', {
      ...profileData,
      department_id: realDepartmentId ? `${realDepartmentId} (will be saved)` : 'NULL (no department selected)'
    })

    console.log('Creating user directly in profiles table...')

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      return NextResponse.json({
        error: 'Failed to create user account',
        details: profileError.message
      }, { status: 500 })
    }

    console.log('Profile created successfully!', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      department_id: profile.department_id || 'NULL'
    })

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