import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    auth: {},
    apis: {},
    overall: 'UNKNOWN'
  }

  try {
    // 1. Environment Check
    diagnostics.environment = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      urls: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
      }
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      diagnostics.overall = 'CRITICAL - Missing Environment Variables'
      return NextResponse.json(diagnostics)
    }

    // 2. Database Connection Test
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('departments')
      .select('count')
      .limit(1)

    diagnostics.database.connection = {
      success: !connectionError,
      error: connectionError?.message
    }

    // Test table existence
    const tables = ['departments', 'profiles', 'courses', 'assignments', 'submissions']
    const tableTests = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)
        
        tableTests[table] = {
          exists: !error,
          error: error?.message,
          hasData: data && data.length > 0
        }
      } catch (err) {
        tableTests[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    diagnostics.database.tables = tableTests

    // 3. Test Write Operations
    const testId = `test-${Date.now()}`
    
    // Test department creation
    try {
      const { data: createTest, error: createError } = await supabaseAdmin
        .from('departments')
        .insert({
          name: `Test Department ${testId}`,
          code: `TEST${Date.now()}`,
          description: 'Test department for diagnostics'
        })
        .select()

      diagnostics.database.writeTest = {
        success: !createError,
        error: createError?.message,
        data: createTest
      }

      // Clean up test data
      if (createTest && createTest.length > 0) {
        await supabaseAdmin
          .from('departments')
          .delete()
          .eq('code', `TEST${Date.now()}`)
      }
    } catch (err) {
      diagnostics.database.writeTest = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 4. Auth Test
    try {
      const { data: authTest, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      diagnostics.auth = {
        connection: !authError,
        userCount: authTest?.users?.length || 0,
        error: authError?.message
      }
    } catch (err) {
      diagnostics.auth = {
        connection: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 5. API Endpoint Tests
    const apiTests = {}
    const apiEndpoints = [
      '/api/public/departments',
      '/api/departments',
      '/api/admin/users'
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${endpoint}`)
        apiTests[endpoint] = {
          status: response.status,
          ok: response.ok,
          accessible: true
        }
      } catch (err) {
        apiTests[endpoint] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    diagnostics.apis = apiTests

    // 6. Overall Status
    const hasConnection = diagnostics.database.connection.success
    const hasWriteAccess = diagnostics.database.writeTest?.success
    const hasAuth = diagnostics.auth.connection
    
    if (hasConnection && hasWriteAccess && hasAuth) {
      diagnostics.overall = 'HEALTHY'
    } else if (hasConnection) {
      diagnostics.overall = 'PARTIAL - Connection OK but write/auth issues'
    } else {
      diagnostics.overall = 'CRITICAL - No database connection'
    }

    return NextResponse.json(diagnostics)

  } catch (error: any) {
    diagnostics.overall = 'CRITICAL - System Error'
    diagnostics.systemError = {
      message: error.message,
      stack: error.stack
    }
    
    return NextResponse.json(diagnostics, { status: 500 })
  }
}