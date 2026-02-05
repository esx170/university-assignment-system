import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    // Check departments
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*');

    return NextResponse.json({
      authUsers: {
        count: authUsers?.users?.length || 0,
        users: authUsers?.users?.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          user_metadata: u.user_metadata
        })) || [],
        error: authError?.message
      },
      profiles: {
        count: profiles?.length || 0,
        profiles: profiles || [],
        error: profilesError?.message
      },
      departments: {
        count: departments?.length || 0,
        departments: departments || [],
        error: deptError?.message
      }
    });

  } catch (error: any) {
    console.error('Test users error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get a department ID for the test user
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('id')
      .limit(1);

    const departmentId = departments?.[0]?.id;

    // Create a test admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@university.edu',
      password: 'admin123',
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin',
        department_id: departmentId
      },
      email_confirm: true
    });

    if (createError) {
      return NextResponse.json({
        error: 'Failed to create user',
        details: createError.message
      }, { status: 500 });
    }

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user?.id)
      .single();

    return NextResponse.json({
      message: 'Test user created successfully',
      user: newUser.user,
      profile: profile,
      profileError: profileError?.message
    });

  } catch (error: any) {
    console.error('Create test user error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}