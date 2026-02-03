import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In a real app, these would be stored in a database
let systemSettings = {
  allowPublicRegistration: true,
  requireEmailConfirmation: false,
  maxFileSize: 10,
  allowedFileTypes: 'pdf,doc,docx,zip,txt',
  systemName: 'University Assignment System',
  adminEmail: 'admin@university.edu'
}

// GET - Get system settings (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can access settings' }, { status: 403 })
    }

    return NextResponse.json(systemSettings)
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update system settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 })
    }

    // Check if user is admin
    const isHardcodedAdmin = user.email === 'admin@university.edu'
    const userRole = isHardcodedAdmin ? 'admin' : (user.user_metadata?.role || 'student')

    if (!isHardcodedAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only administrators can update settings' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      allowPublicRegistration, 
      requireEmailConfirmation, 
      maxFileSize, 
      allowedFileTypes, 
      systemName 
    } = body

    // Validate settings
    if (typeof allowPublicRegistration !== 'boolean') {
      return NextResponse.json({ error: 'allowPublicRegistration must be a boolean' }, { status: 400 })
    }

    if (typeof requireEmailConfirmation !== 'boolean') {
      return NextResponse.json({ error: 'requireEmailConfirmation must be a boolean' }, { status: 400 })
    }

    if (typeof maxFileSize !== 'number' || maxFileSize < 1 || maxFileSize > 100) {
      return NextResponse.json({ error: 'maxFileSize must be a number between 1 and 100' }, { status: 400 })
    }

    if (typeof allowedFileTypes !== 'string' || !allowedFileTypes.trim()) {
      return NextResponse.json({ error: 'allowedFileTypes must be a non-empty string' }, { status: 400 })
    }

    if (typeof systemName !== 'string' || !systemName.trim()) {
      return NextResponse.json({ error: 'systemName must be a non-empty string' }, { status: 400 })
    }

    // Update settings (in a real app, save to database)
    systemSettings = {
      ...systemSettings,
      allowPublicRegistration,
      requireEmailConfirmation,
      maxFileSize,
      allowedFileTypes: allowedFileTypes.trim(),
      systemName: systemName.trim()
    }

    console.log('Settings updated:', systemSettings)

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: systemSettings
    })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}