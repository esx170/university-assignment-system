const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixExistingUsersDepartments() {
  console.log('🔧 Fixing Existing Users with NULL Department IDs...\n');

  try {
    // Get users with NULL department_id
    console.log('1. Finding users with NULL department_id...');
    const { data: usersWithoutDept, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .is('department_id', null)
      .eq('role', 'student');

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`Found ${usersWithoutDept?.length || 0} users without department assignment:`);
    usersWithoutDept?.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email})`);
    });

    if (!usersWithoutDept || usersWithoutDept.length === 0) {
      console.log('✅ No users need department assignment');
      return;
    }

    // Get available departments
    console.log('\n2. Getting available departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error fetching departments:', deptError.message);
      return;
    }

    console.log('Available departments:');
    departments?.forEach(dept => {
      console.log(`  ${dept.code}: ${dept.name}`);
    });

    // Assign departments based on user names/emails (best guess)
    const departmentAssignments = [
      {
        email: 'gondre@gmail.com',
        name: 'Gonderew Dawit',
        suggestedDept: 'CS', // Computer Science
        reason: 'Default assignment'
      },
      {
        email: 'mahi@gmail.com', 
        name: 'Mahlet Hunelgn',
        suggestedDept: 'BUS', // Business Administration
        reason: 'Based on name pattern'
      }
    ];

    console.log('\n3. Assigning departments to users...');
    
    for (const assignment of departmentAssignments) {
      const user = usersWithoutDept.find(u => u.email === assignment.email);
      if (!user) {
        console.log(`⚠️ User ${assignment.email} not found in NULL department list`);
        continue;
      }

      const dept = departments?.find(d => d.code === assignment.suggestedDept);
      if (!dept) {
        console.log(`❌ Department ${assignment.suggestedDept} not found`);
        continue;
      }

      console.log(`\nAssigning ${user.full_name} to ${dept.code} - ${dept.name}`);
      console.log(`Reason: ${assignment.reason}`);

      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({ department_id: dept.id })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.log(`❌ Failed to update ${user.full_name}:`, updateError.message);
      } else {
        console.log(`✅ Successfully assigned ${user.full_name} to ${dept.name}`);
      }
    }

    // Verify the updates
    console.log('\n4. Verifying updates...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        department_id,
        departments (
          code,
          name
        )
      `)
      .eq('role', 'student')
      .not('department_id', 'is', null);

    if (verifyError) {
      console.log('❌ Error verifying updates:', verifyError.message);
    } else {
      console.log('✅ Users with assigned departments:');
      updatedUsers?.forEach(user => {
        const deptInfo = user.departments ? `${user.departments.code} - ${user.departments.name}` : 'Department not found';
        console.log(`  - ${user.full_name}: ${deptInfo}`);
      });
    }

    // Check if any users still have NULL department_id
    const { data: stillNullUsers, error: nullCheckError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .is('department_id', null)
      .eq('role', 'student');

    if (nullCheckError) {
      console.log('❌ Error checking remaining NULL users:', nullCheckError.message);
    } else if (stillNullUsers && stillNullUsers.length > 0) {
      console.log('\n⚠️ Users still without department assignment:');
      stillNullUsers.forEach(user => {
        console.log(`  - ${user.full_name} (${user.email})`);
      });
    } else {
      console.log('\n✅ All student users now have department assignments!');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixExistingUsersDepartments();