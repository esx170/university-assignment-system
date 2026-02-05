const BASE_URL = 'http://localhost:3001';

async function testAssignmentsAPI() {
  console.log('🧪 Testing Assignments API...\n');

  try {
    // Step 1: Sign in as instructor to get a valid token
    console.log('1. Signing in as instructor...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'instructor.1770257440659@university.edu',
        password: 'InstructorPass123'
      })
    });

    const signinResult = await signinResponse.json();
    
    if (!signinResponse.ok) {
      console.error('❌ Instructor signin failed:', signinResult.error);
      return;
    }

    console.log('✅ Instructor signed in successfully');
    console.log('   Token:', signinResult.session.token.substring(0, 20) + '...');

    // Step 2: Test assignments API with detailed error logging
    console.log('\n2. Testing assignments API...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/assignments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', assignmentsResponse.status);
    
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ Assignments API working');
      console.log('   Assignments count:', assignmentsData.length);
      console.log('   Sample data:', JSON.stringify(assignmentsData.slice(0, 1), null, 2));
    } else {
      const error = await assignmentsResponse.json();
      console.log('❌ Assignments API failed');
      console.log('   Error:', error.error);
      console.log('   Details:', error.details);
      console.log('   Full response:', JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAssignmentsAPI();