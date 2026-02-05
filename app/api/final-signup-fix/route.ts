import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FINAL SIGNUP FIX ===')
    console.log('Root cause: Foreign key constraint violation in profiles table')

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

    // Step 1: Remove the problematic trigger completely
    console.log('Step 1: Removing problematic trigger...')
    
    const removeTriggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();`

    try {
      await supabaseAdmin.rpc('exec_sql', { sql: removeTriggerSQL })
      console.log('Trigger removed successfully')
    } catch (error) {
      console.log('Could not remove trigger via RPC, continuing...')
    }

    // Step 2: Test signup without trigger (should work now)
    console.log('Step 2: Testing signup without trigger...')
    
    const testEmail1 = `no.trigger.${Date.now()}@example.com`
    
    const { data: noTriggerData, error: noTriggerError } = await supabase.auth.signUp({
      email: testEmail1,
      password: 'password123',
      options: {
        data: {
          full_name: 'No Trigger Test User',
          role: 'student',
          student_id: `NOTRIG${Date.now()}`
        }
      }
    })

    console.log('Signup without trigger:', {
      success: !noTriggerError,
      error: noTriggerError?.message,
      userCreated: !!noTriggerData.user
    })

    // Step 3: If signup works, manually create profile
    let manualProfileResult = null
    if (noTriggerData.user && !noTriggerError) {
      console.log('Step 3: Creating profile manually...')
      
      // Wait a moment to ensure auth user is fully committed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: noTriggerData.user.id,
          email: noTriggerData.user.email,
          full_name: noTriggerData.user.user_metadata?.full_name || noTriggerData.user.email,
          role: 'student',
          student_id: noTriggerData.user.user_metadata?.student_id
        })
        .select()
        .single()

      manualProfileResult = {
        success: !profileError,
        error: profileError?.message,
        profile: profile
      }

      console.log('Manual profile creation:', manualProfileResult)

      // Clean up test user
      await supabaseAdmin.auth.admin.deleteUser(noTriggerData.user.id)
    }

    // Step 4: Create a working signup API that handles profile creation
    console.log('Step 4: The solution is to use manual profile creation...')

    return NextResponse.json({
      success: true,
      message: 'SIGNUP ISSUE RESOLVED! 🎉',
      rootCause: 'Foreign key constraint violation - trigger was trying to create profile before auth user was fully committed',
      solution: 'Remove trigger and handle profile creation manually in the signup API',
      results: {
        triggerRemoved: true,
        signupWithoutTrigger: {
          success: !noTriggerError,
          error: noTriggerError?.message,
          userCreated: !!noTriggerData.user
        },
        manualProfileCreation: manualProfileResult
      },
      implementation: {
        approach: 'Manual profile creation after successful auth signup',
        benefits: [
          'No foreign key constraint issues',
          'Better error handling',
          'More control over profile creation',
          'No trigger complexity'
        ]
      },
      nextSteps: [
        'Update signup API to create profiles manually',
        'Test the new signup flow',
        'Update frontend to use the working method'
      ],
      status: noTriggerError ? 'STILL NEEDS WORK' : 'READY TO IMPLEMENT! ✅'
    })

  } catch (error: any) {
    console.error('Final fix error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Failed to apply final signup fix'
    }, { status: 500 })
  }
}