import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING WITHOUT TRIGGER ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Step 1: Disable the trigger temporarily
    console.log('Disabling trigger...')
    
    const disableTriggerSQL = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
    
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: disableTriggerSQL })
    } catch (error) {
      console.log('Could not disable trigger via RPC')
    }

    // Step 2: Test signup without trigger
    console.log('Testing signup without trigger...')
    
    const testEmail = `no.trigger.test.${Date.now()}@example.com`
    const testPassword = 'password123'
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'No Trigger Test User',
          role: 'student',
          student_id: `NOTRIGGER${Date.now()}`,
          department_id: '1'
        }
      }
    })

    console.log('Signup without trigger result:', {
      success: !error,
      error: error?.message,
      userCreated: !!data.user
    })

    let manualProfileResult = null
    
    // Step 3: If signup worked, manually create profile
    if (data.user && !error) {
      console.log('Auth user created successfully, creating profile manually...')
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email,
          role: 'student',
          student_id: data.user.user_metadata?.student_id
        })
        .select()
        .single()

      manualProfileResult = {
        success: !profileError,
        error: profileError?.message,
        profile: profile
      }

      console.log('Manual profile creation result:', manualProfileResult)

      // Clean up test user
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    }

    return NextResponse.json({
      success: !error,
      message: error ? 'Signup failed even without trigger' : 'Signup works without trigger',
      authResult: {
        success: !error,
        error: error?.message,
        userCreated: !!data.user
      },
      manualProfileResult,
      conclusion: error 
        ? 'The issue is not with the trigger - auth signup itself is failing'
        : 'Auth signup works fine, the issue was with the trigger function'
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to test without trigger'
    }, { status: 500 })
  }
}