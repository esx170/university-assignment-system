import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called')
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found')
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

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

    // Create client with the user's token
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.log('Invalid token or user not found')
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    console.log('Authenticated user:', user.email)

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      console.log('Access denied - not admin')
      return NextResponse.json({ error: 'Unauthorized: Only administrators can access this' }, { status: 403 })
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
      role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student'),
      student_id: user.user_metadata?.student_id || null,
      email_confirmed: user.email_confirmed_at !== null,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      is_system_admin: user.email === 'admin@university.edu'
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

// POST - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can create users' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, student_id } = body

    // Prevent creating another admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Cannot create additional admin users. Only one system administrator is allowed.' }, { status: 400 })
    }

    // Prevent using the admin email
    if (email === 'admin@university.edu') {
      return NextResponse.json({ error: 'This email address is reserved for system administration' }, { status: 400 })
    }

    // Create admin client directly
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