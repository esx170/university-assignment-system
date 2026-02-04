import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllCourses, addCourse } from '@/lib/mock-storage'

// GET - List courses (using persistent mock storage)
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Get all courses from persistent mock storage
    const courses = getAllCourses()

    // Update instructor info with current user if they created courses
    const coursesWithUserInfo = courses.map(course => ({
      ...course,
      instructor: course.instructor_id === user.id ? {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Instructor',
        email: user.email || 'instructor@university.edu'
      } : course.instructor
    }))

    return NextResponse.json(coursesWithUserInfo)
  } catch (error: any) {
    console.error('Courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new course (persistent mock storage)
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin or instructor
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin' && userRole !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators and instructors can create courses' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, credits, semester, year, department_id } = body

    if (!name || !code || !semester || !year || !department_id) {
      return NextResponse.json({ error: 'Name, code, semester, year, and department are required' }, { status: 400 })
    }

    // Add course to persistent mock storage
    const newCourse = addCourse({
      name,
      code: code.toUpperCase(),
      description: description || '',
      credits: credits || 3,
      semester,
      year: parseInt(year),
      department_id,
      instructor_id: user.id
    })

    // Update instructor info with current user
    newCourse.instructor = {
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Instructor',
      email: user.email || 'instructor@university.edu'
    }

    return NextResponse.json({
      message: 'Course created successfully',
      course: newCourse
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}