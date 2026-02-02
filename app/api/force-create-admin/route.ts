import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'Missing Supabase environment variables'
      }, { status: 500 })
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try to create the user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        role: 'admin',
        full_name: 'System Administrator',
        student_id: null
      },
      email_confirm: true
    })

    if (error) {
      // If user already exists, try to update their role instead
      if (error.message.includes('already registered')) {
        try {
          // Get the existing user
          const { data: users } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = users.users.find(u => u.email === email)
          
          if (existingUser) {
            // Update their role to admin
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              {
                user_metadata: {
                  ...existingUser.user_metadata,
                  role: 'admin',
                  full_name: existingUser.user_metadata?.full_name || 'System Administrator'
                }
              }
            )

            if (updateError) {
              return NextResponse.json({ 
                error: 'Failed to update existing user to admin',
                details: updateError.message
              }, { status: 500 })
            }

            return NextResponse.json({
              success: true,
              message: 'Existing user updated to admin role successfully',
              user: {
                id: existingUser.id,
                email: email,
                role: 'admin'
              }
            })
          }
        } catch (updateError) {
          return NextResponse.json({ 
            error: 'User exists but failed to update role',
            details: error.message
          }, { status: 500 })
        }
      }

      return NextResponse.json({ 
        error: error.message,
        code: error.status
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.user?.id,
        email: email,
        role: 'admin'
      }
    })

  } catch (error: any) {
    console.error('Force create admin error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}