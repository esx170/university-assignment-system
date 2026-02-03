import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
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

    const adminEmail = 'admin@university.edu'
    const adminPassword = 'Admin123!@#'

    // Check if admin user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ 
        error: 'Failed to list users',
        details: listError.message
      }, { status: 500 })
    }

    let adminUser = users.find(user => user.email === adminEmail)
    
    if (!adminUser) {
      console.log('Creating admin user...')
      // Create admin user
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin',
          student_id: null
        },
        email_confirm: true
      })

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create admin user',
          details: createError.message
        }, { status: 500 })
      }

      adminUser = data.user
      console.log('Admin user created successfully')
    } else {
      console.log('Admin user already exists, updating metadata...')
      // Update existing admin user to ensure proper metadata
      const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin',
          student_id: null
        },
        email_confirm: true
      })

      if (updateError) {
        return NextResponse.json({ 
          error: 'Failed to update admin user',
          details: updateError.message
        }, { status: 500 })
      }

      adminUser = data.user
      console.log('Admin user updated successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user is ready',
      adminUser: {
        id: adminUser?.id,
        email: adminUser?.email,
        emailConfirmed: adminUser?.email_confirmed_at !== null,
        metadata: adminUser?.user_metadata,
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      }
    })
  } catch (error: any) {
    console.error('Fix admin error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}