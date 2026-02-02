import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    // Only allow setting admin role for the hardcoded admin email
    if (email !== 'admin@university.edu') {
      return NextResponse.json({
        error: 'Can only set admin role for admin@university.edu'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find the user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({
        error: 'Failed to list users',
        details: listError.message
      }, { status: 500 })
    }

    const targetUser = users.find(user => user.email === email)
    
    if (!targetUser) {
      return NextResponse.json({
        error: `User with email ${email} not found`
      }, { status: 404 })
    }

    // Update user metadata to set admin role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          role: 'admin',
          full_name: 'System Administrator',
          student_id: null
        }
      }
    )

    if (error) {
      return NextResponse.json({
        error: 'Failed to update user role',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been set as admin`,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: 'admin',
        metadata: data.user?.user_metadata
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}