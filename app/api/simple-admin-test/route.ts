import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Simple Admin Test ===')
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:')
    console.log('- URL exists:', !!supabaseUrl)
    console.log('- Service key exists:', !!supabaseServiceKey)
    console.log('- URL:', supabaseUrl)
    console.log('- Service key length:', supabaseServiceKey?.length)

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          url: supabaseUrl,
          serviceKeyLength: supabaseServiceKey?.length || 0
        }
      }, { status: 500 })
    }

    // Create Supabase admin client
    console.log('Creating Supabase admin client...')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Testing admin API call...')
    
    // Test admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Supabase admin error:', error)
      return NextResponse.json({
        error: 'Supabase admin API failed',
        supabaseError: error,
        details: {
          message: error.message,
          status: error.status,
          code: error.code
        }
      }, { status: 500 })
    }

    console.log('Success! Found', data.users.length, 'users')

    // Format users for response
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'no role',
      created_at: user.created_at,
      email_confirmed: !!user.email_confirmed_at
    }))

    return NextResponse.json({
      success: true,
      message: 'Admin API working correctly',
      userCount: users.length,
      users: users
    })

  } catch (error: any) {
    console.error('Test failed:', error)
    return NextResponse.json({
      error: 'Test failed with exception',
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }, { status: 500 })
  }
}