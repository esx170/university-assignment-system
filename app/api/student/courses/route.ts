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

// GET - Get student's enrolled courses and department information (Student only)
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
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student'),
        student_id: user.user_metadata?.student_id || null
      }
    }

    // Check if user is student or admin
    if (currentUser.role !== 'admin' && currentUser.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Only students and administrators can access this endpoint' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get student profile with department information
    const { data: studentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_id,
        department_id
      `)
      .eq('id', currentUser.id)
      .single()

    if (profileError || !studentProfile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch student profile',
        details: profileError?.message
      }, { status: 500 })
    }

    // Get department information if department_id exists
    let departmentInfo = {
      id: null,
      name: 'No Department Assigned',
      code: 'N/A',
      description: 'Please contact administration to assign your department.'
    }

    if (studentProfile.department_id) {
      const { data: department, error: deptError } = await supabaseAdmin
        .from('departments')
        .select('id, name, code, description')
        .eq('id', studentProfile.department_id)
        .single()

      if (department && !deptError) {
        departmentInfo = {
          id: department.id,
          name: department.name,
          code: department.code,
          description: department.description || `Welcome to the ${department.name} department.`
        }
        console.log(`✅ Found student department: ${department.code} - ${department.name}`)
      } else {
        console.log(`❌ Failed to fetch department for ID ${studentProfile.department_id}:`, deptError?.message)
        departmentInfo = {
          id: studentProfile.department_id,
          name: 'Department Not Found',
          code: 'ERROR',
          description: 'Your assigned department could not be found. Please contact administration.'
        }
      }
    } else {
      console.log(`⚠️ Student ${studentProfile.full_name} has no department_id assigned`)
    }

    // Get student's enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('course_enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        final_grade,
        courses (
          id,
          name,
          code,
          description,
          credits,
          semester,
          year,
          department_id,
          departments (
            name,
            code
          )
        )
      `)
      .eq('student_id', currentUser.id)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Enrollments error:', enrollmentsError)
      // Return basic info even if enrollments fail
      return NextResponse.json({
        student: {
          id: studentProfile.id,
          name: studentProfile.full_name,
          email: studentProfile.email,
          student_id: studentProfile.student_id,
          department: departmentInfo
        },
        enrollments: {
          active: [],
          completed: [],
          total: 0
        },
        upcoming_assignments: [],
        summary: {
          total_courses: 0,
          active_courses: 0,
          completed_courses: 0,
          total_assignments: 0,
          completed_assignments: 0,
          pending_assignments: 0,
          upcoming_deadlines: 0
        }
      })
    }

    // Get assignments for enrolled courses
    const courseIds = enrollments?.map(enrollment => enrollment.courses.id) || []
    
    let assignments: any[] = []
    if (courseIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_points,
          status,
          course_id,
          courses (
            name,
            code
          ),
          submissions (
            id,
            submitted_at,
            grade,
            status
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'published')
        .order('due_date', { ascending: true })

      if (!assignmentsError) {
        assignments = assignmentsData || []
      }
    }

    // Process enrollments to add assignment info
    const processedEnrollments = (enrollments || []).map(enrollment => {
      const course = enrollment.courses
      const courseAssignments = assignments.filter(assignment => assignment.course_id === course.id)
      const completedAssignments = courseAssignments.filter(assignment => 
        assignment.submissions && assignment.submissions.length > 0
      )

      return {
        enrollment_id: enrollment.id,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status || 'active',
        final_grade: enrollment.final_grade,
        course: {
          ...course,
          primary_instructor: null,
          all_instructors: [],
          department: course.departments
        },
        assignments: courseAssignments.map(assignment => ({
          ...assignment,
          submission: assignment.submissions?.[0] || null,
          is_submitted: assignment.submissions && assignment.submissions.length > 0,
          is_graded: assignment.submissions?.[0]?.grade !== null
        })),
        progress: {
          total_assignments: courseAssignments.length,
          completed_assignments: completedAssignments.length,
          completion_rate: courseAssignments.length > 0 
            ? Math.round((completedAssignments.length / courseAssignments.length) * 100)
            : 0
        }
      }
    })

    // Separate active and completed courses
    const activeCourses = processedEnrollments.filter(enrollment => enrollment.status === 'active')
    const completedCourses = processedEnrollments.filter(enrollment => enrollment.status === 'completed')

    // Get upcoming assignments (next 7 days)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const upcomingAssignments = assignments
      .filter(assignment => {
        const dueDate = new Date(assignment.due_date)
        const isSubmitted = assignment.submissions && assignment.submissions.length > 0
        return dueDate >= now && dueDate <= nextWeek && !isSubmitted
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    return NextResponse.json({
      student: {
        id: studentProfile.id,
        name: studentProfile.full_name,
        email: studentProfile.email,
        student_id: studentProfile.student_id,
        department: departmentInfo
      },
      enrollments: {
        active: activeCourses,
        completed: completedCourses,
        total: processedEnrollments.length
      },
      upcoming_assignments: upcomingAssignments.slice(0, 5), // Limit to 5 most urgent
      summary: {
        total_courses: processedEnrollments.length,
        active_courses: activeCourses.length,
        completed_courses: completedCourses.length,
        total_assignments: assignments.length,
        completed_assignments: assignments.filter(a => a.submissions && a.submissions.length > 0).length,
        pending_assignments: assignments.filter(a => !a.submissions || a.submissions.length === 0).length,
        upcoming_deadlines: upcomingAssignments.length
      }
    })
  } catch (error: any) {
    console.error('Student courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}