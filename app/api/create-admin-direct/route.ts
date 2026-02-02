import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating admin user directly...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Supabase URL:', supabaseUrl)
    console.log('Service Key exists:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }

    // Create direct admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Admin client created')

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ 
        error: 'Failed to check existing users',
        details: listError
      }, { status: 500 })
    }

    console.log('Found', existingUsers.users.length, 'existing users')

    const adminExists = existingUsers.users.find(user => user.email === 'admin@university.edu')
    
    if (adminExists) {
      console.log('Admin user already exists, updating metadata...')
      
      // Update existing user to ensure admin role
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminExists.id,
        {
          user_metadata: {
            role: 'admin',
            full_name: 'System Administrator',
            student_id: null
          }
        }
      )

      if (updateError) {
        console.error('Error updating admin user:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update existing admin user',
          details: updateError
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Admin user already exists and has been updated',
        user: {
          id: adminExists.id,
          email: 'admin@university.edu',
          role: 'admin'
        }
      })
    }

    console.log('Creating new admin user...')

    // Create new admin user
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
      console.error('Error creating admin user:', error)
      return NextResponse.json({ 
        error: 'Failed to create admin user',
        details: error
      }, { status: 500 })
    }

    console.log('Admin user created successfully:', data.user?.id)

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.user?.id,
        email: 'admin@university.edu',
        role: 'admin'
      }
    })

  } catch (error: any) {
    console.error('Direct admin creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}