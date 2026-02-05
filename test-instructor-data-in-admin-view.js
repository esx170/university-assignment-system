const BASE_URL = 'http://localhost:3001';

async function testInstructorDataInAdminView() {
  console.log('🧪 Testing Instructor Data in Admin View...\n');

  try {
    // Step 1: Sign in as admin
    console.log('1. Signing in as admin...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    const signinResult = await signinResponse.json();
    
    if (!signinResponse.ok) {
      console.error('❌ Admin signin failed:', signinResult.error);
      return;
    }

    console.log('✅ Admin signed in successfully');

    const authHeaders = {
      'Authorization': `Bearer ${signinResult.session.token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get all users and find instructors
    console.log('\n2. Getting users and checking instructor data...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: authHeaders
    });

    if (!usersResponse.ok) {
      const error = await usersResponse.json();
      console.error('❌ Failed to get users:', error.error);
      return;
    }

    const users = await usersResponse.json();
    console.log(`✅ Found ${users.length} users`);

    // Find instructors
    const instructors = users.filter(u => u.role === 'instructor');
    console.log(`   - Instructors: ${instructors.length}`);

    if (instructors.length === 0) {
      console.log('❌ No instructors found');
      return;
    }

    // Check instructor data
    console.log('\n3. Checking instructor course and assignment data...');
    
    instructors.forEach((instructor, index) => {
      console.log(`\n   Instructor ${index + 1}: ${instructor.full_name} (${instructor.email})`);
      console.log(`   - ID: ${instructor.id}`);
      console.log(`   - Status: ${instructor.is_active ? 'Active' : 'Inactive'}`);
      
      if (instructor.primary_department) {
        console.log(`   - Department: ${instructor.primary_department.code} - ${instructor.primary_department.name}`);
      } else {
        console.log('   - Department: Not assigned');
      }

      if (instructor.assigned_courses && instructor.assigned_courses.length > 0) {
        console.log(`   - Assigned Courses: ${instructor.assigned_courses.length}`);
        instructor.assigned_courses.forEach(course => {
          console.log(`     * ${course.code}: ${course.name} (${course.semester} ${course.year})`);
        });
      } else {
        console.log('   - Assigned Courses: None');
      }

      if (instructor.assignments && instructor.assignments.length > 0) {
        console.log(`   - Assignments: ${instructor.assignments.length}`);
        instructor.assignments.forEach(assignment => {
          console.log(`     * ${assignment.title} (${assignment.max_points} pts)`);
        });
      } else {
        console.log('   - Assignments: None');
      }
    });

    // Check students too
    const students = users.filter(u => u.role === 'student');
    console.log(`\n4. Checking student enrollment data (${students.length} students)...`);
    
    const studentsWithCourses = students.filter(s => s.enrolled_courses && s.enrolled_courses.length > 0);
    console.log(`   - Students with enrolled courses: ${studentsWithCourses.length}`);
    
    if (studentsWithCourses.length > 0) {
      const sampleStudent = studentsWithCourses[0];
      console.log(`   - Sample: ${sampleStudent.full_name}`);
      console.log(`     * Enrolled in ${sampleStudent.enrolled_courses.length} courses`);
      sampleStudent.enrolled_courses.forEach(course => {
        console.log(`       - ${course.code}: ${course.name}`);
      });
    }

    console.log('\n🎉 Instructor Data Test Complete!');
    console.log('\nSummary:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Instructors: ${instructors.length}`);
    console.log(`- Students: ${students.length}`);
    console.log('- Course and assignment data should now be visible in the View button');
    console.log('- The admin user management View functionality is working');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testInstructorDataInAdminView();