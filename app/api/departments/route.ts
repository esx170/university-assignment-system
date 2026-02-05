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

// GET - List all departments (using Supabase database)
export async function GET(request: NextRequest) {
  try {
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
        full_name: user.user_metadata?.full_name || user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Create admin client for data access (same as admin API)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('Admin departments API: Fetching departments...')
    
    // Use exact same query as public API
    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select('id, name, code, description')
      .order('name')

    console.log('Admin departments API: Query result:', { 
      count: departments?.length || 0, 
      error: error?.message || 'none',
      departments: departments?.map(d => ({ code: d.code, name: d.name })) || []
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch departments',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json(departments || [])
  } catch (error: any) {
    console.error('Departments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new department (Admin only, using Supabase database)
export async function POST(request: NextRequest) {
  try {
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
        full_name: user.user_metadata?.full_name || user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can create departments' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Insert department into Supabase database
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || ''
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('departments_name_key')) {
          return NextResponse.json({ error: 'A department with this name already exists' }, { status: 409 })
        }
        if (error.message.includes('departments_code_key')) {
          return NextResponse.json({ error: 'A department with this code already exists' }, { status: 409 })
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create department',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Department created successfully',
      department
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update department (Admin only, using Supabase database)
export async function PUT(request: NextRequest) {
  try {
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
        full_name: user.user_metadata?.full_name || user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can update departments' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, code, description } = body

    if (!id || !name || !code) {
      return NextResponse.json({ error: 'ID, name, and code are required' }, { status: 400 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Update department in Supabase database
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .update({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('departments_name_key')) {
          return NextResponse.json({ error: 'A department with this name already exists' }, { status: 409 })
        }
        if (error.message.includes('departments_code_key')) {
          return NextResponse.json({ error: 'A department with this code already exists' }, { status: 409 })
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to update department',
        details: error.message
      }, { status: 500 })
    }

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Department updated successfully',
      department
    })
  } catch (error: any) {
    console.error('Update department error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete department (Admin only, using Supabase database)
export async function DELETE(request: NextRequest) {
  try {
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
        full_name: user.user_metadata?.full_name || user.email || '',
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can delete departments' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if department has associated records (courses, profiles, etc.)
    console.log('Checking department dependencies for ID:', id)
    
    let hasDependencies = false
    const dependencies = []

    // Check courses table (if it exists)
    try {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('id, name')
        .eq('department_id', id)
        .limit(5)

      if (coursesError) {
        console.log('Courses table check failed (table may not exist):', coursesError.message)
        // Don't fail the deletion if courses table doesn't exist or has different structure
      } else if (courses && courses.length > 0) {
        hasDependencies = true
        dependencies.push(`${courses.length} course(s)`)
      }
    } catch (courseCheckError) {
      console.log('Courses dependency check failed:', courseCheckError)
      // Continue with deletion
    }

    // Check profiles table for department_id (if column exists)
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('department_id', id)
        .limit(5)

      if (profilesError) {
        console.log('Profiles department check failed (column may not exist):', profilesError.message)
        // Don't fail the deletion if department_id column doesn't exist
      } else if (profiles && profiles.length > 0) {
        hasDependencies = true
        dependencies.push(`${profiles.length} user(s)`)
      }
    } catch (profileCheckError) {
      console.log('Profiles dependency check failed:', profileCheckError)
      // Continue with deletion
    }

    // If there are dependencies, prevent deletion
    if (hasDependencies) {
      return NextResponse.json({ 
        error: `Cannot delete department: It has associated ${dependencies.join(' and ')}. Please reassign or remove these first.`,
        dependencies: dependencies
      }, { status: 409 })
    }

    // Delete department from Supabase database
    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete department',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Department deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete department error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}