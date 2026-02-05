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

    const { data: user, error } = await supabaseAdmin
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

// GET - List enrollments (Admin only)
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

    // Check if user is admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can view enrollments' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Try to get enrollments from course_enrollments table first
    const { data: enrollments, error } = await supabaseAdmin
      .from('course_enrollments')
      .select(`
        *,
        profiles!student_id(full_name),
        courses(name, code)
      `)
      .order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Enrollments error:', error)
      // If table doesn't exist, return empty array with helpful message
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return NextResponse.json({
          enrollments: [],
          message: 'Course enrollments table does not exist yet. Please create the table first.',
          note: 'You can still manage users and courses separately until the enrollments table is created.'
        })
      }
      return NextResponse.json({ 
        error: 'Failed to fetch enrollments',
        details: error.message
      }, { status: 500 })
    }

    // Transform the data for the frontend
    const transformedEnrollments = enrollments?.map(enrollment => ({
      id: enrollment.id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      enrolled_at: enrollment.enrolled_at,
      status: enrollment.status,
      student_name: enrollment.profiles?.full_name || 'Unknown Student',
      course_name: enrollment.courses?.name || 'Unknown Course',
      course_code: enrollment.courses?.code || 'N/A'
    })) || []

    return NextResponse.json(transformedEnrollments)
  } catch (error: any) {
    console.error('Get enrollments error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Enroll student in courses (Admin only)
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

    // Check if user is admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can enroll students' }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, course_ids } = body

    if (!student_id || !course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({ error: 'Student ID and course IDs array are required' }, { status: 400 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if course_enrollments table exists
    const { error: tableCheckError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .limit(1)

    if (tableCheckError && (tableCheckError.message.includes('does not exist') || tableCheckError.message.includes('schema cache'))) {
      return NextResponse.json({ 
        error: 'Course enrollments table not found',
        details: 'The course_enrollments table needs to be created first.',
        action: 'create_table',
        sql: `CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  grade NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON course_enrollments FOR ALL USING (true);`,
        instructions: [
          'Go to your Supabase dashboard',
          'Navigate to SQL Editor',
          'Paste the SQL above and execute it',
          'Return to this page and try enrolling again'
        ]
      }, { status: 400 })
    }

    // Verify student exists and is actually a student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 400 })
    }

    // Verify all courses exist
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, name, code')
      .in('id', course_ids)

    if (courseError || !courses || courses.length !== course_ids.length) {
      return NextResponse.json({ error: 'One or more courses not found' }, { status: 404 })
    }

    // Create enrollments
    const enrollments = course_ids.map((course_id: string) => ({
      student_id,
      course_id,
      enrolled_by: currentUser.id,
      status: 'active'
    }))

    const { data: newEnrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .upsert(enrollments, { 
        onConflict: 'student_id,course_id',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        profiles!student_id(full_name),
        courses(name, code)
      `)

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return NextResponse.json({ 
        error: 'Failed to create enrollments',
        details: enrollError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Student enrolled successfully',
      student: student.full_name,
      enrollments: newEnrollments
    })
  } catch (error: any) {
    console.error('Student enrollment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}