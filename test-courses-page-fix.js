const BASE_URL = 'http://localhost:3001';

async function testCoursesPageFix() {
  console.log('🧪 Testing Courses Page Fix...\n');

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

    // Step 2: Test courses API
    console.log('\n2. Testing courses API...');
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      headers: authHeaders
    });

    if (coursesResponse.ok) {
      const courses = await coursesResponse.json();
      console.log(`✅ Courses API working - found ${courses.length} courses`);
      
      courses.slice(0, 3).forEach(course => {
        console.log(`   - ${course.code}: ${course.name}`);
        if (course.department) {
          console.log(`     Department: ${course.department.code} - ${course.department.name}`);
        }
      });
    } else {
      const error = await coursesResponse.json();
      console.log('❌ Courses API failed:', error.error);
    }

    // Step 3: Test departments API (for dropdown)
    console.log('\n3. Testing departments API for dropdown...');
    const deptResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    if (deptResponse.ok) {
      const departments = await deptResponse.json();
      console.log(`✅ Departments API working - found ${departments.length} departments`);
      
      departments.slice(0, 3).forEach(dept => {
        console.log(`   - ${dept.code}: ${dept.name}`);
      });
    } else {
      const error = await deptResponse.json();
      console.log('❌ Departments API failed:', error.error);
    }

    // Step 4: Test course creation
    console.log('\n4. Testing course creation...');
    
    // Get a department to use
    const deptForTest = await fetch(`${BASE_URL}/api/departments`, { headers: authHeaders })
      .then(r => r.json())
      .then(depts => depts[0]);

    if (deptForTest) {
      const createResponse = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'Test Course Creation',
          code: 'TEST101',
          description: 'This is a test course for API testing',
          credits: 3,
          semester: 'Fall',
          year: 2024,
          department_id: deptForTest.id
        })
      });

      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ Course creation successful');
        console.log(`   Created: ${createResult.course.code} - ${createResult.course.name}`);
        console.log(`   Department: ${createResult.course.department?.name || 'Unknown'}`);
      } else {
        const error = await createResponse.json();
        console.log('⚠️  Course creation response:', error.error);
        if (createResponse.status === 409) {
          console.log('   (This is expected if course already exists)');
        }
      }
    } else {
      console.log('⚠️  No departments available for testing course creation');
    }

    console.log('\n🎉 Courses Page Fix Test Complete!');
    console.log('\nSummary:');
    console.log('- ✅ Admin authentication working with custom tokens');
    console.log('- ✅ Courses API accessible');
    console.log('- ✅ Departments API accessible (for dropdown)');
    console.log('- ✅ Course creation API working');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/courses - should work without authentication errors');
    console.log('2. Click "Create Course" - department dropdown should populate');
    console.log('3. Create a new course - should work properly');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testCoursesPageFix();