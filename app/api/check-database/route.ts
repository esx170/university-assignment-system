import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
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

    console.log('Checking database tables...')

    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
      return NextResponse.json({ 
        error: 'Failed to fetch tables',
        details: tablesError.message
      }, { status: 500 })
    }

    // Check specific tables we need
    const requiredTables = [
      'departments',
      'profiles', 
      'courses',
      'assignments',
      'submissions',
      'course_enrollments'
    ]

    const existingTables = tables?.map(t => t.table_name) || []
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))

    // Try to get sample data from existing tables
    const tableData: any = {}
    
    for (const tableName of existingTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(3)

        if (!error) {
          tableData[tableName] = {
            count: data?.length || 0,
            sample: data || []
          }
        } else {
          tableData[tableName] = {
            error: error.message
          }
        }
      } catch (err) {
        tableData[tableName] = {
          error: 'Failed to query table'
        }
      }
    }

    return NextResponse.json({
      message: 'Database check completed',
      existing_tables: existingTables,
      missing_tables: missingTables,
      required_tables: requiredTables,
      table_data: tableData
    })
  } catch (error: any) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}