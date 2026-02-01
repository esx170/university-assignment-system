import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, Profile } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// Define the exact shape of our query result
interface AssignmentQueryResult {
  id: string
  course_id: string
  title: string
  description: string | null
  due_date: string
  max_points: number
  rubric_url: string | null
  allow_late: boolean
  late_penalty: number
  file_types: string[]
  max_file_size: number
  created_at: string
  updated_at: string
  courses: {
    name: string
    code: string
    instructor_id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Explicitly assert the type after null check
    const authenticatedUser: Profile = user

    // Now TypeScript knows user is not null
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses (name, code, instructor_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Explicitly type the result
    const assignment: AssignmentQueryResult = data as AssignmentQueryResult

    // Check if user has access to this assignment
    if (authenticatedUser.role === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', authenticatedUser.id)
        .eq('course_id', assignment.course_id)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (authenticatedUser.role === 'instructor') {
      // Check if instructor owns the course
      if (assignment.courses.instructor_id !== authenticatedUser.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
    // Admin can access all assignments

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Explicitly assert the type after null check
    const authenticatedUser: Profile = user
    
    if (authenticatedUser.role !== 'instructor' && authenticatedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership for instructors
    if (authenticatedUser.role === 'instructor') {
      const { data: assignmentCheck } = await supabase
        .from('assignments')
        .select(`
          id,
          courses!inner (instructor_id)
        `)
        .eq('id', params.id)
        .single()

      if (!assignmentCheck || (assignmentCheck as any).courses.instructor_id !== authenticatedUser.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { data: updatedAssignment, error } = await supabase
      .from('assignments')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Explicitly assert the type after null check
    const authenticatedUser: Profile = user
    
    if (authenticatedUser.role !== 'instructor' && authenticatedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership for instructors
    if (authenticatedUser.role === 'instructor') {
      const { data: assignmentCheck } = await supabase
        .from('assignments')
        .select(`
          id,
          courses!inner (instructor_id)
        `)
        .eq('id', params.id)
        .single()

      if (!assignmentCheck || (assignmentCheck as any).courses.instructor_id !== authenticatedUser.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}