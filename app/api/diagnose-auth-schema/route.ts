import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DIAGNOSING AUTH SCHEMA ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Step 1: Check if we can query the auth.users table directly
    console.log('Checking auth.users table access...')
    
    const { data: authUsers, error: authUsersError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email')
      .limit(1)

    console.log('Auth users access:', {
      success: !authUsersError,
      error: authUsersError?.message,
      note: 'Direct access to auth.users might not be allowed'
    })

    // Step 2: Check for any triggers on auth.users
    console.log('Checking for triggers on auth.users...')
    
    const checkTriggersSQL = `
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';`

    const { data: triggers, error: triggersError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: checkTriggersSQL 
    })

    console.log('Triggers check:', {
      success: !triggersError,
      error: triggersError?.message,
      triggers: triggers
    })

    // Step 3: Check profiles table constraints
    console.log('Checking profiles table constraints...')
    
    const checkConstraintsSQL = `
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public';`

    const { data: constraints, error: constraintsError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: checkConstraintsSQL 
    })

    console.log('Constraints check:', {
      success: !constraintsError,
      error: constraintsError?.message,
      constraints: constraints
    })

    // Step 4: Try to manually insert into profiles to test constraints
    console.log('Testing profiles table insert...')
    
    const testProfileId = '00000000-0000-0000-0000-000000000001'
    const testEmail = `profile.test.${Date.now()}@example.com`
    
    const { data: profileInsert, error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testProfileId,
        email: testEmail,
        full_name: 'Profile Test User',
        role: 'student'
      })
      .select()

    console.log('Profile insert test:', {
      success: !profileInsertError,
      error: profileInsertError?.message,
      inserted: !!profileInsert
    })

    // Clean up test profile
    if (profileInsert) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testProfileId)
    }

    // Step 5: Check if there are any custom auth hooks
    console.log('Checking for custom auth hooks...')
    
    const checkHooksSQL = `
SELECT 
    schemaname,
    tablename,
    attname,
    description
FROM pg_description d
JOIN pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
LIMIT 10;`

    const { data: hooks, error: hooksError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: checkHooksSQL 
    })

    console.log('Hooks check:', {
      success: !hooksError,
      error: hooksError?.message,
      hooks: hooks
    })

    return NextResponse.json({
      success: true,
      message: 'Auth schema diagnosis completed',
      findings: {
        authUsersAccess: {
          success: !authUsersError,
          error: authUsersError?.message
        },
        triggers: {
          success: !triggersError,
          error: triggersError?.message,
          data: triggers
        },
        constraints: {
          success: !constraintsError,
          error: constraintsError?.message,
          data: constraints
        },
        profilesInsert: {
          success: !profileInsertError,
          error: profileInsertError?.message
        },
        hooks: {
          success: !hooksError,
          error: hooksError?.message,
          data: hooks
        }
      },
      diagnosis: profileInsertError
        ? `Profiles table has constraint issues: ${profileInsertError.message}`
        : triggersError
        ? 'Cannot check triggers - might be the issue'
        : 'Schema appears intact - issue might be in Supabase auth service',
      solution: profileInsertError
        ? 'Fix profiles table constraints or foreign key references'
        : 'The issue appears to be at the Supabase auth service level, not database schema'
    })

  } catch (error: any) {
    console.error('Schema diagnosis error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to diagnose auth schema'
    }, { status: 500 })
  }
}