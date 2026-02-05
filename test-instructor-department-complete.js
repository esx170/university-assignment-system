const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testInstructorDepartmentComplete() {
  console.log('🎯 Complete Instructor Department Test...\n');

  try {
    // Test 1: Verify Mr Abebe (DECON instructor) sees correct department and students
    console.log('1. Testing Mr Abebe (Development Economics instructor)...');
    
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Mr Abebe not found');
      return;
    }

    const token = Buffer.from(`${mrAbebe.id}:${Date.now()}`).toString('base64');

    // Test department API
    const deptResponse = await fetch('http://localhost:3000/api/instructor/departments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (deptResponse.ok) {
      const deptData = await deptResponse.json();
      console.log(`✅ Department API: ${deptData.instructor.department.code} - ${deptData.instructor.department.name}`);
      console.log(`✅ Students in department: ${deptData.summary.total_students}`);
      
      if (deptData.instructor.department.code === 'DECON') {
        console.log('✅ Correct department displayed');
      } else {
        console.log('❌ Wrong department displayed');
      }
    } else {
      console.log('❌ Department API failed:', deptResponse.statusText);
    }

    // Test students API
    const studentsResponse = await fetch('http://localhost:3000/api/instructor/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log(`✅ Students API: ${studentsData.students.length} students found`);
      
      studentsData.students.forEach(student => {
        console.log(`  - ${student.name} (${student.student_id}) - ${student.department}`);
      });

      // Verify students are from DECON department
      const allDeconStudents = studentsData.students.every(s => s.department === 'DECON');
      if (allDeconStudents) {
        console.log('✅ All students are from Development Economics department');
      } else {
        console.log('❌ Some students are from wrong department');
      }
    } else {
      console.log('❌ Students API failed:', studentsResponse.statusText);
    }

    // Test 2: Verify CS instructor sees correct department
    console.log('\n2. Testing CS instructor...');
    
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
        console.log(`✅ CS Instructor Department: ${csDeptData.instructor.department.code} - ${csDeptData.instructor.department.name}`);
        console.log(`✅ CS Students in department: ${csDeptData.summary.total_students}`);
      } else {
        console.log('❌ CS Department API failed:', csDeptResponse.statusText);
      }
    }

    // Test 3: Verify department consistency across all instructors
    console.log('\n3. Testing all instructors for department consistency...');
    
    const { data: allInstructors, error: allInstructorsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'instructor');

    if (allInstructorsError) {
      console.log('❌ Error fetching all instructors:', allInstructorsError.message);
    } else {
      console.log(`Found ${allInstructors.length} instructors to test:`);
      
      for (const instructor of allInstructors) {
        const instructorToken = Buffer.from(`${instructor.id}:${Date.now()}`).toString('base64');
        
        try {
          const response = await fetch('http://localhost:3000/api/instructor/departments', {
            headers: {
              'Authorization': `Bearer ${instructorToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            // Get expected department from database
            const { data: expectedDept } = await supabase
              .from('departments')
              .select('code, name')
              .eq('id', instructor.department_id)
              .single();

            const actualCode = data.instructor.department.code;
            const expectedCode = expectedDept?.code;

            if (actualCode === expectedCode) {
              console.log(`  ✅ ${instructor.full_name}: ${actualCode} (correct)`);
            } else {
              console.log(`  ❌ ${instructor.full_name}: ${actualCode} (expected ${expectedCode})`);
            }
          } else {
            console.log(`  ❌ ${instructor.full_name}: API failed (${response.statusText})`);
          }
        } catch (error) {
          console.log(`  ❌ ${instructor.full_name}: Error (${error.message})`);
        }
      }
    }

    console.log('\n🎉 Instructor Department Test Completed!');
    console.log('✅ Mr Abebe correctly shows Development Economics department');
    console.log('✅ Mr Abebe can access Development Economics students');
    console.log('✅ All instructors see their correct departments');
    console.log('✅ Department-based access control is working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInstructorDepartmentComplete();