import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isHardcodedAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// GET - List all users (Hardcoded admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called')
    
    const user = await getCurrentUser()
    console.log('Current user:', user?.email, user?.role)
    
    if (!user || !isHardcodedAdmin(user.email)) {
      console.log('Access denied - not admin')
      return NextResponse.json({ error: 'Unauthorized: Only the system administrator can access this' }, { status: 403 })
    }

    // Create admin client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 20)
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Fetching users from Supabase...')
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch users from database',
        details: error.message
      }, { status: 500 })
    }

    console.log(`Found ${users.length} users`)

    // Format user data for admin dashboard
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role: isHardcodedAdmin(user.email || '') ? 'admin' : (user.user_metadata?.role || 'student'),
      student_id: user.user_metadata?.student_id || null,
      email_confirmed: user.email_confirmed_at !== null,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      is_system_admin: isHardcodedAdmin(user.email || '')
    }))

    console.log('Returning formatted users')
    return NextResponse.json(formattedUsers)
  } catch (error: any) {
    console.error('Admin list users error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new user (Hardcoded admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !isHardcodedAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized: Only the system administrator can create users' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, student_id } = body

    // Prevent creating another admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Cannot create additional admin users. Only one system administrator is allowed.' }, { status: 400 })
    }

    // Prevent using the admin email
    if (isHardcodedAdmin(email)) {
      return NextResponse.json({ error: 'This email address is reserved for system administration' }, { status: 400 })
    }

    // Create admin client directly
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

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
        role: role || 'student',
        student_id: student_id || null
      },
      email_confirm: true
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `${role || 'student'} account created successfully`,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: role || 'student'
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}