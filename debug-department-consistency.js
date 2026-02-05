const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugDepartmentConsistency() {
  console.log('🔍 Debugging Department Consistency Issue...\n');

  try {
    // Check profiles table structure
    console.log('1. Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .limit(3);

    if (profilesError) {
      console.log('❌ Error accessing profiles:', profilesError.message);
      return;
    }

    console.log(`Found ${profiles?.length || 0} student profiles:`);
    profiles?.forEach((profile, index) => {
      console.log(`\n  Student ${index + 1}: ${profile.full_name} (${profile.email})`);
      console.log(`    Role: ${profile.role}`);
      console.log(`    Department ID: ${profile.department_id || 'NULL'}`);
      console.log(`    Student ID: ${profile.student_id || 'NULL'}`);
      
      // Check all columns
      Object.keys(profile).forEach(key => {
        if (key.includes('department') || key.includes('dept')) {
          console.log(`    ${key}: ${profile[key]}`);
        }
      });
    });

    // Check departments table
    console.log('\n2. Checking departments table...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error accessing departments:', deptError.message);
    } else {
      console.log(`Found ${departments?.length || 0} departments:`);
      departments?.forEach(dept => {
        console.log(`  ${dept.id}: ${dept.code} - ${dept.name}`);
      });
    }

    // Check if department_id references are valid
    console.log('\n3. Checking department references...');
    if (profiles && departments) {
      profiles.forEach(profile => {
        if (profile.department_id) {
          const dept = departments.find(d => d.id === profile.department_id);
          if (dept) {
            console.log(`  ✅ ${profile.full_name} → ${dept.code} (${dept.name})`);
          } else {
            console.log(`  ❌ ${profile.full_name} → Invalid department_id: ${profile.department_id}`);
          }
        } else {
          console.log(`  ⚠️ ${profile.full_name} → No department_id set`);
        }
      });
    }

    // Check student department page logic
    console.log('\n4. Testing student department display...');
    
    // Simulate what the student department page does
    if (profiles && profiles.length > 0) {
      const testStudent = profiles[0];
      console.log(`\nTesting with student: ${testStudent.full_name}`);
      
      if (testStudent.department_id) {
        const { data: studentDept, error: studentDeptError } = await supabase
          .from('departments')
          .select('*')
          .eq('id', testStudent.department_id)
          .single();

        if (studentDeptError) {
          console.log(`❌ Error fetching department: ${studentDeptError.message}`);
        } else {
          console.log(`✅ Student's department: ${studentDept.code} - ${studentDept.name}`);
        }
      } else {
        console.log('❌ Student has no department_id - this is the problem!');
      }
    }

    // Check signup process
    console.log('\n5. Checking recent signups...');
    const { data: recentProfiles, error: recentError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log('❌ Error checking recent profiles:', recentError.message);
    } else {
      console.log('Recent profiles:');
      recentProfiles?.forEach(profile => {
        console.log(`  ${profile.full_name}: dept_id=${profile.department_id || 'NULL'}, created=${profile.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugDepartmentConsistency();