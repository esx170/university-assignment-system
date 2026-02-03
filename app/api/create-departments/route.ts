import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try to create a simple departments table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.departments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL UNIQUE,
          code VARCHAR(10) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const insertDataSQL = `
      INSERT INTO public.departments (name, code, description) VALUES
      ('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
      ('Mathematics', 'MATH', 'Department of Mathematics'),
      ('Physics', 'PHYS', 'Department of Physics'),
      ('Business Administration', 'BUS', 'School of Business Administration')
      ON CONFLICT (code) DO NOTHING;
    `

    // Execute SQL using the REST API approach
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTableSQL })
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      console.error('Create table error:', error)
    }

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: insertDataSQL })
    })

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      console.error('Insert data error:', error)
    }

    // Try to verify the table exists now
    const { data: departments, error: verifyError } = await supabaseAdmin
      .from('departments')
      .select('*')

    if (verifyError) {
      return NextResponse.json({
        error: 'Departments table still not accessible',
        details: verifyError.message,
        solution: 'Please apply the database schema manually in Supabase Dashboard'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Departments table created successfully',
      departments: departments,
      count: departments?.length || 0
    })

  } catch (error: any) {
    console.error('Create departments error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      solution: 'Please apply the database schema manually in Supabase Dashboard'
    }, { status: 500 })
  }
}