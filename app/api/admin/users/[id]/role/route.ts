import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// PUT - Update user role (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Role update API called for user:', params.id)
    
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
      return NextResponse.json({ error: 'Unauthorized: Only administrators can update user roles' }, { status: 403 })
    }

    const body = await request.json()
    const { newRole } = body

    console.log('Updating role to:', newRole)

    // Prevent setting admin role
    if (newRole === 'admin') {
      return NextResponse.json({ error: 'Cannot assign admin role. Only one system administrator is allowed.' }, { status: 400 })
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

    // Get the target user first
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(params.id)
    if (getUserError || !targetUser.user) {
      console.error('User not found:', getUserError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying the hardcoded admin user
    if (targetUser.user.email === 'admin@university.edu') {
      return NextResponse.json({ error: 'Cannot modify the system administrator account' }, { status: 400 })
    }

    console.log('Updating user metadata...')
    
    // Update user role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
      user_metadata: {
        ...targetUser.user.user_metadata,
        role: newRole
      }
    })

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ 
        error: 'Failed to update user role',
        details: error.message
      }, { status: 500 })
    }

    console.log('Role updated successfully')

    return NextResponse.json({
      message: `User role updated to ${newRole} successfully`,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: newRole
      }
    })
  } catch (error: any) {
    console.error('Admin update role error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}