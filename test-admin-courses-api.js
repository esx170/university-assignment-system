const BASE_URL = 'http://localhost:3000';

async function testAdminCoursesAPI() {
  console.log('🧪 Testing Admin Courses API...\n');

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

    // Step 2: Test courses API with detailed error logging
    console.log('\n2. Testing courses API...');
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', coursesResponse.status);
    
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Courses API working');
      console.log('   Courses count:', coursesData.length);
      console.log('   Sample data:', JSON.stringify(coursesData.slice(0, 1), null, 2));
    } else {
      const error = await coursesResponse.json();
      console.log('❌ Courses API failed');
      console.log('   Error:', error.error);
      console.log('   Details:', error.details);
      console.log('   Full response:', JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminCoursesAPI();