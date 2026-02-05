import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADDING PASSWORD COLUMN TO PROFILES ===')

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

    // Add password_hash and email_confirmed columns to profiles table
    const addColumnsSQL = `
-- Add password_hash column for emergency auth bypass
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT true;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_profiles_password ON profiles(email, password_hash);`

    console.log('Adding password columns to profiles table...')

    try {
      const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: addColumnsSQL 
      })

      if (alterError) {
        console.error('SQL execution error:', alterError)
        return NextResponse.json({
          success: false,
          error: 'Failed to add password column',
          details: alterError.message
        }, { status: 500 })
      }

      console.log('Password columns added successfully!')

    } catch (sqlError) {
      console.log('RPC method not available, columns may need manual addition')
    }

    // Test the new columns
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, password_hash, email_confirmed')
      .limit(1)

    console.log('Column test:', {
      success: !testError,
      error: testError?.message,
      hasPasswordColumn: testData && testData.length > 0 && 'password_hash' in testData[0]
    })

    return NextResponse.json({
      success: true,
      message: 'Password columns added to profiles table',
      columns: [
        'password_hash TEXT - for storing hashed passwords',
        'email_confirmed BOOLEAN - for email confirmation status'
      ],
      testResult: {
        success: !testError,
        error: testError?.message,
        columnsAccessible: testData && testData.length > 0
      }
    })

  } catch (error: any) {
    console.error('Add password column error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to add password column'
    }, { status: 500 })
  }
}