import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, Profile } from '@/lib/auth'
import { AssignmentWithCourse } from '@/lib/database.types'

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

    // TypeScript now knows user is Profile type with proper role property
    const userProfile: Profile = user

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

    // Type assertion to help TypeScript understand the joined data structure
    const assignmentWithCourse = assignment as AssignmentWithCourse

    // Check if user has access to this assignment
    if (userProfile.role === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', userProfile.id)
        .eq('course_id', assignmentWithCourse.course_id)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (userProfile.role === 'instructor') {
      // Check if instructor owns the course
      if (assignmentWithCourse.courses.instructor_id !== userProfile.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
    // Admin can access all assignments

    return NextResponse.json(assignmentWithCourse)
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
    
    const userProfile: Profile = user
    if (userProfile.role !== 'instructor' && userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership for instructors
    if (userProfile.role === 'instructor') {
      const { data: assignmentCheck } = await supabase
        .from('assignments')
        .select('courses(instructor_id)')
        .eq('id', params.id)
        .single()

      if (!assignmentCheck || (assignmentCheck as any).courses.instructor_id !== userProfile.id) {
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
    
    const userProfile: Profile = user
    if (userProfile.role !== 'instructor' && userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership for instructors
    if (userProfile.role === 'instructor') {
      const { data: assignmentCheck } = await supabase
        .from('assignments')
        .select('courses(instructor_id)')
        .eq('id', params.id)
        .single()

      if (!assignmentCheck || (assignmentCheck as any).courses.instructor_id !== userProfile.id) {
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