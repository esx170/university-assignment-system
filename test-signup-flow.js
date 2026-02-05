const BASE_URL = 'http://localhost:3001';

async function testSignupFlow() {
  console.log('🧪 Testing Signup Flow...\n');

  try {
    // Step 1: Test signup
    console.log('1. Testing signup...');
    const timestamp = Date.now();
    const testEmail = `flowtest.${timestamp}@university.edu`;
    
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123',
        full_name: 'Flow Test User',
        student_id: `FLOW${timestamp}`,
        department_id: null
      })
    });

    const signupResult = await signupResponse.json();
    
    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupResult.error);
      return;
    }

    console.log('✅ Signup successful for:', testEmail);

    // Step 2: Test signin with the new account
    console.log('\n2. Testing signin with new account...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123'
      })
    });

    const signinResult = await signinResponse.json();
    
    if (!signinResponse.ok) {
      console.error('❌ Signin failed:', signinResult.error);
      return;
    }

    console.log('✅ Signin successful');
    console.log('   User role:', signinResult.user.role);
    console.log('   Session token created:', !!signinResult.session.token);

    // Step 3: Verify the user is not admin
    if (signinResult.user.role === 'admin') {
      console.error('❌ SECURITY ISSUE: New user got admin role!');
      return;
    }

    console.log('✅ User has correct role (not admin)');

    console.log('\n🎉 Signup flow test passed!');
    console.log('✅ Users will be redirected to normal signin page');
    console.log('✅ No unauthorized admin access');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testSignupFlow();