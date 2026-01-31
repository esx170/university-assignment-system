import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, Profile } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses (name, code, instructor_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user has access to this assignment
    if (user.role === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', assignment.course_id)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (user.role === 'instructor') {
      // Check if instructor owns the course
      if (assignment.courses.instructor_id !== user.id) {
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
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership for instructors
    if (user.role === 'instructor') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('courses(instructor_id)')
        .eq('id', params.id)
        .single()

      if (!assignment || assignment.courses.instructor_id !== user.id) {
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
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership for instructors
    if (user.role === 'instructor') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('courses(instructor_id)')
        .eq('id', params.id)
        .single()

      if (!assignment || assignment.courses.instructor_id !== user.id) {
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