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

// GET - Get students in instructor's department (Instructor only)
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

    // Get instructor profile with department information
    const { data: instructorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        department_id
      `)
      .eq('id', currentUser.id)
      .single()

    if (profileError || !instructorProfile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch instructor profile',
        details: profileError?.message
      }, { status: 500 })
    }

    // Get instructor's department
    let instructorDepartment = null
    if (instructorProfile.department_id) {
      const { data: department, error: deptError } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('id', instructorProfile.department_id)
        .single()

      if (department && !deptError) {
        instructorDepartment = department
        console.log(`✅ Found instructor department: ${department.code} - ${department.name}`)
      } else {
        console.log(`❌ Failed to fetch department for ID ${instructorProfile.department_id}:`, deptError?.message)
      }
    } else {
      console.log(`⚠️ Instructor ${instructorProfile.full_name} has no department_id assigned`)
    }

    if (!instructorDepartment) {
      return NextResponse.json({
        instructor: {
          id: currentUser.id,
          name: currentUser.full_name || currentUser.email,
          email: currentUser.email,
          department: {
            id: null,
            name: 'No Department Assigned',
            code: 'N/A'
          }
        },
        students: [],
        summary: {
          total_students: 0,
          active_students: 0,
          enrolled_courses: 0
        }
      })
    }

    // Get students in instructor's department
    const { data: departmentStudents, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_id,
        created_at
      `)
      .eq('role', 'student')
      .eq('department_id', instructorDepartment.id)
      .order('full_name')

    if (studentsError) {
      console.error('Students error:', studentsError)
      return NextResponse.json({ 
        error: 'Failed to fetch students',
        details: studentsError.message
      }, { status: 500 })
    }

    const students = departmentStudents || []

    // Get course enrollments for these students (if course_enrollments table exists)
    let enrollmentData = {}
    try {
      const studentIds = students.map(s => s.id)
      if (studentIds.length > 0) {
        const { data: enrollments, error: enrollError } = await supabaseAdmin
          .from('course_enrollments')
          .select(`
            student_id,
            courses (
              id,
              name,
              code
            )
          `)
          .in('student_id', studentIds)

        if (!enrollError && enrollments) {
          enrollments.forEach(enrollment => {
            if (!enrollmentData[enrollment.student_id]) {
              enrollmentData[enrollment.student_id] = []
            }
            enrollmentData[enrollment.student_id].push(enrollment.courses)
          })
        }
      }
    } catch (error) {
      console.log('Course enrollments table may not exist, skipping enrollment data')
    }

    // Format student data
    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.full_name,
      email: student.email,
      student_id: student.student_id,
      department: instructorDepartment.code,
      enrolled_at: student.created_at,
      courses: enrollmentData[student.id] || [],
      course_count: (enrollmentData[student.id] || []).length,
      status: 'active' // Default status
    }))

    return NextResponse.json({
      instructor: {
        id: currentUser.id,
        name: currentUser.full_name || currentUser.email,
        email: currentUser.email,
        department: {
          id: instructorDepartment.id,
          name: instructorDepartment.name,
          code: instructorDepartment.code
        }
      },
      students: formattedStudents,
      summary: {
        total_students: students.length,
        active_students: students.length,
        enrolled_courses: Object.values(enrollmentData).flat().length
      }
    })
  } catch (error: any) {
    console.error('Instructor students API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}