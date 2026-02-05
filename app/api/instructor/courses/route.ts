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

    // Check if user is instructor or admin
    const isHardcodedAdmin = currentUser.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : currentUser.role

    if (userRole !== 'instructor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only instructors and administrators can access this endpoint' }, { status: 403 })
    }

    // Create admin client for data access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let courses = []

    if (userRole === 'admin') {
      // Admins can see all courses
      const { data: allCourses, error } = await supabaseAdmin
        .from('courses')
        .select('id, name, code, description')
        .order('code')

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ 
          error: 'Failed to fetch courses',
          details: error.message
        }, { status: 500 })
      }

      courses = allCourses || []
    } else {
      // For instructors, return only courses they are assigned to
      const { data: instructorCourses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('id, name, code, description, instructor_id')
        .eq('instructor_id', currentUser.id)
        .order('code')

      if (coursesError) {
        console.error('Database error:', coursesError)
        return NextResponse.json({ 
          error: 'Failed to fetch courses',
          details: coursesError.message
        }, { status: 500 })
      }

      courses = instructorCourses || []
      
      console.log(`Instructor ${currentUser.email} has ${courses.length} assigned courses`)
    }

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error('Instructor courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}