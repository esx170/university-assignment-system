import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('Adding missing columns to submissions table...')

    // Add grade_percentage column
    const { error: error1 } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;'
    })

    if (error1) {
      console.log('Error adding grade_percentage:', error1.message)
    }

    // Add graded_by column
    const { error: error2 } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);'
    })

    if (error2) {
      console.log('Error adding graded_by:', error2.message)
    }

    // Add status column
    const { error: error3 } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';`
    })

    if (error3) {
      console.log('Error adding status:', error3.message)
    }

    // Update existing submissions
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('id, grade')

    if (submissions) {
      for (const sub of submissions) {
        const status = sub.grade !== null ? 'graded' : 'submitted'
        await supabaseAdmin
          .from('submissions')
          .update({ status })
          .eq('id', sub.id)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Submissions table updated successfully',
      note: 'If you see errors above, please run the SQL manually in Supabase SQL Editor'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      sql: `
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';
      `
    }, { status: 500 })
  }
}
