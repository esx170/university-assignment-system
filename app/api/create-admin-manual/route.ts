import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Manual admin creation route - use this if setup page fails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, force } = body

    console.log('Manual admin creation called for:', email)
    
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    // Use provided credentials or defaults
    const adminEmail = email || 'admin@university.edu'
    const adminPassword = password || 'Admin123!@#'

    // Check if user already exists (unless force is true)
    if (!force) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers.users.some(user => user.email === adminEmail)
      
      if (userExists) {
        return NextResponse.json({ 
          error: 'User already exists',
          message: `User with email ${adminEmail} already exists. Use force=true to update their role.`
        }, { status: 400 })
      }
    }

    // Create or update user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin',
        student_id: null
      },
      email_confirm: true
    })

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.user?.id,
        email: adminEmail,
        role: 'admin'
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    })

  } catch (error) {
    console.error('Manual admin creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}