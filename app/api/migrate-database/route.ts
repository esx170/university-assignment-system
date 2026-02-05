import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log('Starting database migration...')

    // Step 1: Update profiles table to use primary_department_id instead of department_id
    console.log('Step 1: Updating profiles table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          -- Add new column if it doesn't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_department_id') THEN
              ALTER TABLE profiles ADD COLUMN primary_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
            END IF;
          END $$;
          
          -- Copy data from department_id to primary_department_id if department_id exists
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
              UPDATE profiles SET primary_department_id = department_id WHERE department_id IS NOT NULL;
            END IF;
          END $$;
        `
      })
      console.log('✓ Profiles table updated')
    } catch (error) {
      console.error('Error updating profiles table:', error)
    }

    // Step 2: Create instructor_department_assignments table
    console.log('Step 2: Creating instructor_department_assignments table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS instructor_department_assignments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            assigned_by UUID REFERENCES profiles(id),
            is_primary BOOLEAN DEFAULT false,
            UNIQUE(instructor_id, department_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_instructor_dept_assignments_instructor ON instructor_department_assignments(instructor_id);
          CREATE INDEX IF NOT EXISTS idx_instructor_dept_assignments_department ON instructor_department_assignments(department_id);
        `
      })
      console.log('✓ instructor_department_assignments table created')
    } catch (error) {
      console.error('Error creating instructor_department_assignments table:', error)
    }

    // Step 3: Create instructor_course_assignments table
    console.log('Step 3: Creating instructor_course_assignments table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS instructor_course_assignments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            assigned_by UUID REFERENCES profiles(id),
            is_primary BOOLEAN DEFAULT false,
            UNIQUE(instructor_id, course_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_instructor_course_assignments_instructor ON instructor_course_assignments(instructor_id);
          CREATE INDEX IF NOT EXISTS idx_instructor_course_assignments_course ON instructor_course_assignments(course_id);
        `
      })
      console.log('✓ instructor_course_assignments table created')
    } catch (error) {
      console.error('Error creating instructor_course_assignments table:', error)
    }

    // Step 4: Update courses table to use primary_instructor_id
    console.log('Step 4: Updating courses table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          -- Add new column if it doesn't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'primary_instructor_id') THEN
              ALTER TABLE courses ADD COLUMN primary_instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
            END IF;
          END $$;
          
          -- Copy data from instructor_id to primary_instructor_id if instructor_id exists
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'instructor_id') THEN
              UPDATE courses SET primary_instructor_id = instructor_id WHERE instructor_id IS NOT NULL;
            END IF;
          END $$;
        `
      })
      console.log('✓ Courses table updated')
    } catch (error) {
      console.error('Error updating courses table:', error)
    }

    // Step 5: Update course_enrollments table
    console.log('Step 5: Updating course_enrollments table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          -- Add missing columns to course_enrollments if they don't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'enrolled_by') THEN
              ALTER TABLE course_enrollments ADD COLUMN enrolled_by UUID REFERENCES profiles(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'status') THEN
              ALTER TABLE course_enrollments ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed'));
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_enrollments' AND column_name = 'final_grade') THEN
              ALTER TABLE course_enrollments ADD COLUMN final_grade VARCHAR(5);
            END IF;
          END $$;
        `
      })
      console.log('✓ Course enrollments table updated')
    } catch (error) {
      console.error('Error updating course_enrollments table:', error)
    }

    // Step 6: Update submissions table
    console.log('Step 6: Updating submissions table...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          -- Add missing columns to submissions if they don't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_size_bytes') THEN
              ALTER TABLE submissions ADD COLUMN file_size_bytes BIGINT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submission_text') THEN
              ALTER TABLE submissions ADD COLUMN submission_text TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'is_late') THEN
              ALTER TABLE submissions ADD COLUMN is_late BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'grade_percentage') THEN
              ALTER TABLE submissions ADD COLUMN grade_percentage DECIMAL(5,2) CHECK (grade_percentage >= 0 AND grade_percentage <= 100);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'status') THEN
              ALTER TABLE submissions ADD COLUMN status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned'));
            END IF;
          END $$;
        `
      })
      console.log('✓ Submissions table updated')
    } catch (error) {
      console.error('Error updating submissions table:', error)
    }

    // Step 7: Add sample departments if they don't exist
    console.log('Step 7: Adding sample departments...')
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          INSERT INTO departments (name, code, description) VALUES
          ('Development Economics', 'DECON', 'Department of Development Economics'),
          ('Software Engineering', 'SE', 'Department of Software Engineering')
          ON CONFLICT (name) DO NOTHING;
        `
      })
      console.log('✓ Sample departments added')
    } catch (error) {
      console.error('Error adding sample departments:', error)
    }

    console.log('Database migration completed!')

    // Verify tables exist
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

    return NextResponse.json({
      message: 'Database migration completed successfully',
      tables_found: tables?.map(t => t.table_name) || []
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}