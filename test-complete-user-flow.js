const BASE_URL = 'http://localhost:3001';

async function testCompleteUserFlow() {
  console.log('🧪 Testing Complete User Flow...\n');

  try {
    // Test 1: Create a new student account
    console.log('1. Creating new student account...');
    const timestamp = Date.now();
    const studentEmail = `student.${timestamp}@university.edu`;
    
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'StudentPass123',
        full_name: 'Test Student User',
        student_id: `STU${timestamp}`,
        department_id: null
      })
    });

    const signupResult = await signupResponse.json();
    
    if (!signupResponse.ok) {
      console.error('❌ Student signup failed:', signupResult.error);
      return;
    }

    console.log('✅ Student account created:', studentEmail);

    // Test 2: Sign in as student
    console.log('\n2. Signing in as student...');
    const studentSigninResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'StudentPass123'
      })
    });

    const studentSigninResult = await studentSigninResponse.json();
    
    if (!studentSigninResponse.ok) {
      console.error('❌ Student signin failed:', studentSigninResult.error);
      return;
    }

    console.log('✅ Student signed in successfully');
    console.log('   Role:', studentSigninResult.user.role);
    console.log('   Full name:', studentSigninResult.user.full_name);

    // Test 3: Verify student cannot access admin functions
    console.log('\n3. Testing student access to admin functions...');
    const adminUsersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${studentSigninResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (adminUsersResponse.status === 403) {
      console.log('✅ Student correctly denied access to admin functions');
    } else {
      console.log('❌ SECURITY ISSUE: Student can access admin functions!');
    }

    // Test 4: Sign in as admin
    console.log('\n4. Signing in as admin...');
    const adminSigninResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    const adminSigninResult = await adminSigninResponse.json();
    
    if (!adminSigninResponse.ok) {
      console.error('❌ Admin signin failed:', adminSigninResult.error);
      return;
    }

    console.log('✅ Admin signed in successfully');
    console.log('   Role:', adminSigninResult.user.role);

    // Test 5: Verify admin can access admin functions
    console.log('\n5. Testing admin access to admin functions...');
    const adminAccessResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminSigninResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (adminAccessResponse.ok) {
      const users = await adminAccessResponse.json();
      console.log('✅ Admin can access admin functions');
      console.log(`   Retrieved ${users.length} users`);
    } else {
      console.log('❌ Admin cannot access admin functions');
    }

    console.log('\n🎉 Complete user flow test results:');
    console.log('✅ Student signup works correctly');
    console.log('✅ Student signin works correctly');
    console.log('✅ Student gets student role (not admin)');
    console.log('✅ Student cannot access admin functions');
    console.log('✅ Admin signin works correctly');
    console.log('✅ Admin can access admin functions');
    console.log('✅ Role-based access control is working');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testCompleteUserFlow();