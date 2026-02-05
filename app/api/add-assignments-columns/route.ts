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

    console.log('Adding missing columns to assignments table...')

    // Add instructor_id column
    console.log('1. Adding instructor_id column...')
    const { error: instructorIdError } = await supabaseAdmin
      .from('assignments')
      .select('instructor_id')
      .limit(1)

    if (instructorIdError && instructorIdError.message.includes('does not exist')) {
      // Column doesn't exist, we need to add it
      // Since we can't execute DDL directly, we'll return instructions
      return NextResponse.json({
        message: 'Missing columns detected',
        instructions: [
          'The assignments table is missing required columns:',
          '- instructor_id (UUID, references profiles.id)',
          '- status (VARCHAR(20), default "draft")',
          '',
          'Please run these SQL commands in your Supabase SQL editor:',
          '',
          'ALTER TABLE assignments ADD COLUMN instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;',
          'ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT \'draft\' CHECK (status IN (\'draft\', \'published\', \'closed\'));',
          '',
          'Or apply the enhanced schema from supabase/enhanced-schema.sql'
        ],
        sql_commands: [
          'ALTER TABLE assignments ADD COLUMN instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;',
          'ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT \'draft\' CHECK (status IN (\'draft\', \'published\', \'closed\'));'
        ]
      })
    }

    // Check status column
    const { error: statusError } = await supabaseAdmin
      .from('assignments')
      .select('status')
      .limit(1)

    if (statusError && statusError.message.includes('does not exist')) {
      return NextResponse.json({
        message: 'Status column missing',
        instructions: [
          'The assignments table is missing the status column.',
          'Please run this SQL command in your Supabase SQL editor:',
          '',
          'ALTER TABLE assignments ADD COLUMN status VARCHAR(20) DEFAULT \'draft\' CHECK (status IN (\'draft\', \'published\', \'closed\'));'
        ]
      })
    }

    // Both columns exist
    return NextResponse.json({
      message: 'All required columns are present',
      status: 'ready'
    })

  } catch (error: any) {
    console.error('Check columns error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}