import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // List all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to list users',
        details: error
      }, { status: 500 })
    }

    // Check for admin user
    const adminUser = users.find(user => user.email === 'admin@university.edu')

    return NextResponse.json({
      totalUsers: users.length,
      adminExists: !!adminUser,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.user_metadata?.role,
        emailConfirmed: !!adminUser.email_confirmed_at,
        createdAt: adminUser.created_at
      } : null,
      allUsers: users.map(user => ({
        email: user.email,
        role: user.user_metadata?.role || 'no role',
        confirmed: !!user.email_confirmed_at
      }))
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}