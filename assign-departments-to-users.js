const { createClient } = require('@supabase/supabase-js');

async function assignDepartmentsToUsers() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Assigning Departments to Users...\n');

  try {
    // Step 1: Check if department_id column exists
    console.log('1. Testing department_id column...');
    
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('department_id')
      .limit(1);

    if (testError) {
      console.log('❌ department_id column does not exist yet');
      console.log('   Please add it manually in Supabase SQL Editor:');
      console.log('   ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);');
      return;
    }

    console.log('✅ department_id column exists');

    // Step 2: Get departments and users
    console.log('\n2. Getting departments and users...');
    
    const { data: departments } = await supabase
      .from('departments')
      .select('id, code, name');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, full_name');

    console.log(`   Found ${departments?.length || 0} departments`);
    console.log(`   Found ${profiles?.length || 0} users`);

    if (!departments || !profiles) {
      console.log('❌ Could not get departments or profiles');
      return;
    }

    // Step 3: Assign departments
    console.log('\n3. Assigning departments to users...');
    
    const csDept = departments.find(d => d.code === 'CS');
    const mathDept = departments.find(d => d.code === 'MATH');
    const seDept = departments.find(d => d.code === 'SE');
    const busDept = departments.find(d => d.code === 'BUS');

    let assignmentCount = 0;
    const assignments = [];

    for (const profile of profiles) {
      let deptId = null;
      let deptName = '';
      
      // Smart assignment based on email and role
      if (profile.email.includes('cs') || profile.email.includes('computer')) {
        deptId = csDept?.id;
        deptName = 'CS';
      } else if (profile.email.includes('math')) {
        deptId = mathDept?.id;
        deptName = 'MATH';
      } else if (profile.email.includes('se') || profile.email.includes('software')) {
        deptId = seDept?.id;
        deptName = 'SE';
      } else if (profile.email.includes('business') || profile.email.includes('bus')) {
        deptId = busDept?.id;
        deptName = 'BUS';
      } else if (profile.role === 'instructor') {
        // Assign instructors to CS by default
        deptId = csDept?.id;
        deptName = 'CS';
      } else {
        // Round-robin assignment for students
        const dept = departments[assignmentCount % departments.length];
        deptId = dept?.id;
        deptName = dept?.code;
      }

      if (deptId) {
        const { error: assignError } = await supabase
          .from('profiles')
          .update({ department_id: deptId })
          .eq('id', profile.id);

        if (!assignError) {
          assignmentCount++;
          assignments.push({
            email: profile.email,
            name: profile.full_name,
            role: profile.role,
            department: deptName
          });
          console.log(`   ✅ ${profile.email} → ${deptName}`);
        } else {
          console.log(`   ❌ Failed to assign ${profile.email}: ${assignError.message}`);
        }
      }
    }

    console.log(`\n✅ Successfully assigned ${assignmentCount}/${profiles.length} users to departments`);

    // Step 4: Verify assignments
    console.log('\n4. Verifying assignments...');
    
    const { data: verifyData } = await supabase
      .from('profiles')
      .select(`
        id, email, role, full_name,
        departments:department_id (
          id, code, name
        )
      `)
      .not('department_id', 'is', null);

    if (verifyData && verifyData.length > 0) {
      console.log(`✅ ${verifyData.length} users have department assignments`);
      
      // Group by department
      const byDepartment = {};
      verifyData.forEach(user => {
        const deptCode = user.departments?.code || 'Unknown';
        if (!byDepartment[deptCode]) byDepartment[deptCode] = [];
        byDepartment[deptCode].push(user);
      });

      console.log('\n📊 Assignment Summary:');
      Object.keys(byDepartment).forEach(deptCode => {
        const users = byDepartment[deptCode];
        console.log(`   ${deptCode}: ${users.length} users`);
        users.slice(0, 2).forEach(user => {
          console.log(`     - ${user.email} (${user.role})`);
        });
        if (users.length > 2) {
          console.log(`     ... and ${users.length - 2} more`);
        }
      });
    }

    console.log('\n🎉 Department Assignment Complete!');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/departments - should work without errors');
    console.log('2. Visit /admin/users and click View on any user');
    console.log('3. User profiles should now show department information');
    console.log('4. The admin user management is fully functional');

  } catch (error) {
    console.error('❌ Error assigning departments:', error.message);
  }
}

assignDepartmentsToUsers();