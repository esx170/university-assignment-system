import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { courseSchema } from '@/lib/validations'
import { getCurrentUser, Profile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase.from('courses').select(`
      *,
      profiles:instructor_id (full_name),
      enrollments (student_id)
    `)

    // Filter based on user role
    const userProfile = user as Profile
    if (userProfile.role === 'student') {
      // Get courses the student is enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', userProfile.id)
      
      const courseIds = enrollments?.map(e => e.course_id) || []
      query = query.in('id', courseIds)
    } else if (userProfile.role === 'instructor') {
      // Get courses taught by the instructor
      query = query.eq('instructor_id', userProfile.id)
    }
    // Admin can see all courses (no filter)

    const { data: courses, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(courses)
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
    
    const userProfile = user as Profile
    if (userProfile.role !== 'instructor' && userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...validatedData,
        instructor_id: userProfile.role === 'instructor' ? userProfile.id : body.instructor_id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}