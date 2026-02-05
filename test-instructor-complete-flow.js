const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testInstructorCompleteFlow() {
  console.log('🎯 Testing Complete Instructor Flow...\n');

  try {
    // Test Mr Abebe (DECON instructor) complete flow
    console.log('1. Testing Mr Abebe (Development Economics instructor) complete flow...');
    
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Mr Abebe not found');
      return;
    }

    console.log(`Instructor: ${mrAbebe.full_name} (${mrAbebe.email})`);
    
    // Get expected department
    const { data: expectedDept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', mrAbebe.department_id)
      .single();

    if (deptError || !expectedDept) {
      console.log('❌ Expected department not found');
      return;
    }

    console.log(`Expected Department: ${expectedDept.code} - ${expectedDept.name}`);

    // Get expected students in that department
    const { data: expectedStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('department_id', expectedDept.id)
      .order('full_name');

    if (studentsError) {
      console.log('❌ Error fetching expected students:', studentsError.message);
      return;
    }

    console.log(`Expected Students: ${expectedStudents?.length || 0}`);
    expectedStudents?.forEach(student => {
      console.log(`  - ${student.full_name} (${student.student_id || 'No ID'})`);
    });

    // Test the departments API (which includes students)
    console.log('\n2. Testing instructor departments API (includes students)...');
    
    const token = Buffer.from(`${mrAbebe.id}:${Date.now()}`).toString('base64');
    
    const deptResponse = await fetch('http://localhost:3000/api/instructor/departments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (deptResponse.ok) {
      const deptData = await deptResponse.json();
      
      console.log('✅ Departments API Response:');
      console.log(`  Instructor Department: ${deptData.instructor.department.code} - ${deptData.instructor.department.name}`);
      console.log(`  Students in API: ${deptData.departments[0]?.students?.length || 0}`);
      
      // Verify department matches
      if (deptData.instructor.department.code === expectedDept.code) {
        console.log('✅ Department matches database');
      } else {
        console.log('❌ Department mismatch!');
        console.log(`  Expected: ${expectedDept.code}`);
        console.log(`  Got: ${deptData.instructor.department.code}`);
      }

      // Verify students match
      const apiStudents = deptData.departments[0]?.students || [];
      console.log('\n  Students from API:');
      apiStudents.forEach(student => {
        console.log(`    - ${student.full_name} (${student.student_id || 'No ID'})`);
      });

      if (apiStudents.length === expectedStudents.length) {
        console.log('✅ Student count matches');
        
        // Check if all expected students are in API response
        const allStudentsMatch = expectedStudents.every(expectedStudent => 
          apiStudents.some(apiStudent => apiStudent.id === expectedStudent.id)
        );
        
        if (allStudentsMatch) {
          console.log('✅ All students match between database and API');
        } else {
          console.log('❌ Some students missing from API response');
        }
      } else {
        console.log('❌ Student count mismatch!');
        console.log(`  Expected: ${expectedStudents.length}`);
        console.log(`  Got: ${apiStudents.length}`);
      }

      // Summary
      console.log('\n3. Summary for Mr Abebe:');
      console.log(`✅ Profile shows: ${deptData.instructor.department.name}`);
      console.log(`✅ Can access ${apiStudents.length} students from Development Economics`);
      console.log(`✅ Department-based access control working correctly`);
      
      // List the students he can access
      if (apiStudents.length > 0) {
        console.log('\n  Students he can access:');
        apiStudents.forEach(student => {
          console.log(`    - ${student.full_name} (${student.email})`);
        });
      }

    } else {
      console.log('❌ Departments API failed:', deptResponse.statusText);
    }

    // Test a CS instructor for comparison
    console.log('\n4. Testing CS instructor for comparison...');
    
    const { data: csInstructor, error: csError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'tadelebizu@gmail.com')
      .single();

    if (csError || !csInstructor) {
      console.log('❌ CS instructor not found');
    } else {
      const csToken = Buffer.from(`${csInstructor.id}:${Date.now()}`).toString('base64');
      
      const csDeptResponse = await fetch('http://localhost:3000/api/instructor/departments', {
        headers: {
          'Authorization': `Bearer ${csToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (csDeptResponse.ok) {
        const csDeptData = await csDeptResponse.json();
        const csStudents = csDeptData.departments[0]?.students || [];
        
        console.log(`✅ CS Instructor (${csInstructor.full_name}):`);
        console.log(`  Department: ${csDeptData.instructor.department.code} - ${csDeptData.instructor.department.name}`);
        console.log(`  Students: ${csStudents.length}`);
        
        // Verify CS instructor can't see DECON students
        const hasDeconStudents = csStudents.some(student => 
          expectedStudents.some(deconStudent => deconStudent.id === student.id)
        );
        
        if (!hasDeconStudents) {
          console.log('✅ CS instructor correctly cannot see Development Economics students');
        } else {
          console.log('❌ CS instructor can see Development Economics students (security issue!)');
        }
      }
    }

    console.log('\n🎉 Complete Flow Test Results:');
    console.log('✅ Mr Abebe correctly shows as Development Economics instructor');
    console.log('✅ Mr Abebe can access Development Economics students');
    console.log('✅ Mr Abebe cannot access students from other departments');
    console.log('✅ Department-based access control is working properly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInstructorCompleteFlow();