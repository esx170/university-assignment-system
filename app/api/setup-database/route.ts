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

    console.log('Creating departments table...')

    // Create departments table
    const { error: deptError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create departments table if it doesn't exist
        CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL UNIQUE,
            code VARCHAR(10) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Insert sample departments if they don't exist
        INSERT INTO departments (name, code, description) VALUES
        ('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
        ('Mathematics', 'MATH', 'Department of Mathematics'),
        ('Physics', 'PHYS', 'Department of Physics'),
        ('Business Administration', 'BUS', 'School of Business Administration')
        ON CONFLICT (code) DO NOTHING;

        -- Add department_id column to profiles if it doesn't exist
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
      `
    })

    if (deptError) {
      console.error('SQL execution error:', deptError)
      
      // Try alternative approach - direct table creation
      const { error: createError } = await supabaseAdmin
        .from('departments')
        .select('id')
        .limit(1)

      if (createError && createError.message.includes('does not exist')) {
        return NextResponse.json({
          error: 'Database schema needs to be applied manually',
          instructions: [
            '1. Go to Supabase Dashboard → SQL Editor',
            '2. Copy the contents of supabase/schema.sql',
            '3. Run the SQL commands to create the tables',
            '4. Come back and try again'
          ],
          sqlError: deptError?.message
        }, { status: 400 })
      }
    }

    // Verify departments were created
    const { data: departments, error: verifyError } = await supabaseAdmin
      .from('departments')
      .select('*')

    if (verifyError) {
      return NextResponse.json({
        error: 'Failed to verify departments table',
        details: verifyError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      departments: departments,
      departmentCount: departments?.length || 0
    })

  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}