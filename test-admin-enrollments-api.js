const BASE_URL = 'http://localhost:3000';

async function testAdminEnrollmentsAPI() {
  console.log('🧪 Testing Admin Enrollments API...\n');

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

    // Step 2: Test enrollments API with detailed error logging
    console.log('\n2. Testing enrollments API...');
    const enrollmentsResponse = await fetch(`${BASE_URL}/api/admin/enrollments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', enrollmentsResponse.status);
    
    if (enrollmentsResponse.ok) {
      const enrollmentsData = await enrollmentsResponse.json();
      console.log('✅ Enrollments API working');
      console.log('   Enrollments count:', enrollmentsData.length || 0);
      console.log('   Sample data:', JSON.stringify(enrollmentsData, null, 2));
    } else {
      const error = await enrollmentsResponse.json();
      console.log('❌ Enrollments API failed');
      console.log('   Error:', error.error);
      console.log('   Details:', error.details);
      console.log('   Full response:', JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminEnrollmentsAPI();