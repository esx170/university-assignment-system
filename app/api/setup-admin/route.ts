import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple admin creation using direct Supabase client
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        message: 'SUPABASE_SERVICE_ROLE_KEY is required'
      }, { status: 500 })
    }

    // Create admin client directly
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@university.edu',
      password: 'Admin123!@#',
      user_metadata: {
        role: 'admin',
        full_name: 'System Administrator',
        student_id: null
      },
      email_confirm: true
    })

    if (error) {
      console.error('Admin creation error:', error)
      return NextResponse.json({ 
        error: error.message,
        code: error.status || 'unknown'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: data.user?.id,
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      }
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin',
      details: error.message
    }, { status: 500 })
  }
}