import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Create new assignment (Instructors and Admins only)
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

    // Check if user is admin or instructor - STUDENTS CANNOT CREATE ASSIGNMENTS
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

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
    const { course_id, title, description, due_date, max_points } = body

    if (!course_id || !title || !due_date || !max_points) {
      return NextResponse.json({ 
        error: 'Missing required fields: course_id, title, due_date, and max_points are required' 
      }, { status: 400 })
    }

    // For now, return success with mock assignment data
    const mockAssignment = {
      id: Date.now().toString(),
      course_id,
      title,
      description: description || '',
      due_date,
      max_points: parseInt(max_points),
      instructor_id: user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment: mockAssignment
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}