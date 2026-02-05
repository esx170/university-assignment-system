import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('=== NORMAL SIGNIN API ===')

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Find user in profiles table
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    console.log('User found, creating session...')

    // Create a simple session token (in production, use proper JWT)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        student_id: user.student_id
      },
      session: {
        token: sessionToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      message: 'Signed in successfully!'
    })

  } catch (error: any) {
    console.error('Signin API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}