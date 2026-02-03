import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test if departments table exists
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*')
      .limit(5)

    // Test if profiles table exists
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(5)

    return NextResponse.json({
      departments: {
        exists: !deptError,
        error: deptError?.message,
        count: departments?.length || 0,
        data: departments
      },
      profiles: {
        exists: !profileError,
        error: profileError?.message,
        count: profiles?.length || 0,
        data: profiles
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}