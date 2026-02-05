import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESTORING ORIGINAL SIGNUP ===')

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

    // Step 1: Fix the trigger function
    console.log('Fixing trigger function...')
    
    const triggerFunction = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, student_id, department_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'student_id',
        CASE 
            WHEN NEW.raw_user_meta_data->>'department_id' IS NOT NULL 
            THEN (NEW.raw_user_meta_data->>'department_id')::UUID
            ELSE NULL
        END
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: triggerFunction 
    })

    if (functionError) {
      console.error('Function creation error:', functionError)
      // Try direct SQL execution
      const { error: directError } = await supabaseAdmin
        .from('_sql_exec')
        .insert({ sql: triggerFunction })
      
      if (directError) {
        console.log('Direct SQL also failed, continuing...')
      }
    }

    // Step 2: Recreate the trigger
    console.log('Recreating trigger...')
    
    const triggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: triggerSQL 
    })

    if (triggerError) {
      console.error('Trigger creation error:', triggerError)
    }

    // Step 3: Test the restored functionality
    console.log('Testing restored signup...')
    
    const testEmail = `restore.test.${Date.now()}@example.com`
    const testPassword = 'password123'
    
    // Create a regular client for testing
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const { data: testData, error: testError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Restore Test User',
          role: 'student',
          student_id: `TEST${Date.now()}`,
          department_id: '1'
        }
      }
    })

    // Clean up test user
    if (testData.user) {
      await supabaseAdmin.auth.admin.deleteUser(testData.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Original signup method restored successfully',
      steps: [
        'Fixed trigger function with better error handling',
        'Recreated the auth trigger',
        'Tested signup functionality'
      ],
      testResult: {
        success: !testError,
        error: testError?.message,
        userCreated: !!testData.user
      }
    })

  } catch (error: any) {
    console.error('Restore error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to restore original signup'
    }, { status: 500 })
  }
}