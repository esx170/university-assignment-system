import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to verify custom session token
async function verifyCustomToken(token: string) {
  try {
    // Decode our custom token (format: base64(userId:timestamp))
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, timestamp] = decoded.split(':')
    
    if (!userId || !timestamp) {
      return null
    }

    // Check if token is not too old (24 hours)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - tokenTime > maxAge) {
      return null // Token expired
    }

    // Get user from profiles table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// PUT - Update user (Admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Try to verify custom token first
    let currentUser = await verifyCustomToken(token)
    
    if (!currentUser) {
      // Fallback to Supabase token verification
      const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
      }

      // Convert Supabase user to our format
      currentUser = {
        id: user.id,
        email: user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can update users' }, { status: 403 })
    }

    // Create admin client for updates
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { 
      email, 
      full_name, 
      role, 
      student_id, 
      primary_department_id,
      is_active = true
    } = body

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Email, full name, and role are required' }, { status: 400 })
    }

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be student, instructor, or admin' }, { status: 400 })
    }

    // Update the profile
    const profileUpdate: any = {
      email,
      full_name,
      role,
      updated_at: new Date().toISOString()
    }

    // Add optional fields
    if (student_id !== undefined) {
      profileUpdate.student_id = student_id || null
    }

    // Handle department_id - only add if it exists in the table
    if (primary_department_id) {
      // Test if department_id column exists by doing a harmless select
      const { error: testError } = await supabaseAdmin
        .from('profiles')
        .select('department_id')
        .limit(1)
      
      if (!testError) {
        // Column exists, so we can set it
        profileUpdate.department_id = primary_department_id
      } else {
        console.log('department_id column does not exist, skipping department update')
      }
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user profile',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedProfile
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Try to verify custom token first
    let currentUser = await verifyCustomToken(token)
    
    if (!currentUser) {
      // Fallback to Supabase token verification
      const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
      }

      // Convert Supabase user to our format
      currentUser = {
        id: user.id,
        email: user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can delete users' }, { status: 403 })
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete the user from profiles table
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete user',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}