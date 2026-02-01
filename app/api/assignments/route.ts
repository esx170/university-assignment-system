import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { assignmentSchema } from '@/lib/validations'
import { getCurrentUser, Profile } from '@/lib/auth'
import { AssignmentWithSubmissions } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    let query = supabase.from('assignments').select(`
      *,
      courses (name, code),
      submissions (id, grade, submitted_at, student_id)
    `)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    // Filter based on user role
    if (user.role === 'student') {
      // Get assignments for courses the student is enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
      
      const courseIds = enrollments?.map((e: any) => e.course_id) || []
      query = query.in('course_id', courseIds)
    } else if (user.role === 'instructor') {
      // Get assignments for courses taught by the instructor
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', user.id)
      
      const courseIds = courses?.map((c: any) => c.id) || []
      query = query.in('course_id', courseIds)
    }
    // Admin can see all assignments (no filter)

    const { data: assignments, error } = await query.order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Type assertion for the joined query results
    const assignmentsWithSubmissions = assignments as AssignmentWithSubmissions[]

    // For students, add submission status
    if (user.role === 'student') {
      const assignmentsWithStatus = assignmentsWithSubmissions?.map(assignment => {
        const userSubmission = assignment.submissions?.find(
          (sub: any) => sub.student_id === user.id
        )
        return {
          ...assignment,
          userSubmission,
          isSubmitted: !!userSubmission,
          isLate: userSubmission ? new Date(userSubmission.submitted_at) > new Date(assignment.due_date) : false
        }
      })
      return NextResponse.json(assignmentsWithStatus)
    }

    return NextResponse.json(assignmentsWithSubmissions)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    // Verify the instructor owns the course (if instructor)
    if (user.role === 'instructor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', body.course_id)
        .single()

      if (!course || course.instructor_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}