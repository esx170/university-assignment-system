import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assignmentSchema } from '@/lib/validations'

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

    // Check user role
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Build query based on role - TEMPORARY: work with current table structure
    let query = supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses (
          id,
          name,
          code
        )
      `)

    // NOTE: Current assignments table doesn't have instructor_id column
    // For now, return all assignments for instructors and admins
    // Students get empty array until enrollment logic is implemented
    if (userRole === 'student') {
      return NextResponse.json([])
    }

    const { data: assignments, error } = await query.order('due_date', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch assignments',
        details: error.message
      }, { status: 500 })
    }

    // Add a note about the missing instructor_id column
    const result = assignments || []
    if (result.length === 0) {
      console.log('No assignments found. Note: instructor_id column is missing from assignments table.')
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Assignments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

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

    // Check if user is admin or instructor - STUDENTS CANNOT CREATE ASSIGNMENTS
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (userRole === 'student') {
      return NextResponse.json({ 
        error: 'Access Denied: Students cannot create assignments. Only instructors and administrators can create assignments.' 
      }, { status: 403 })
    }

    if (!isHardcodedAdmin && userRole !== 'admin' && userRole !== 'instructor') {
      return NextResponse.json({ 
        error: 'Unauthorized: Only administrators and instructors can create assignments' 
      }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate the assignment data
    try {
      const validatedData = assignmentSchema.parse(body)
      
      // Create admin client for data access
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      
      // Verify the course exists and user has permission
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, name, code')
        .eq('id', validatedData.course_id)
        .single()

      if (courseError || !course) {
        return NextResponse.json({ 
          error: 'Invalid course ID: The selected course does not exist.' 
        }, { status: 400 })
      }

      // Insert assignment into Supabase database
      // NOTE: Current table structure doesn't have instructor_id or status columns
      const { data: assignment, error } = await supabaseAdmin
        .from('assignments')
        .insert({
          title: validatedData.title,
          description: validatedData.description || '',
          course_id: validatedData.course_id,
          due_date: validatedData.due_date,
          max_points: validatedData.max_points
          // instructor_id: currentUser.id, // Column doesn't exist yet
          // status: 'published' // Column doesn't exist yet
        })
        .select(`
          *,
          courses (
            id,
            name,
            code
          )
        `)
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ 
          error: 'Failed to create assignment',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Assignment created successfully (Note: instructor_id and status columns need to be added to assignments table)',
        assignment
      }, { status: 201 })
    } catch (validationError: any) {
      if (validationError.name === 'ZodError') {
        return NextResponse.json({ 
          error: 'Validation failed',
          details: validationError.errors
        }, { status: 400 })
      }
      throw validationError
    }
  } catch (error: any) {
    console.error('Create assignment error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}