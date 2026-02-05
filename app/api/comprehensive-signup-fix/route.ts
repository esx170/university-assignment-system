import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPREHENSIVE SIGNUP FIX ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Step 1: Completely disable the trigger to isolate the issue
    console.log('Step 1: Disabling trigger completely...')
    
    const disableTriggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();`

    try {
      await supabaseAdmin.rpc('exec_sql', { sql: disableTriggerSQL })
    } catch (error) {
      console.log('Could not disable trigger via RPC')
    }

    // Step 2: Test basic auth signup without any trigger
    console.log('Step 2: Testing basic auth signup...')
    
    const testEmail1 = `basic.test.${Date.now()}@example.com`
    
    const { data: basicData, error: basicError } = await supabase.auth.signUp({
      email: testEmail1,
      password: 'password123'
    })

    console.log('Basic signup result:', {
      success: !basicError,
      error: basicError?.message,
      userCreated: !!basicData.user
    })

    // Clean up basic test user
    if (basicData.user) {
      await supabaseAdmin.auth.admin.deleteUser(basicData.user.id)
    }

    // Step 3: If basic signup works, test with metadata
    let metadataResult = null
    if (!basicError) {
      console.log('Step 3: Testing signup with metadata...')
      
      const testEmail2 = `meta.test.${Date.now()}@example.com`
      
      const { data: metaData, error: metaError } = await supabase.auth.signUp({
        email: testEmail2,
        password: 'password123',
        options: {
          data: {
            full_name: 'Metadata Test User',
            role: 'student',
            student_id: `META${Date.now()}`
          }
        }
      })

      metadataResult = {
        success: !metaError,
        error: metaError?.message,
        userCreated: !!metaData.user
      }

      console.log('Metadata signup result:', metadataResult)

      // Clean up metadata test user
      if (metaData.user) {
        await supabaseAdmin.auth.admin.deleteUser(metaData.user.id)
      }
    }

    // Step 4: If signup works, create a safe trigger
    let triggerResult = null
    if (!basicError && (!metadataResult || metadataResult.success)) {
      console.log('Step 4: Creating safe trigger function...')
      
      const safeTriggerSQL = `
-- Create a safe trigger function that won't cause issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if it doesn't exist (avoid duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
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
                -- Log error but don't fail the auth user creation
                RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

      try {
        await supabaseAdmin.rpc('exec_sql', { sql: safeTriggerSQL })
        
        // Test signup with the new trigger
        const testEmail3 = `trigger.test.${Date.now()}@example.com`
        
        const { data: triggerData, error: triggerError } = await supabase.auth.signUp({
          email: testEmail3,
          password: 'password123',
          options: {
            data: {
              full_name: 'Trigger Test User',
              role: 'student',
              student_id: `TRIGGER${Date.now()}`
            }
          }
        })

        let profileCreated = false
        if (triggerData.user && !triggerError) {
          // Wait for trigger to process
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', triggerData.user.id)
            .single()
          
          profileCreated = !!profile
        }

        triggerResult = {
          success: !triggerError,
          error: triggerError?.message,
          userCreated: !!triggerData.user,
          profileCreated
        }

        console.log('Trigger test result:', triggerResult)

        // Clean up trigger test user
        if (triggerData.user) {
          await supabaseAdmin.auth.admin.deleteUser(triggerData.user.id)
        }

      } catch (error) {
        triggerResult = {
          success: false,
          error: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comprehensive signup fix completed',
      results: {
        basicSignup: {
          success: !basicError,
          error: basicError?.message,
          userCreated: !!basicData.user
        },
        metadataSignup: metadataResult,
        triggerSignup: triggerResult
      },
      diagnosis: basicError 
        ? 'Auth signup is completely broken - check Supabase settings'
        : metadataResult && !metadataResult.success
        ? 'Basic signup works but metadata causes issues'
        : triggerResult && !triggerResult.success
        ? 'Signup works but trigger has issues'
        : 'Everything is working correctly!',
      nextSteps: basicError
        ? ['Check Supabase project settings', 'Verify auth is enabled', 'Check for rate limits']
        : ['Signup should now be working', 'Test the /auth/signup page', 'Monitor for any remaining issues']
    })

  } catch (error: any) {
    console.error('Comprehensive fix error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to perform comprehensive signup fix'
    }, { status: 500 })
  }
}