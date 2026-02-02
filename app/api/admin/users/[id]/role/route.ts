import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isHardcodedAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// PUT - Update user role (Hardcoded admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Role update API called for user:', params.id)
    
    const user = await getCurrentUser()
    if (!user || !isHardcodedAdmin(user.email)) {
      return NextResponse.json({ error: 'Unauthorized: Only the system administrator can update user roles' }, { status: 403 })
    }

    const body = await request.json()
    const { newRole } = body

    console.log('Updating role to:', newRole)

    // Prevent setting admin role
    if (newRole === 'admin') {
      return NextResponse.json({ error: 'Cannot assign admin role. Only one system administrator is allowed.' }, { status: 400 })
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

    // Get the target user first
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(params.id)
    if (getUserError || !targetUser.user) {
      console.error('User not found:', getUserError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying the hardcoded admin user
    if (isHardcodedAdmin(targetUser.user.email || '')) {
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