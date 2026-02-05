import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    console.log('=== MAKING USER ADMIN ===')
    console.log('Email:', email)

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
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

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'User not found with that email' 
      }, { status: 404 })
    }

    // Update user role to admin
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user role:', updateError)
      return NextResponse.json({
        error: 'Failed to update user role',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('User role updated successfully:', updatedUser.email)

    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role
      }
    })

  } catch (error: any) {
    console.error('Make admin error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}