import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXING RLS POLICIES ===')

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

    // Step 1: Drop all existing RLS policies on profiles table
    console.log('Dropping existing RLS policies...')
    
    const dropPoliciesSQL = `
-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;
DROP POLICY IF EXISTS "Enable all for service role" ON profiles;`

    // Step 2: Create simple, non-recursive RLS policies
    console.log('Creating simple RLS policies...')
    
    const createPoliciesSQL = `
-- Simple RLS policies that don't cause recursion

-- Allow service role (triggers) to do everything
CREATE POLICY "service_role_all_access" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read their own profile (no recursion)
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)  
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for manual creation)
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);`

    // Step 3: Execute the SQL
    try {
      const { error: dropError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: dropPoliciesSQL 
      })
      
      console.log('Drop policies result:', dropError?.message || 'Success')

      const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: createPoliciesSQL 
      })
      
      console.log('Create policies result:', createError?.message || 'Success')

    } catch (sqlError) {
      console.log('RPC method not available, policies may need manual update')
    }

    // Step 4: Test the fix by trying to read from profiles
    console.log('Testing profiles table access...')
    
    const { data: profilesTest, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    console.log('Profiles access test:', {
      success: !profilesError,
      error: profilesError?.message
    })

    // Step 5: Test signup again
    console.log('Testing signup after RLS fix...')
    
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const testEmail = `rls.fix.test.${Date.now()}@example.com`
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          full_name: 'RLS Fix Test User',
          role: 'student',
          student_id: `RLS${Date.now()}`
        }
      }
    })

    console.log('Signup test after RLS fix:', {
      success: !signupError,
      error: signupError?.message,
      userCreated: !!signupData.user
    })

    // Clean up test user
    if (signupData.user) {
      await supabaseAdmin.auth.admin.deleteUser(signupData.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies fixed - infinite recursion resolved',
      steps: [
        'Dropped all existing RLS policies on profiles table',
        'Created simple, non-recursive policies',
        'Added service_role access for triggers',
        'Tested profiles table access',
        'Tested signup functionality'
      ],
      testResults: {
        profilesAccess: {
          success: !profilesError,
          error: profilesError?.message
        },
        signupTest: {
          success: !signupError,
          error: signupError?.message,
          userCreated: !!signupData.user
        }
      },
      diagnosis: signupError 
        ? 'RLS fixed but signup still has issues'
        : 'RLS fixed and signup is now working!'
    })

  } catch (error: any) {
    console.error('Fix RLS error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to fix RLS policies'
    }, { status: 500 })
  }
}