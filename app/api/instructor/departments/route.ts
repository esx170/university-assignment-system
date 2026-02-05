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

// GET - Get instructor's assigned departments with courses and students (Instructor only)
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

    // Check if user is instructor or admin
    if (currentUser.role !== 'instructor' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only instructors and administrators can access this endpoint' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // For now, return a placeholder response since department assignments table doesn't exist
    // In a real system, you would query instructor_department_assignments table
    
    // Get all departments as placeholder
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name')

    if (deptError) {
      console.error('Departments error:', deptError)
      return NextResponse.json({ 
        error: 'Failed to fetch departments',
        details: deptError.message
      }, { status: 500 })
    }

    // Create placeholder department assignments (assign instructor to Computer Science)
    const placeholderDepartments = departments?.slice(0, 1).map(dept => ({
      ...dept,
      is_primary: true,
      assigned_at: new Date().toISOString(),
      courses: [], // No courses for now
      students: [], // No students for now
      course_count: 0,
      student_count: 0,
      assigned_course_count: 0
    })) || []

    return NextResponse.json({
      instructor: {
        id: currentUser.id,
        name: currentUser.full_name || currentUser.email,
        email: currentUser.email
      },
      departments: placeholderDepartments,
      summary: {
        total_departments: placeholderDepartments.length,
        total_courses: 0,
        total_assigned_courses: 0,
        total_students: 0
      }
    })
  } catch (error: any) {
    console.error('Instructor departments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}