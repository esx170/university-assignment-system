const BASE_URL = 'http://localhost:3000';

async function testAdminPages() {
  console.log('🧪 Testing Admin Pages...\n');

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
    console.log('   Role:', signinResult.user.role);

    // Step 2: Test admin users API
    console.log('\n2. Testing admin users API...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Admin users API working');
      console.log('   Users count:', usersData.length || 0);
    } else {
      const error = await usersResponse.json();
      console.log('❌ Admin users API failed:', error.error);
    }

    // Step 3: Test admin assignments API
    console.log('\n3. Testing admin assignments API...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/assignments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ Admin assignments API working');
      console.log('   Assignments count:', assignmentsData.length);
    } else {
      const error = await assignmentsResponse.json();
      console.log('❌ Admin assignments API failed:', error.error);
    }

    // Step 4: Test admin courses API
    console.log('\n4. Testing admin courses API...');
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Admin courses API working');
      console.log('   Courses count:', coursesData.length || 0);
    } else {
      const error = await coursesResponse.json();
      console.log('❌ Admin courses API failed:', error.error);
    }

    // Step 5: Test admin departments API
    console.log('\n5. Testing admin departments API...');
    const departmentsResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (departmentsResponse.ok) {
      const departmentsData = await departmentsResponse.json();
      console.log('✅ Admin departments API working');
      console.log('   Departments count:', departmentsData.length || 0);
    } else {
      const error = await departmentsResponse.json();
      console.log('❌ Admin departments API failed:', error.error);
    }

    // Step 6: Test admin enrollments API
    console.log('\n6. Testing admin enrollments API...');
    const enrollmentsResponse = await fetch(`${BASE_URL}/api/admin/enrollments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (enrollmentsResponse.ok) {
      const enrollmentsData = await enrollmentsResponse.json();
      console.log('✅ Admin enrollments API working');
      console.log('   Enrollments count:', enrollmentsData.length || 0);
    } else {
      const error = await enrollmentsResponse.json();
      console.log('❌ Admin enrollments API failed:', error.error);
    }

    console.log('\n🎉 Admin pages test completed!');
    console.log('Summary: Check which APIs need custom token support');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminPages();