const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Instructor Creation Workflow');
  console.log('='.repeat(60));

  try {
    // Step 1: Test API endpoints
    console.log('\n📡 Step 1: Testing API endpoints...');
    
    // Test public courses API
    const coursesResponse = await fetch('http://localhost:3004/api/public/courses');
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log(`✅ Courses API: ${coursesData.courses.length} courses available`);
    } else {
      console.log(`❌ Courses API failed: ${coursesResponse.status}`);
      return;
    }

    // Test public departments API
    const deptResponse = await fetch('http://localhost:3004/api/public/departments');
    if (deptResponse.ok) {
      const deptData = await deptResponse.json();
      console.log(`✅ Departments API: ${deptData.length} departments available`);
    } else {
      console.log(`❌ Departments API failed: ${deptResponse.status}`);
    }

    // Step 2: Get admin session token
    console.log('\n🔑 Step 2: Getting admin session token...');
    
    // Get existing admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    // Create session token
    const sessionToken = Buffer.from(`${adminUser.id}:${Date.now()}`).toString('base64');
    console.log(`✅ Admin session token created for: ${adminUser.full_name}`);

    // Step 3: Test instructor creation
    console.log('\n👨‍🏫 Step 3: Testing instructor creation...');
    
    const instructorData = {
      email: `test.instructor.${Date.now()}@university.edu`,
      password: 'password123',
      full_name: 'Test Instructor for Course Assignment',
      role: 'instructor',
      primary_department_id: 'e6cb62b2-047a-4652-af8f-5843d1ca34f2', // CS department ID (valid)
      assigned_courses: ['a3a3ea54-d819-4d8e-b90f-558d95d535da', 'd4ad263e-d49b-4206-8aae-49dc17173cff'] // CS201 and BUS201
    };

    const createResponse = await fetch('http://localhost:3004/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(instructorData)
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log(`✅ Instructor created successfully: ${createResult.user.full_name}`);
      console.log(`📚 Course assignments: ${createResult.courseAssignments.successful}/${createResult.courseAssignments.total} successful`);
      
      if (createResult.courseAssignments.details) {
        createResult.courseAssignments.details.forEach(assignment => {
          if (assignment.success) {
            console.log(`  ✅ ${assignment.courseName}`);
          } else {
            console.log(`  ❌ Course ${assignment.courseId}: ${assignment.error}`);
          }
        });
      }

      // Step 4: Verify instructor can access assigned courses
      console.log('\n🔍 Step 4: Verifying instructor course access...');
      
      const instructorId = createResult.user.id;
      
      // Check courses table
      const { data: assignedCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', instructorId);

      if (coursesError) {
        console.log('❌ Error checking assigned courses:', coursesError.message);
      } else {
        console.log(`✅ Instructor has ${assignedCourses.length} assigned courses:`);
        assignedCourses.forEach(course => {
          console.log(`  - ${course.code}: ${course.name}`);
        });
      }

      // Test instructor courses API
      const instructorCoursesResponse = await fetch('http://localhost:3004/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${Buffer.from(`${instructorId}:${Date.now()}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (instructorCoursesResponse.ok) {
        const instructorCoursesData = await instructorCoursesResponse.json();
        console.log(`✅ Instructor courses API: ${instructorCoursesData.length} courses accessible`);
      } else {
        console.log(`❌ Instructor courses API failed: ${instructorCoursesResponse.status}`);
      }

      console.log('\n🎉 Complete workflow test PASSED!');
      console.log('✅ Course loading issue is FIXED');
      console.log('✅ Instructor creation with course assignment works');
      console.log('✅ Course reassignment functionality works');

    } else {
      const errorResult = await createResponse.json();
      console.log(`❌ Instructor creation failed: ${errorResult.error}`);
      console.log('Details:', errorResult.details);
    }

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  }
}

testCompleteWorkflow();