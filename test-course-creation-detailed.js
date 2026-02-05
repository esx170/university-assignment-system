const BASE_URL = 'http://localhost:3001';

async function testCourseCreationDetailed() {
  console.log('🧪 Testing Course Creation in Detail...\n');

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

    // Step 2: Get departments
    console.log('\n2. Getting departments for course creation...');
    const deptResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    const departments = await deptResponse.json();
    console.log(`✅ Found ${departments.length} departments`);
    
    const csDept = departments.find(d => d.code === 'CS');
    if (!csDept) {
      console.log('❌ CS department not found');
      return;
    }

    console.log(`   Using department: ${csDept.code} - ${csDept.name} (${csDept.id})`);

    // Step 3: Test course creation with detailed error handling
    console.log('\n3. Testing course creation with detailed logging...');
    
    const courseData = {
      name: 'Advanced Programming Concepts',
      code: 'CS301',
      description: 'Advanced programming techniques and design patterns',
      credits: 4,
      semester: 'Spring',
      year: 2025,
      department_id: csDept.id
    };

    console.log('   Course data:', JSON.stringify(courseData, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/courses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(courseData)
    });

    console.log(`   Response status: ${createResponse.status}`);

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Course creation successful!');
      console.log('   Result:', JSON.stringify(createResult, null, 2));
    } else {
      const error = await createResponse.json();
      console.log('❌ Course creation failed');
      console.log('   Error:', JSON.stringify(error, null, 2));
      
      if (error.details) {
        console.log('   Details:', error.details);
      }
    }

    // Step 4: Check current courses
    console.log('\n4. Checking current courses after creation attempt...');
    const finalCoursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      headers: authHeaders
    });

    if (finalCoursesResponse.ok) {
      const finalCourses = await finalCoursesResponse.json();
      console.log(`✅ Current courses count: ${finalCourses.length}`);
      
      finalCourses.forEach(course => {
        console.log(`   - ${course.code}: ${course.name}`);
        console.log(`     Semester: ${course.semester} ${course.year}`);
        console.log(`     Department: ${course.department?.name || 'Unknown'}`);
      });
    }

    console.log('\n🎉 Detailed Course Creation Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testCourseCreationDetailed();