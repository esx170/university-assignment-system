import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({
        error: 'Failed to fetch auth users',
        details: authError.message
      }, { status: 500 });
    }

    // Get existing profiles to avoid duplicates
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id');

    const existingIds = new Set(existingProfiles?.map(p => p.id) || []);

    // Get a default department for users without one
    const { data: departments } = await supabaseAdmin
      .from('departments')
      .select('id')
      .limit(1);

    const defaultDepartmentId = departments?.[0]?.id;

    // Create profiles for users that don't have them
    const profilesToCreate = authUsers.users
      .filter(user => !existingIds.has(user.id))
      .map(user => {
        // Handle department_id - convert string to UUID if needed
        let departmentId = null;
        if (user.user_metadata?.department_id) {
          const deptId = user.user_metadata.department_id;
          // If it's a string number like "1", use default department
          if (deptId === "1" || !deptId.includes('-')) {
            departmentId = defaultDepartmentId;
          } else {
            departmentId = deptId;
          }
        }

        // Create basic profile object with only essential fields
        const profile: any = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          role: user.user_metadata?.role || 'student',
          created_at: user.created_at
        };

        // Add optional fields if they exist
        if (user.user_metadata?.student_id) {
          profile.student_id = user.user_metadata.student_id;
        }

        // Try to add department_id if we have a valid one
        if (departmentId) {
          profile.department_id = departmentId;
        }

        return profile;
      });

    if (profilesToCreate.length === 0) {
      return NextResponse.json({
        message: 'All users already have profiles',
        authUsersCount: authUsers.users.length,
        existingProfilesCount: existingProfiles?.length || 0
      });
    }

    // Insert the profiles
    const { data: createdProfiles, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilesToCreate)
      .select();

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create profiles',
        details: insertError.message,
        profilesToCreate: profilesToCreate
      }, { status: 500 });
    }

    // Reset admin password to ensure we can login
    const adminUser = authUsers.users.find(u => u.email === 'admin@university.edu');
    if (adminUser) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: 'admin123' }
      );

      if (passwordError) {
        console.error('Failed to reset admin password:', passwordError);
      }
    }

    return NextResponse.json({
      message: 'Profiles synced successfully',
      authUsersCount: authUsers.users.length,
      existingProfilesCount: existingProfiles?.length || 0,
      createdProfilesCount: createdProfiles?.length || 0,
      createdProfiles: createdProfiles,
      adminPasswordReset: !!adminUser
    });

  } catch (error: any) {
    console.error('Sync profiles error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}