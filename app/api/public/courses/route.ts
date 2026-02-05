import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Get all courses (public endpoint for admin forms)
export async function GET(request: NextRequest) {
  try {
    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get all courses
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('code')

    if (coursesError) {
      console.error('Courses error:', coursesError)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: coursesError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      courses: courses || [],
      total: courses?.length || 0
    })
  } catch (error: any) {
    console.error('Public courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}