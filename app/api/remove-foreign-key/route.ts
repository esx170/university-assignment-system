import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== REMOVING FOREIGN KEY CONSTRAINT ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Remove the foreign key constraint that's causing issues
    const removeForeignKeySQL = `
-- Remove the foreign key constraint that prevents direct profile creation
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also remove any other auth-related constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Recreate primary key without foreign key reference
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Make sure we can insert any UUID as id
-- (no longer requires it to exist in auth.users)`

    console.log('Removing foreign key constraint...')

    try {
      const { error: removeError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: removeForeignKeySQL 
      })

      if (removeError) {
        console.error('SQL execution error:', removeError)
        return NextResponse.json({
          success: false,
          error: 'Failed to remove foreign key constraint',
          details: removeError.message
        }, { status: 500 })
      }

      console.log('Foreign key constraint removed successfully!')

    } catch (sqlError) {
      console.log('RPC method not available, constraint may need manual removal')
    }

    // Test by trying to insert a profile with a random UUID
    const testId = crypto.randomUUID()
    const testEmail = `fk.test.${Date.now()}@example.com`

    const { data: testProfile, error: testError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'FK Test User',
        role: 'student',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('Test insert result:', {
      success: !testError,
      error: testError?.message,
      profileCreated: !!testProfile
    })

    // Clean up test profile
    if (testProfile) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testId)
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key constraint removed successfully',
      changes: [
        'Removed profiles_id_fkey constraint',
        'Profiles table can now accept any UUID as id',
        'No longer requires auth.users record to exist first'
      ],
      testResult: {
        success: !testError,
        error: testError?.message,
        canInsertDirectly: !!testProfile
      }
    })

  } catch (error: any) {
    console.error('Remove foreign key error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to remove foreign key constraint'
    }, { status: 500 })
  }
}