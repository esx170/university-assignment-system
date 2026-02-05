import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
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

    console.log('Reading enhanced schema file...')
    const schemaPath = path.join(process.cwd(), 'supabase', 'enhanced-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('Applying enhanced schema to database...')
    
    // Execute the entire schema as one statement
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql: schema 
    })

    if (error) {
      console.error('Schema application error:', error)
      return NextResponse.json({ 
        error: 'Failed to apply enhanced schema',
        details: error.message
      }, { status: 500 })
    }

    console.log('Enhanced schema applied successfully!')

    // Verify key tables exist
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'departments',
        'profiles', 
        'instructor_department_assignments',
        'instructor_course_assignments',
        'courses',
        'course_enrollments',
        'assignments',
        'submissions'
      ])

    if (tablesError) {
      console.error('Error verifying tables:', tablesError)
    }

    return NextResponse.json({
      message: 'Enhanced schema applied successfully',
      tables_found: tables?.map(t => t.table_name) || [],
      data
    })
  } catch (error: any) {
    console.error('Apply schema error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}