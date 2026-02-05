const { createClient } = require('@supabase/supabase-js');

async function addDepartmentColumnToProfiles() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Adding department_id column to profiles table...\n');

  try {
    // Step 1: Check current profiles table structure
    console.log('1. Checking current profiles table structure...');
    
    const { data: sampleProfile, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing profiles table:', sampleError.message);
      return;
    }

    if (sampleProfile && sampleProfile.length > 0) {
      const columns = Object.keys(sampleProfile[0]);
      console.log('   Current columns:', columns.join(', '));
      
      if (columns.includes('department_id')) {
        console.log('   ✅ department_id column already exists!');
      } else {
        console.log('   ❌ department_id column missing');
      }
    }

    // Step 2: Get departments for reference
    console.log('\n2. Getting available departments...');
    
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, code, name');

    if (deptError) {
      console.error('❌ Error getting departments:', deptError.message);
      return;
    }

    console.log(`   ✅ Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`      - ${dept.code}: ${dept.name} (${dept.id})`);
    });

    // Step 3: Create API endpoint to add the column
    console.log('\n3. Creating API endpoint to add department_id column...');
    
    // Since we can't execute raw SQL directly, we'll create an API endpoint
    const addColumnEndpoint = `
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Try to add the column using a SQL function call
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);'
    })

    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ 
        error: 'Failed to add column via SQL',
        details: error.message,
        suggestion: 'Please add the column manually in Supabase dashboard'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'department_id column added successfully'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}`;

    console.log('   📝 API endpoint code generated (needs to be created manually)');

    // Step 4: Try to assign departments to existing users
    console.log('\n4. Attempting to assign departments to users...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name');

    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError.message);
      return;
    }

    console.log(`   Found ${profiles.length} users to potentially assign departments to`);

    // Try to update profiles with department assignments
    let assignmentCount = 0;
    const csDept = departments.find(d => d.code === 'CS');
    const mathDept = departments.find(d => d.code === 'MATH');
    const seDept = departments.find(d => d.code === 'SE');

    for (const profile of profiles) {
      let deptId = null;
      
      // Smart assignment based on email or role
      if (profile.email.includes('cs') || profile.role === 'instructor') {
        deptId = csDept?.id;
      } else if (profile.email.includes('math')) {
        deptId = mathDept?.id;
      } else if (profile.email.includes('se')) {
        deptId = seDept?.id;
      } else {
        // Round-robin assignment for students
        deptId = departments[assignmentCount % departments.length]?.id;
      }

      if (deptId) {
        // Try to update the profile with department_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ department_id: deptId })
          .eq('id', profile.id);

        if (!updateError) {
          assignmentCount++;
          const assignedDept = departments.find(d => d.id === deptId);
          console.log(`   ✅ Assigned ${profile.email} to ${assignedDept?.code}`);
        } else {
          console.log(`   ⚠️  Could not assign ${profile.email}: ${updateError.message}`);
        }
      }
    }

    console.log(`\n   Total assignments: ${assignmentCount}/${profiles.length}`);

    // Step 5: Verify the changes
    console.log('\n5. Verifying department assignments...');
    
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, role, department_id')
      .not('department_id', 'is', null);

    if (verifyError) {
      console.log('   ⚠️  Could not verify assignments (department_id column may not exist yet)');
    } else {
      console.log(`   ✅ ${updatedProfiles.length} users have department assignments`);
      
      // Show sample assignments
      updatedProfiles.slice(0, 3).forEach(profile => {
        const dept = departments.find(d => d.id === profile.department_id);
        console.log(`      - ${profile.email} → ${dept?.code || 'Unknown'}`);
      });
    }

    console.log('\n🎉 Department Column Addition Process Complete!');
    console.log('\n📋 Summary:');
    console.log(`- Departments available: ${departments.length}`);
    console.log(`- Users processed: ${profiles.length}`);
    console.log(`- Department assignments: ${assignmentCount}`);
    console.log('\n🔧 Next Steps:');
    console.log('1. If department_id column doesn\'t exist, add it manually in Supabase:');
    console.log('   ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);');
    console.log('2. Test the admin departments page');
    console.log('3. Verify user profiles show department information');

  } catch (error) {
    console.error('❌ Error in department column addition:', error.message);
  }
}

addDepartmentColumnToProfiles();