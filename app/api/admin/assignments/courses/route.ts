import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Assign instructor to courses (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for verification
    const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can assign courses' }, { status: 403 })
    }

    const body = await request.json()
    const { instructor_id, course_ids, replace_existing = false } = body

    if (!instructor_id || !course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return NextResponse.json({ error: 'Instructor ID and course IDs array are required' }, { status: 400 })
    }

    // Verify instructor exists and is actually an instructor
    const { data: instructor, error: instructorError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', instructor_id)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    if (instructor.role !== 'instructor' && instructor.role !== 'admin') {
      return NextResponse.json({ error: 'User is not an instructor' }, { status: 400 })
    }

    // Verify all courses exist and get their department info
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .select(`
        id, 
        name, 
        code,
        department_id,
        departments (
          id,
          name,
          code
        )
      `)
      .in('id', course_ids)

    if (courseError || !courses || courses.length !== course_ids.length) {
      return NextResponse.json({ error: 'One or more courses not found' }, { status: 404 })
    }

    // Verify instructor is assigned to the departments of these courses
    const departmentIds = [...new Set(courses.map(course => course.department_id))]
    
    const { data: instructorDepts, error: deptCheckError } = await supabaseAdmin
      .from('instructor_department_assignments')
      .select('department_id')
      .eq('instructor_id', instructor_id)
      .in('department_id', departmentIds)

    if (deptCheckError) {
      return NextResponse.json({ 
        error: 'Failed to verify department assignments',
        details: deptCheckError.message
      }, { status: 500 })
    }

    const assignedDeptIds = instructorDepts?.map(d => d.department_id) || []
    const unassignedDepts = departmentIds.filter(deptId => !assignedDeptIds.includes(deptId))

    if (unassignedDepts.length > 0) {
      const unassignedDeptNames = courses
        .filter(course => unassignedDepts.includes(course.department_id))
        .map(course => course.departments?.name)
        .filter((name, index, arr) => arr.indexOf(name) === index)

      return NextResponse.json({ 
        error: `Instructor is not assigned to the following departments: ${unassignedDeptNames.join(', ')}. Please assign the instructor to these departments first.`
      }, { status: 400 })
    }

    // If replace_existing is true, remove all existing course assignments
    if (replace_existing) {
      await supabaseAdmin
        .from('instructor_course_assignments')
        .delete()
        .eq('instructor_id', instructor_id)
    }

    // Create new course assignments
    const assignments = course_ids.map((course_id: string, index: number) => ({
      instructor_id,
      course_id,
      assigned_by: user.id,
      is_primary: index === 0 // First course is primary
    }))

    const { data: newAssignments, error: assignError } = await supabaseAdmin
      .from('instructor_course_assignments')
      .upsert(assignments, { 
        onConflict: 'instructor_id,course_id',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        courses (
          id,
          name,
          code,
          departments (
            name,
            code
          )
        )
      `)

    if (assignError) {
      console.error('Course assignment error:', assignError)
      return NextResponse.json({ 
        error: 'Failed to create course assignments',
        details: assignError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Course assignments created successfully',
      instructor: instructor.full_name,
      assignments: newAssignments
    })
  } catch (error: any) {
    console.error('Course assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Remove instructor from courses (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for verification
    const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can remove course assignments' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const instructor_id = searchParams.get('instructor_id')
    const course_id = searchParams.get('course_id')

    if (!instructor_id) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('instructor_course_assignments')
      .delete()
      .eq('instructor_id', instructor_id)

    if (course_id) {
      // Remove from specific course
      query = query.eq('course_id', course_id)
    }
    // If no course_id, remove from all courses

    const { error } = await query

    if (error) {
      console.error('Remove course assignment error:', error)
      return NextResponse.json({ 
        error: 'Failed to remove course assignment',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: course_id 
        ? 'Instructor removed from course successfully'
        : 'Instructor removed from all courses successfully'
    })
  } catch (error: any) {
    console.error('Remove course assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}