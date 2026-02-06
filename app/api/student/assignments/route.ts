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

// GET - List assignments for enrolled courses (Student only)
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
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is student or admin
    if (currentUser.role !== 'student' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: This endpoint is for students only' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get courses the student is enrolled in
    let enrolledCourseIds: string[] = []
    
    try {
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', currentUser.id)
        .eq('status', 'active')

      if (enrollError) {
        // If enrollments table doesn't exist yet, return empty array with helpful message
        if (enrollError.message.includes('does not exist') || enrollError.message.includes('schema cache')) {
          return NextResponse.json({
            assignments: [],
            message: 'No enrollments found. Please contact your administrator to enroll you in courses.',
            note: 'The enrollment system needs to be set up first.'
          })
        }
        throw enrollError
      }

      enrolledCourseIds = enrollments?.map(e => e.course_id) || []
    } catch (error: any) {
      console.error('Error fetching enrollments:', error)
      return NextResponse.json({
        assignments: [],
        message: 'Unable to load enrollments. Please contact your administrator.',
        error: error.message
      })
    }

    // If student is not enrolled in any courses, return empty array
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({
        assignments: [],
        message: 'You are not enrolled in any courses yet. Please contact your administrator.'
      })
    }

    // Get assignments for enrolled courses
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses (
          id,
          name,
          code
        )
      `)
      .in('course_id', enrolledCourseIds)
      .order('due_date', { ascending: true })

    if (assignmentsError) {
      console.error('Assignments error:', assignmentsError)
      return NextResponse.json({ 
        error: 'Failed to fetch assignments',
        details: assignmentsError.message
      }, { status: 500 })
    }

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: submissions } = await supabaseAdmin
          .from('submissions')
          .select('id, submitted_at, grade, grade_percentage, feedback, status')
          .eq('assignment_id', assignment.id)
          .eq('student_id', currentUser.id)

        return {
          ...assignment,
          submissions: submissions || [],
          submission_status: submissions && submissions.length > 0 ? 'submitted' : 'pending',
          submitted_at: submissions && submissions.length > 0 ? submissions[0].submitted_at : null,
          grade: submissions && submissions.length > 0 ? submissions[0].grade : null
        }
      })
    )

    return NextResponse.json(assignmentsWithStatus)
  } catch (error: any) {
    console.error('Student assignments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}