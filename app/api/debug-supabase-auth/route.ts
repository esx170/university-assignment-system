import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUGGING SUPABASE AUTH ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      url: supabaseUrl
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Step 1: Check Supabase connection
    console.log('Testing Supabase connection...')
    
    const { data: connectionTest, error: connectionError } = await supabase
      .from('departments')
      .select('count')
      .limit(1)

    console.log('Connection test:', {
      success: !connectionError,
      error: connectionError?.message
    })

    // Step 2: Check auth configuration
    console.log('Checking auth configuration...')
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    console.log('Auth admin access:', {
      success: !listError,
      error: listError?.message,
      userCount: users?.length || 0
    })

    // Step 3: Try creating user with admin client
    console.log('Testing user creation with admin client...')
    
    const testEmail = `admin.test.${Date.now()}@example.com`
    
    const { data: adminUserData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      user_metadata: {
        full_name: 'Admin Test User',
        role: 'student',
        student_id: `ADMIN${Date.now()}`
      },
      email_confirm: true
    })

    console.log('Admin user creation:', {
      success: !adminUserError,
      error: adminUserError?.message,
      userCreated: !!adminUserData.user
    })

    // Clean up admin test user
    if (adminUserData.user) {
      await supabaseAdmin.auth.admin.deleteUser(adminUserData.user.id)
    }

    // Step 4: Check if signup is disabled in Supabase settings
    console.log('Testing anon client signup...')
    
    const testEmail2 = `anon.test.${Date.now()}@example.com`
    
    // Try with minimal data first
    const { data: anonData, error: anonError } = await supabase.auth.signUp({
      email: testEmail2,
      password: 'password123'
    })

    console.log('Anon signup (minimal):', {
      success: !anonError,
      error: anonError?.message,
      userCreated: !!anonData.user
    })

    // Clean up anon test user
    if (anonData.user) {
      await supabaseAdmin.auth.admin.deleteUser(anonData.user.id)
    }

    // Step 5: Try with metadata
    const testEmail3 = `anon.meta.test.${Date.now()}@example.com`
    
    const { data: metaData, error: metaError } = await supabase.auth.signUp({
      email: testEmail3,
      password: 'password123',
      options: {
        data: {
          full_name: 'Anon Meta Test User',
          role: 'student'
        }
      }
    })

    console.log('Anon signup (with metadata):', {
      success: !metaError,
      error: metaError?.message,
      userCreated: !!metaData.user
    })

    // Clean up meta test user
    if (metaData.user) {
      await supabaseAdmin.auth.admin.deleteUser(metaData.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase auth debugging complete',
      results: {
        connection: {
          success: !connectionError,
          error: connectionError?.message
        },
        adminAccess: {
          success: !listError,
          error: listError?.message,
          userCount: users?.length || 0
        },
        adminUserCreation: {
          success: !adminUserError,
          error: adminUserError?.message
        },
        anonSignupMinimal: {
          success: !anonError,
          error: anonError?.message
        },
        anonSignupWithMeta: {
          success: !metaError,
          error: metaError?.message
        }
      },
      diagnosis: metaError || anonError 
        ? 'Signup is disabled or blocked at Supabase level'
        : 'Signup should be working - issue might be elsewhere'
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to debug Supabase auth'
    }, { status: 500 })
  }
}