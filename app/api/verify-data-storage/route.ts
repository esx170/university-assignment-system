import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== VERIFYING DATA STORAGE ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check all tables and their data
    const results: any = {}

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    results.profiles = {
      count: profiles?.length || 0,
      error: profilesError?.message,
      sample: profiles?.slice(0, 3).map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        created_at: p.created_at
      }))
    }

    // Check departments table
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*')

    results.departments = {
      count: departments?.length || 0,
      error: deptError?.message,
      sample: departments?.slice(0, 3).map(d => ({
        code: d.code,
        name: d.name
      }))
    }

    // Check courses table
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('*')

    results.courses = {
      count: courses?.length || 0,
      error: coursesError?.message
    }

    // Check assignments table
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')

    results.assignments = {
      count: assignments?.length || 0,
      error: assignmentsError?.message
    }

    // Check submissions table
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')

    results.submissions = {
      count: submissions?.length || 0,
      error: submissionsError?.message
    }

    return NextResponse.json({
      success: true,
      message: 'Data storage verification complete',
      timestamp: new Date().toISOString(),
      database: {
        url: supabaseUrl,
        connected: true
      },
      tables: results,
      summary: {
        totalUsers: profiles?.length || 0,
        totalDepartments: departments?.length || 0,
        totalCourses: courses?.length || 0,
        totalAssignments: assignments?.length || 0,
        totalSubmissions: submissions?.length || 0,
        dataIsBeingSaved: (profiles?.length || 0) > 0
      }
    })

  } catch (error: any) {
    console.error('Data verification error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to verify data storage'
    }, { status: 500 })
  }
}