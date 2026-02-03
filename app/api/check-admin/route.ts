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

    // Check if admin user exists
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to list users',
        details: error.message
      }, { status: 500 })
    }

    const adminUser = users.find(user => user.email === 'admin@university.edu')
    
    return NextResponse.json({
      adminExists: !!adminUser,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        emailConfirmed: adminUser.email_confirmed_at !== null,
        metadata: adminUser.user_metadata,
        createdAt: adminUser.created_at
      } : null,
      totalUsers: users.length,
      allUsers: users.map(u => ({
        email: u.email,
        confirmed: u.email_confirmed_at !== null,
        metadata: u.user_metadata
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}