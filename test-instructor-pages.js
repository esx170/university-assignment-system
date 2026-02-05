const BASE_URL = 'http://localhost:3001';

async function testInstructorPages() {
  console.log('🧪 Testing Instructor Pages...\n');

  try {
    // Step 1: Sign in as instructor
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
    console.log('   Role:', signinResult.user.role);

    // Step 2: Test instructor departments API
    console.log('\n2. Testing instructor departments API...');
    const departmentsResponse = await fetch(`${BASE_URL}/api/instructor/departments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (departmentsResponse.ok) {
      const departmentsData = await departmentsResponse.json();
      console.log('✅ Instructor departments API working');
      console.log('   Departments count:', departmentsData.departments?.length || 0);
    } else {
      const error = await departmentsResponse.json();
      console.log('❌ Instructor departments API failed:', error.error);
    }

    // Step 3: Test assignments API (used by instructor assignments page)
    console.log('\n3. Testing assignments API...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/assignments`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ Assignments API working');
      console.log('   Assignments count:', assignmentsData.length);
    } else {
      const error = await assignmentsResponse.json();
      console.log('❌ Assignments API failed:', error.error);
    }

    console.log('\n🎉 Instructor pages test completed!');
    console.log('Summary of expected issues:');
    console.log('- Instructor pages likely use Supabase tokens instead of custom tokens');
    console.log('- APIs may need custom token support');
    console.log('- Department assignments table may not exist');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testInstructorPages();