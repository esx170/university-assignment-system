import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECKING SUPABASE SETTINGS ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Environment variables:', {
      url: supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      serviceKeyLength: supabaseServiceKey?.length,
      anonKeyLength: supabaseAnonKey?.length
    })

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Step 1: Check if we can connect to Supabase at all
    console.log('Testing basic Supabase connection...')
    
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('departments')
      .select('id')
      .limit(1)

    console.log('Health check:', {
      success: !healthError,
      error: healthError?.message,
      dataReceived: !!healthCheck
    })

    // Step 2: Check auth admin capabilities
    console.log('Testing auth admin capabilities...')
    
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()

    console.log('List users:', {
      success: !listUsersError,
      error: listUsersError?.message,
      userCount: users?.length || 0
    })

    // Step 3: Try to create a user with admin (this should always work)
    console.log('Testing admin user creation...')
    
    const testEmail = `admin.create.${Date.now()}@example.com`
    
    const { data: adminCreateData, error: adminCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true
    })

    console.log('Admin create user:', {
      success: !adminCreateError,
      error: adminCreateError?.message,
      userCreated: !!adminCreateData.user
    })

    // Clean up admin created user
    if (adminCreateData.user) {
      await supabaseAdmin.auth.admin.deleteUser(adminCreateData.user.id)
    }

    // Step 4: Check if signup is enabled in auth settings
    console.log('Checking auth configuration...')
    
    // Try to get auth settings (this might not be available via API)
    const { data: authConfig, error: authConfigError } = await supabaseAdmin
      .from('auth.config')
      .select('*')
      .limit(1)

    console.log('Auth config check:', {
      success: !authConfigError,
      error: authConfigError?.message,
      note: 'This might not be accessible via API'
    })

    // Step 5: Test different signup approaches
    console.log('Testing different signup approaches...')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test 1: Minimal signup
    const testEmail2 = `minimal.${Date.now()}@example.com`
    const { data: minimalData, error: minimalError } = await supabase.auth.signUp({
      email: testEmail2,
      password: 'password123'
    })

    console.log('Minimal signup:', {
      success: !minimalError,
      error: minimalError?.message,
      errorCode: minimalError?.status,
      userCreated: !!minimalData.user
    })

    // Test 2: Check if it's an email confirmation issue
    const testEmail3 = `noconfirm.${Date.now()}@example.com`
    const { data: noConfirmData, error: noConfirmError } = await supabase.auth.signUp({
      email: testEmail3,
      password: 'password123',
      options: {
        emailRedirectTo: undefined // Try without email confirmation
      }
    })

    console.log('No confirm signup:', {
      success: !noConfirmError,
      error: noConfirmError?.message,
      userCreated: !!noConfirmData.user
    })

    // Clean up test users
    if (minimalData.user) {
      await supabaseAdmin.auth.admin.deleteUser(minimalData.user.id)
    }
    if (noConfirmData.user) {
      await supabaseAdmin.auth.admin.deleteUser(noConfirmData.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase settings check completed',
      results: {
        connection: {
          success: !healthError,
          error: healthError?.message
        },
        adminAccess: {
          success: !listUsersError,
          error: listUsersError?.message,
          userCount: users?.length || 0
        },
        adminUserCreation: {
          success: !adminCreateError,
          error: adminCreateError?.message
        },
        authConfig: {
          accessible: !authConfigError,
          error: authConfigError?.message
        },
        signupTests: {
          minimal: {
            success: !minimalError,
            error: minimalError?.message,
            errorCode: minimalError?.status
          },
          noConfirm: {
            success: !noConfirmError,
            error: noConfirmError?.message
          }
        }
      },
      diagnosis: !healthError && !listUsersError && !adminCreateError
        ? minimalError
          ? `Signup is disabled or blocked. Error: ${minimalError.message}`
          : 'All systems appear to be working'
        : 'Basic Supabase connection or admin access issues',
      recommendations: minimalError
        ? [
            'Check Supabase Dashboard > Authentication > Settings',
            'Verify "Enable email confirmations" setting',
            'Check "Enable sign ups" setting',
            'Verify rate limiting settings',
            'Check for any custom auth hooks that might be blocking'
          ]
        : ['System appears to be working correctly']
    })

  } catch (error: any) {
    console.error('Settings check error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to check Supabase settings'
    }, { status: 500 })
  }
}