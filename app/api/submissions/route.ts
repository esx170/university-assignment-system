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

    const { data: user, error} = await supabaseAdmin
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
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    let query = supabaseAdmin.from('submissions').select(`
      *,
      assignments (
        id,
        title,
        due_date,
        max_points,
        course_id,
        courses (
          id,
          name,
          code
        )
      ),
      student:profiles!student_id (full_name, student_id)
    `)

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    // Filter based on user role
    if (currentUser.role === 'student') {
      query = query.eq('student_id', currentUser.id)
    } else if (currentUser.role === 'instructor') {
      // Get submissions for assignments in courses taught by the instructor
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('instructor_id', currentUser.id)
      
      const courseIds = courses?.map(c => c.id) || []
      
      // Filter submissions by course ownership
      const { data: assignments } = await supabaseAdmin
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
  } catch (error: any) {
    console.error('Get submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    if (currentUser.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Only students can submit assignments' }, { status: 401 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const formData = await request.formData()
    const assignmentId = formData.get('assignment_id') as string
    const file = formData.get('file') as File

    if (!assignmentId || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, due_date, allow_late, file_types, max_file_size')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', currentUser.id)
      .eq('course_id', assignment.course_id)
      .eq('status', 'active')
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in course' }, { status: 403 })
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', currentUser.id)
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
    const fileName = `${currentUser.id}/${assignmentId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('submissions')
      .upload(fileName, file)

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create submission record
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: currentUser.id,
        file_url: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        is_late: isLate
      })
      .select()
      .single()

    if (error) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from('submissions').remove([fileName])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submission, { status: 201 })
  } catch (error: any) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    if (currentUser.role !== 'instructor' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only instructors can grade submissions' }, { status: 401 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { submission_id, grade, feedback } = body

    if (!submission_id) {
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 })
    }

    // Get submission details
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments (
          id,
          course_id,
          max_points,
          courses (instructor_id)
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify instructor owns the course (unless admin)
    if (currentUser.role === 'instructor') {
      if (submission.assignments.courses.instructor_id !== currentUser.id) {
        return NextResponse.json({ error: 'Unauthorized: You can only grade submissions for your courses' }, { status: 403 })
      }
    }

    // Validate grade
    if (grade !== undefined && grade !== null) {
      const maxPoints = submission.assignments.max_points
      if (grade < 0 || grade > maxPoints) {
        return NextResponse.json({ 
          error: `Grade must be between 0 and ${maxPoints}` 
        }, { status: 400 })
      }
    }

    // Calculate grade percentage
    const gradePercentage = grade !== undefined && grade !== null 
      ? (grade / submission.assignments.max_points) * 100 
      : null

    // Update submission with grade and feedback
    const updateData: any = {
      graded_at: new Date().toISOString(),
      graded_by: currentUser.id
    }

    if (grade !== undefined && grade !== null) {
      updateData.grade = grade
      updateData.grade_percentage = gradePercentage
      updateData.status = 'graded'
    }

    if (feedback !== undefined) {
      updateData.feedback = feedback
    }

    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select(`
        *,
        assignments (title, max_points, courses (name, code)),
        student:profiles!student_id (full_name, student_id)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedSubmission)
  } catch (error: any) {
    console.error('Grade submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}