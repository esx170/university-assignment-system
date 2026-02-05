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

// GET - Get single course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get course from database with instructor relationship (without department since column doesn't exist)
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        profiles:instructor_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get departments to match with course
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('*')

    // Try to match department based on course code
    const coursePrefix = course.code?.substring(0, 2).toUpperCase()
    const matchingDept = departments?.find(d => 
      d.code.startsWith(coursePrefix) || 
      course.code?.startsWith(d.code)
    ) || departments?.find(d => d.code === 'CS') // Default to CS

    // Transform the course data
    const transformedCourse = {
      ...course,
      // Set default values for missing columns
      is_active: true, // Default to active since column doesn't exist
      credits: 3, // Default credits
      max_enrollment: 50, // Default max enrollment
      department_id: matchingDept?.id || null,
      // Transform relationships
      department: matchingDept || null,
      instructor: course.profiles || {
        id: course.instructor_id,
        full_name: 'Instructor',
        email: 'instructor@university.edu'
      },
      // Add mock data for now
      enrollments: [
        { id: '1', student_name: 'Alice Johnson', student_id: 'STU001' },
        { id: '2', student_name: 'Bob Wilson', student_id: 'STU002' },
        { id: '3', student_name: 'Carol Davis', student_id: 'STU003' }
      ],
      assignments: [
        { id: '1', title: 'Programming Basics', due_date: '2024-02-15', status: 'active' },
        { id: '2', title: 'Data Structures', due_date: '2024-03-01', status: 'draft' }
      ]
    }

    return NextResponse.json(transformedCourse)
  } catch (error: any) {
    console.error('Get course error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update course by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin - ONLY ADMIN CAN UPDATE COURSES
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can update courses' }, { status: 403 })
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

    // Verify department exists if provided
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

    // Update course in Supabase database (only with existing columns)
    const courseUpdateData: any = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      semester: semester.trim(),
      year: parseInt(year),
      updated_at: new Date().toISOString()
    }

    // Add optional fields that exist in the table
    if (description !== undefined) {
      courseUpdateData.description = description?.trim() || null
    }

    // Add instructor_id if provided
    if (instructor_id) {
      courseUpdateData.instructor_id = instructor_id
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update(courseUpdateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A course with this code already exists for this semester and year' }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update course',
        details: error.message
      }, { status: 500 })
    }

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get departments to match with course
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
      department: matchingDept, // Add department relationship
      instructor: null, // TODO: Add instructor info
      enrollments: [],
      assignments: []
    }

    return NextResponse.json({
      message: 'Course updated successfully',
      course: transformedCourse
    })
  } catch (error: any) {
    console.error('Update course error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}