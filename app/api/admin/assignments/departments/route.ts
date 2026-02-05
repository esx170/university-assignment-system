import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Assign instructor to departments (Admin only)
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
      return NextResponse.json({ error: 'Unauthorized: Only administrators can assign departments' }, { status: 403 })
    }

    const body = await request.json()
    const { instructor_id, department_ids, replace_existing = false } = body

    if (!instructor_id || !department_ids || !Array.isArray(department_ids) || department_ids.length === 0) {
      return NextResponse.json({ error: 'Instructor ID and department IDs array are required' }, { status: 400 })
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

    // Verify all departments exist
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .in('id', department_ids)

    if (deptError || !departments || departments.length !== department_ids.length) {
      return NextResponse.json({ error: 'One or more departments not found' }, { status: 404 })
    }

    // If replace_existing is true, remove all existing assignments
    if (replace_existing) {
      await supabaseAdmin
        .from('instructor_department_assignments')
        .delete()
        .eq('instructor_id', instructor_id)
    }

    // Create new assignments
    const assignments = department_ids.map((dept_id: string, index: number) => ({
      instructor_id,
      department_id: dept_id,
      assigned_by: user.id,
      is_primary: index === 0 // First department is primary
    }))

    const { data: newAssignments, error: assignError } = await supabaseAdmin
      .from('instructor_department_assignments')
      .upsert(assignments, { 
        onConflict: 'instructor_id,department_id',
        ignoreDuplicates: false 
      })
      .select(`
        *,
        departments (
          id,
          name,
          code
        )
      `)

    if (assignError) {
      console.error('Assignment error:', assignError)
      return NextResponse.json({ 
        error: 'Failed to create department assignments',
        details: assignError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Department assignments created successfully',
      instructor: instructor.full_name,
      assignments: newAssignments
    })
  } catch (error: any) {
    console.error('Department assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Remove instructor from departments (Admin only)
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
      return NextResponse.json({ error: 'Unauthorized: Only administrators can remove department assignments' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const instructor_id = searchParams.get('instructor_id')
    const department_id = searchParams.get('department_id')

    if (!instructor_id) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('instructor_department_assignments')
      .delete()
      .eq('instructor_id', instructor_id)

    if (department_id) {
      // Remove from specific department
      query = query.eq('department_id', department_id)
    }
    // If no department_id, remove from all departments

    const { error } = await query

    if (error) {
      console.error('Remove assignment error:', error)
      return NextResponse.json({ 
        error: 'Failed to remove department assignment',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: department_id 
        ? 'Instructor removed from department successfully'
        : 'Instructor removed from all departments successfully'
    })
  } catch (error: any) {
    console.error('Remove department assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}