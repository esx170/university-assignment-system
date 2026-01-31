import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, Profile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    let query = supabase.from('submissions').select(`
      *,
      assignments (title, due_date, max_points, course_id),
      profiles (full_name, student_id)
    `)

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    // Filter based on user role
    const userProfile: Profile = user
    if (userProfile.role === 'student') {
      query = query.eq('student_id', userProfile.id)
    } else if (userProfile.role === 'instructor') {
      // Get submissions for assignments in courses taught by the instructor
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', userProfile.id)
      
      const courseIds = courses?.map(c => c.id) || []
      
      // Filter submissions by course ownership
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .in('course_id', courseIds)
      
      const assignmentIds = assignments?.map(a => a.id) || []
      query = query.in('assignment_id', assignmentIds)
    }
    // Admin can see all submissions (no filter)

    const { data: submissions, error } = await query.order('submitted_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submissions)
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
    
    const userProfile: Profile = user
    if (userProfile.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const assignmentId = formData.get('assignment_id') as string
    const file = formData.get('file') as File

    if (!assignmentId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify student is enrolled in the course
    const { data: assignment } = await supabase
      .from('assignments')
      .select('course_id, due_date, allow_late, file_types, max_file_size')
      .eq('id', assignmentId)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userProfile.id)
      .eq('course_id', assignment.course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in course' }, { status: 403 })
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', userProfile.id)
      .single()

    if (existingSubmission) {
      return NextResponse.json({ error: 'Assignment already submitted' }, { status: 400 })
    }

    // Validate file
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!assignment.file_types.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${assignment.file_types.join(', ')}` 
      }, { status: 400 })
    }

    if (file.size > assignment.max_file_size * 1024 * 1024) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${assignment.max_file_size}MB` 
      }, { status: 400 })
    }

    // Check if late submission
    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    const isLate = now > dueDate

    if (isLate && !assignment.allow_late) {
      return NextResponse.json({ error: 'Late submissions not allowed' }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileName = `${userProfile.id}/${assignmentId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(fileName, file)

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create submission record
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: userProfile.id,
        file_url: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        is_late: isLate
      })
      .select()
      .single()

    if (error) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('submissions').remove([fileName])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}