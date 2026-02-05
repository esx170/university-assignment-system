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

// GET - List all users (Admin only)
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

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can view all users' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('full_name')

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      return NextResponse.json({ 
        error: 'Failed to fetch users from profiles table',
        details: profilesError.message
      }, { status: 500 })
    }

    // If no profiles exist, return empty array
    if (!profiles || profiles.length === 0) {
      return NextResponse.json([])
    }

    // Add department info and related data for each profile
    const profilesWithDepartments = await Promise.all(
      profiles.map(async (profile) => {
        let department = null
        let assignedCourses: any[] = []
        let enrolledCourses: any[] = []
        let assignments: any[] = []
        
        // Only try to get department if department_id column exists
        if (profile.department_id) {
          try {
            const { data: dept } = await supabaseAdmin
              .from('departments')
              .select('id, name, code')
              .eq('id', profile.department_id)
              .single()
            
            department = dept
          } catch (error) {
            console.log('Department lookup failed for profile:', profile.id)
          }
        }

        // Get courses for instructors
        if (profile.role === 'instructor') {
          try {
            const { data: courses } = await supabaseAdmin
              .from('courses')
              .select('id, name, code, semester, year')
              .limit(5) // Limit to avoid too much data
            
            assignedCourses = courses || []
          } catch (error) {
            console.log('Courses lookup failed for instructor:', profile.id)
          }
        }

        // Get enrolled courses for students
        if (profile.role === 'student') {
          try {
            // Check if course_enrollments table exists
            const { data: enrollments, error: enrollError } = await supabaseAdmin
              .from('course_enrollments')
              .select(`
                courses (
                  id, name, code, semester, year
                )
              `)
              .eq('student_id', profile.id)
              .limit(5)

            if (!enrollError && enrollments) {
              enrolledCourses = enrollments.map(e => e.courses).filter(Boolean)
            }
          } catch (error) {
            console.log('Enrollments lookup failed for student:', profile.id)
          }
        }

        // Get assignments for instructors
        if (profile.role === 'instructor') {
          try {
            const { data: userAssignments } = await supabaseAdmin
              .from('assignments')
              .select('id, title, due_date, max_points')
              .limit(5) // Limit to avoid too much data
            
            assignments = userAssignments || []
          } catch (error) {
            console.log('Assignments lookup failed for instructor:', profile.id)
          }
        }

        return {
          ...profile,
          is_active: profile.is_active !== undefined ? profile.is_active : true, // Default to active if column doesn't exist
          primary_department: department,
          assigned_departments: department ? [department] : [],
          assigned_courses: assignedCourses,
          enrolled_courses: enrolledCourses,
          assignments: assignments
        }
      })
    )

    return NextResponse.json(profilesWithDepartments)
  } catch (error: any) {
    console.error('Users API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new user with department assignments (Admin only)
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
        role: user.email === 'admin@university.edu' ? 'admin' : (user.user_metadata?.role || 'student')
      }
    }

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can create users' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      role, 
      student_id, 
      primary_department_id,
      assigned_courses
    } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Email, password, full name, and role are required' }, { status: 400 })
    }

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be student, instructor, or admin' }, { status: 400 })
    }

    if (role === 'student' && !student_id) {
      return NextResponse.json({ error: 'Student ID is required for students' }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Create user directly in profiles table (using our working method)
    const userId = crypto.randomUUID()
    
    const profileData: any = {
      id: userId,
      email,
      full_name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Only add student_id if provided and not empty
    if (student_id && student_id.trim()) {
      profileData.student_id = student_id.trim()
    }

    // Only try to set department_id if the column exists
    let departmentColumnExists = false
    if (primary_department_id) {
      // Test if department_id column exists by doing a harmless select
      const { error: testError } = await supabaseAdmin
        .from('profiles')
        .select('department_id')
        .limit(1)
      
      if (!testError) {
        // Column exists
        departmentColumnExists = true
        profileData.department_id = primary_department_id
      } else {
        console.log('department_id column does not exist, skipping department assignment')
      }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      return NextResponse.json({
        error: 'Failed to create user account',
        details: profileError.message
      }, { status: 500 })
    }

    // Handle course assignments for instructors
    let courseAssignmentResults = []
    if (role === 'instructor' && assigned_courses && assigned_courses.length > 0) {
      console.log(`Assigning ${assigned_courses.length} courses to instructor ${full_name}`)
      
      for (const courseId of assigned_courses) {
        try {
          const { data: updatedCourse, error: courseError } = await supabaseAdmin
            .from('courses')
            .update({ instructor_id: userId })
            .eq('id', courseId)
            .select('id, name, code')
            .single()

          if (courseError) {
            console.error(`Failed to assign course ${courseId}:`, courseError)
            courseAssignmentResults.push({
              courseId,
              success: false,
              error: courseError.message
            })
          } else {
            console.log(`✅ Assigned course ${updatedCourse.code} to ${full_name}`)
            courseAssignmentResults.push({
              courseId,
              courseName: `${updatedCourse.code} - ${updatedCourse.name}`,
              success: true
            })
          }
        } catch (error) {
          console.error(`Error assigning course ${courseId}:`, error)
          courseAssignmentResults.push({
            courseId,
            success: false,
            error: 'Unexpected error'
          })
        }
      }
    }

    const successfulAssignments = courseAssignmentResults.filter(r => r.success)
    const failedAssignments = courseAssignmentResults.filter(r => !r.success)

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        full_name,
        role,
        student_id: student_id || null,
        primary_department_id: departmentColumnExists ? primary_department_id : null,
        note: primary_department_id && !departmentColumnExists ? 'Department assignment skipped - column not available' : null
      },
      courseAssignments: {
        total: courseAssignmentResults.length,
        successful: successfulAssignments.length,
        failed: failedAssignments.length,
        details: courseAssignmentResults
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}