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

// GET - List courses (using Supabase database)
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

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get courses with instructor info (without department relationship since column doesn't exist)
    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        profiles:instructor_id (
          id,
          full_name,
          email
        )
      `)
      .order('name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: error.message
      }, { status: 500 })
    }

    // Get departments separately to match with courses
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('*')

    // Transform the data to match the expected format
    const transformedCourses = courses?.map(course => {
      // Try to match department based on course code
      const coursePrefix = course.code?.substring(0, 2).toUpperCase()
      const matchingDept = departments?.find(d => 
        d.code.startsWith(coursePrefix) || 
        course.code?.startsWith(d.code)
      ) || departments?.find(d => d.code === 'CS') // Default to CS

      return {
        ...course,
        // Set default values for missing columns
        department_id: matchingDept?.id || null,
        is_active: true, // Default to active since column doesn't exist
        credits: 3, // Default credits
        max_enrollment: 50, // Default max enrollment
        // Handle relationships
        departments: matchingDept || null,
        profiles: course.profiles || null,
        enrollment_count: 0, // TODO: Calculate from enrollments table
        assignments: []  // TODO: Add assignment count
      }
    }) || []

    return NextResponse.json(transformedCourses)
  } catch (error: any) {
    console.error('Courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new course (Admin only, using Supabase database)
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

    // Check if user is admin - ONLY ADMIN CAN CREATE COURSES
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can create courses' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, credits, semester, year, department_id, instructor_id } = body

    if (!name || !code || !semester || !year) {
      return NextResponse.json({ error: 'Name, code, semester, and year are required' }, { status: 400 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify department exists if provided (department_id column doesn't exist in courses table yet)
    let departmentData = null
    if (department_id) {
      const { data: dept, error: deptError } = await supabaseAdmin
        .from('departments')
        .select('id, name, code')
        .eq('id', department_id)
        .single()

      if (deptError || !dept) {
        return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 })
      }
      departmentData = dept
    }

    // Verify instructor exists if provided
    let instructor = null
    if (instructor_id) {
      const { data: instructorData, error: instrError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', instructor_id)
        .single()

      if (instrError || !instructorData) {
        return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 })
      }

      if (instructorData.role !== 'instructor' && instructorData.role !== 'admin') {
        return NextResponse.json({ error: 'Selected user is not an instructor' }, { status: 400 })
      }

      instructor = instructorData
    }

    // Insert course into Supabase database (only with existing columns)
    const courseInsertData: any = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      semester: semester.trim(),
      year: parseInt(year)
    }

    // Add optional fields that exist in the table
    if (description && description.trim()) {
      courseInsertData.description = description.trim()
    }

    // Add instructor_id - REQUIRED field, cannot be null
    if (instructor_id) {
      // Verify the provided instructor exists
      const { data: providedInstructor, error: instructorError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', instructor_id)
        .single()

      if (instructorError || !providedInstructor) {
        return NextResponse.json({ error: 'Invalid instructor ID provided' }, { status: 400 })
      }

      if (providedInstructor.role !== 'instructor' && providedInstructor.role !== 'admin') {
        return NextResponse.json({ error: 'Selected user is not an instructor' }, { status: 400 })
      }

      courseInsertData.instructor_id = instructor_id
    } else {
      // No instructor provided, find one automatically
      let assignedInstructorId = null

      // First try: Use current user if they are admin or instructor
      if (currentUser.role === 'admin' || currentUser.role === 'instructor') {
        assignedInstructorId = currentUser.id
      } else {
        // Second try: Find any instructor
        const { data: anyInstructor, error: instructorError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('role', 'instructor')
          .limit(1)
          .single()
        
        if (!instructorError && anyInstructor) {
          assignedInstructorId = anyInstructor.id
        } else {
          // Third try: Find admin user
          const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', 'admin@university.edu')
            .single()
          
          if (!adminError && adminUser) {
            assignedInstructorId = adminUser.id
          } else {
            // Last resort: Find any user
            const { data: anyUser, error: userError } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .limit(1)
              .single()
            
            if (!userError && anyUser) {
              assignedInstructorId = anyUser.id
            }
          }
        }
      }

      if (!assignedInstructorId) {
        return NextResponse.json({ 
          error: 'No instructor could be assigned to this course. Please ensure at least one user exists in the system.' 
        }, { status: 500 })
      }

      courseInsertData.instructor_id = assignedInstructorId
    }

    // Ensure instructor_id is set before insertion
    if (!courseInsertData.instructor_id) {
      return NextResponse.json({ 
        error: 'Failed to assign instructor to course' 
      }, { status: 500 })
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert(courseInsertData)
      .select(`
        *,
        profiles:instructor_id (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Database error during course creation:', error)
      console.error('Course data being inserted:', courseInsertData)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A course with this code already exists for this semester and year' }, { status: 409 })
      }
      
      // Handle not null constraint violations
      if (error.code === '23502') {
        return NextResponse.json({ 
          error: `Missing required field: ${error.message}`,
          details: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create course',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // Get departments to match with course for virtual relationship
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('*')

    // Try to match department based on course code or provided department_id
    let matchingDept = null
    if (department_id) {
      matchingDept = departments?.find(d => d.id === department_id)
    }
    
    if (!matchingDept) {
      const coursePrefix = course.code?.substring(0, 2).toUpperCase()
      matchingDept = departments?.find(d => 
        d.code.startsWith(coursePrefix) || 
        course.code?.startsWith(d.code)
      ) || departments?.find(d => d.code === 'CS') // Default to CS
    }

    // Transform the response to include virtual columns
    const transformedCourse = {
      ...course,
      credits: credits || 3, // Add credits to response even if not stored
      department_id: department_id || matchingDept?.id || null, // Add department_id to response
      is_active: true, // Default to active
      max_enrollment: 50, // Default max enrollment
      departments: matchingDept, // Add department relationship
      enrollments: [],
      assignments: []
    }

    return NextResponse.json({
      message: 'Course created successfully',
      course: transformedCourse
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}