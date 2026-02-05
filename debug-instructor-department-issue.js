const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugInstructorDepartmentIssue() {
  console.log('🔍 Debugging Instructor Department Issue...\n');

  try {
    // Get all instructors
    console.log('1. Finding all instructors...');
    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'instructor')
      .order('created_at', { ascending: false });

    if (instructorsError) {
      console.log('❌ Error fetching instructors:', instructorsError.message);
      return;
    }

    console.log(`Found ${instructors?.length || 0} instructors:`);
    instructors?.forEach((instructor, index) => {
      console.log(`\n  Instructor ${index + 1}: ${instructor.full_name}`);
      console.log(`    Email: ${instructor.email}`);
      console.log(`    Department ID: ${instructor.department_id || 'NULL'}`);
      console.log(`    Created: ${instructor.created_at}`);
    });

    // Get departments for reference
    console.log('\n2. Getting departments for reference...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error fetching departments:', deptError.message);
    } else {
      console.log('Available departments:');
      departments?.forEach(dept => {
        console.log(`  ${dept.id}: ${dept.code} - ${dept.name}`);
      });
    }

    // Check instructor-department mappings
    console.log('\n3. Checking instructor department assignments...');
    if (instructors && departments) {
      instructors.forEach(instructor => {
        if (instructor.department_id) {
          const dept = departments.find(d => d.id === instructor.department_id);
          if (dept) {
            console.log(`  ✅ ${instructor.full_name} → ${dept.code} (${dept.name})`);
          } else {
            console.log(`  ❌ ${instructor.full_name} → Invalid department_id: ${instructor.department_id}`);
          }
        } else {
          console.log(`  ⚠️ ${instructor.full_name} → No department_id assigned`);
        }
      });
    }

    // Test instructor department API for each instructor
    console.log('\n4. Testing instructor department API...');
    if (instructors && instructors.length > 0) {
      for (const instructor of instructors) {
        console.log(`\nTesting ${instructor.full_name}...`);
        
        // Create session token
        const token = Buffer.from(`${instructor.id}:${Date.now()}`).toString('base64');
        
        try {
          const response = await fetch('http://localhost:3000/api/instructor/departments', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`  ✅ API Response: ${data.instructor.department.code} - ${data.instructor.department.name}`);
            
            // Check if it matches database
            if (instructor.department_id) {
              const actualDept = departments?.find(d => d.id === instructor.department_id);
              if (actualDept && data.instructor.department.code === actualDept.code) {
                console.log(`  ✅ Matches database department`);
              } else {
                console.log(`  ❌ MISMATCH! Database: ${actualDept?.code || 'NULL'}, API: ${data.instructor.department.code}`);
              }
            }
          } else {
            console.log(`  ❌ API call failed: ${response.statusText}`);
          }
        } catch (error) {
          console.log(`  ❌ API call error: ${error.message}`);
        }
      }
    }

    // Check students in Development Economics department
    console.log('\n5. Checking students in Development Economics department...');
    const deconDept = departments?.find(d => d.code === 'DECON');
    if (deconDept) {
      console.log(`Development Economics department ID: ${deconDept.id}`);
      
      const { data: deconStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('department_id', deconDept.id);

      if (studentsError) {
        console.log('❌ Error fetching DECON students:', studentsError.message);
      } else {
        console.log(`Found ${deconStudents?.length || 0} students in Development Economics:`);
        deconStudents?.forEach(student => {
          console.log(`  - ${student.full_name} (${student.email})`);
        });
      }
    } else {
      console.log('❌ Development Economics department not found');
    }

    // Check instructor students API
    console.log('\n6. Testing instructor students API...');
    const deconInstructor = instructors?.find(i => {
      const dept = departments?.find(d => d.id === i.department_id);
      return dept?.code === 'DECON';
    });

    if (deconInstructor) {
      console.log(`Testing students API for DECON instructor: ${deconInstructor.full_name}`);
      
      const token = Buffer.from(`${deconInstructor.id}:${Date.now()}`).toString('base64');
      
      try {
        const response = await fetch('http://localhost:3000/api/instructor/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Students API returned ${data.students?.length || 0} students`);
          data.students?.forEach(student => {
            console.log(`    - ${student.name} (${student.department})`);
          });
        } else {
          console.log(`  ❌ Students API failed: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`  ❌ Students API error: ${error.message}`);
      }
    } else {
      console.log('❌ No DECON instructor found to test students API');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugInstructorDepartmentIssue();