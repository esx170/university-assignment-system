import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - List all departments (mock data for now)
export async function GET() {
  try {
    // Return mock departments since the table doesn't exist yet
    const mockDepartments = [
      {
        id: '1',
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science and Engineering',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Mathematics',
        code: 'MATH',
        description: 'Department of Mathematics',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Physics',
        code: 'PHYS',
        description: 'Department of Physics',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Business Administration',
        code: 'BUS',
        description: 'School of Business Administration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockDepartments)
  } catch (error: any) {
    console.error('Departments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new department (Admin only) - Mock for now
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)

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
      return NextResponse.json({ error: 'Unauthorized: Only administrators can create departments' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Mock department creation
    const mockDepartment = {
      id: Date.now().toString(),
      name,
      code: code.toUpperCase(),
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Department created successfully (mock)',
      department: mockDepartment,
      note: 'This is mock data. Apply database schema to enable real department creation.'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}