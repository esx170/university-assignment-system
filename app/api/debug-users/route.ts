import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Debug route to check what users exist in the system
export async function GET(request: NextRequest) {
  try {
    console.log('Debug users route called')
    
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Service role key not configured',
        message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is missing'
      }, { status: 500 })
    }

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error listing users:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    const userSummary = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'no role',
      full_name: user.user_metadata?.full_name || 'no name',
      email_confirmed: user.email_confirmed_at !== null,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at
    }))

    return NextResponse.json({
      total_users: users.length,
      users: userSummary,
      admin_users: userSummary.filter(u => u.role === 'admin'),
      student_users: userSummary.filter(u => u.role === 'student'),
      instructor_users: userSummary.filter(u => u.role === 'instructor')
    })

  } catch (error) {
    console.error('Debug users error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}