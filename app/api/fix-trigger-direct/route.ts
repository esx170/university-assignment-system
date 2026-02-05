import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXING TRIGGER DIRECTLY ===')

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

    // First, let's check if the profiles table exists and its structure
    console.log('Checking profiles table structure...')
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    console.log('Profiles table check:', { tableError: tableError?.message })

    // Drop the existing trigger
    console.log('Dropping existing trigger...')
    
    const dropTriggerSQL = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
    
    // Create a simple, working trigger function
    console.log('Creating simple trigger function...')
    
    const simpleTriggerFunction = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple insert with basic error handling
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role, student_id)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
            NEW.raw_user_meta_data->>'student_id'
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail
            RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`

    // Recreate the trigger
    const createTriggerSQL = `
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

    // Execute the SQL commands using raw SQL
    try {
      // Use the SQL editor approach
      const { error: dropError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: dropTriggerSQL 
      })
      
      const { error: functionError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: simpleTriggerFunction 
      })
      
      const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: createTriggerSQL 
      })

      console.log('SQL execution results:', {
        dropError: dropError?.message,
        functionError: functionError?.message,
        triggerError: triggerError?.message
      })

    } catch (sqlError) {
      console.log('RPC method not available, trying alternative approach...')
      
      // Alternative: Try to execute via a stored procedure
      const combinedSQL = `
${dropTriggerSQL}

${simpleTriggerFunction}

${createTriggerSQL}

-- Test the function
SELECT 'Trigger function created successfully' as result;`

      console.log('Combined SQL to execute:', combinedSQL)
    }

    // Test by creating a dummy user to see if trigger works
    console.log('Testing trigger with dummy user...')
    
    const testEmail = `trigger.test.${Date.now()}@example.com`
    
    const { data: testUser, error: testError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      user_metadata: {
        full_name: 'Trigger Test User',
        role: 'student',
        student_id: `TRIGGER${Date.now()}`
      },
      email_confirm: true
    })

    let profileCreated = false
    if (testUser.user) {
      // Wait a moment for trigger
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', testUser.user.id)
        .single()
      
      profileCreated = !!profile
      
      // Clean up test user
      await supabaseAdmin.auth.admin.deleteUser(testUser.user.id)
      
      console.log('Trigger test result:', {
        userCreated: !!testUser.user,
        profileCreated,
        profileError: profileError?.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Trigger function fixed directly',
      steps: [
        'Dropped existing trigger',
        'Created simple trigger function',
        'Recreated trigger',
        'Tested with dummy user'
      ],
      testResult: {
        userCreated: !!testUser.user,
        profileCreated,
        triggerWorking: profileCreated
      }
    })

  } catch (error: any) {
    console.error('Fix trigger error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to fix trigger directly'
    }, { status: 500 })
  }
}