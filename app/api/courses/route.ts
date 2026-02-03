import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - List courses (simplified version without departments)
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

    // For now, return mock courses since we don't have the full database schema
    const mockCourses = [
      {
        id: '1',
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Basic concepts of programming and computer science',
        credits: 3,
        semester: 'Fall',
        year: 2024,
        department_id: null,
        instructor_id: user.id,
        department: {
          id: '1',
          name: 'Computer Science',
          code: 'CS'
        },
        instructor: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Instructor',
          email: user.email
        },
        enrollments: [{ count: 0 }],
        assignments: [{ count: 0 }]
      },
      {
        id: '2',
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced programming concepts and algorithm design',
        credits: 4,
        semester: 'Spring',
        year: 2024,
        department_id: null,
        instructor_id: user.id,
        department: {
          id: '1',
          name: 'Computer Science',
          code: 'CS'
        },
        instructor: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Instructor',
          email: user.email
        },
        enrollments: [{ count: 0 }],
        assignments: [{ count: 0 }]
      }
    ]

    return NextResponse.json(mockCourses)
  } catch (error: any) {
    console.error('Courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new course (simplified version)
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
    const { name, code, description, credits, semester, year } = body

    if (!name || !code || !semester || !year) {
      return NextResponse.json({ error: 'Name, code, semester, and year are required' }, { status: 400 })
    }

    // For now, just return success since we don't have the full database schema
    const mockCourse = {
      id: Date.now().toString(),
      name,
      code: code.toUpperCase(),
      description,
      credits: credits || 3,
      semester,
      year: parseInt(year),
      department_id: null,
      instructor_id: user.id,
      department: {
        id: '1',
        name: 'Computer Science',
        code: 'CS'
      },
      instructor: {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Instructor',
        email: user.email
      }
    }

    return NextResponse.json({
      message: 'Course created successfully',
      course: mockCourse
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}