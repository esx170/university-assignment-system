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

    // Create profiles with only the basic required columns
    const results = [];
    
    for (const user of authUsers.users) {
      if (existingIds.has(user.id)) {
        results.push({ id: user.id, status: 'already_exists' });
        continue;
      }

      try {
        // Try to insert with minimal required fields
        const { data: profile, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
            role: user.user_metadata?.role || 'student'
          })
          .select()
          .single();

        if (insertError) {
          results.push({ 
            id: user.id, 
            status: 'error', 
            error: insertError.message,
            email: user.email 
          });
        } else {
          results.push({ 
            id: user.id, 
            status: 'created',
            email: user.email,
            role: user.user_metadata?.role || 'student'
          });
        }
      } catch (error: any) {
        results.push({ 
          id: user.id, 
          status: 'exception', 
          error: error.message,
          email: user.email 
        });
      }
    }

    // Reset admin password
    const adminUser = authUsers.users.find(u => u.email === 'admin@university.edu');
    let adminPasswordReset = false;
    
    if (adminUser) {
      try {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          adminUser.id,
          { password: 'admin123' }
        );
        adminPasswordReset = !passwordError;
      } catch (error) {
        console.error('Failed to reset admin password:', error);
      }
    }

    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error' || r.status === 'exception').length;
    const existingCount = results.filter(r => r.status === 'already_exists').length;

    return NextResponse.json({
      message: 'Profile sync completed',
      summary: {
        total: authUsers.users.length,
        created: successCount,
        errors: errorCount,
        existing: existingCount,
        adminPasswordReset
      },
      details: results
    });

  } catch (error: any) {
    console.error('Simple sync error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}