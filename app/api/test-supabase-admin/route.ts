import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:')
    console.log('- Supabase URL:', supabaseUrl ? 'Present' : 'Missing')
    console.log('- Service Key:', supabaseServiceKey ? 'Present' : 'Missing')
    console.log('- Service Key Length:', supabaseServiceKey?.length || 0)

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey?.length || 0
      })
    }

    // Test creating admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Admin client created, testing API call...')

    // Test a simple admin API call
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (error) {
      console.error('Supabase admin API error:', error)
      return NextResponse.json({
        error: 'Supabase admin API failed',
        details: error,
        supabaseError: true
      })
    }

    console.log('Admin API test successful')

    return NextResponse.json({
      success: true,
      message: 'Supabase admin client working correctly',
      userCount: data.users.length,
      aud: data.aud
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    })
  }
}