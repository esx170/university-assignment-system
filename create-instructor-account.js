const BASE_URL = 'http://localhost:3001';

async function createInstructorAccount() {
  console.log('🧪 Creating Instructor Account...\n');

  try {
    // Step 1: Sign in as admin to create instructor
    console.log('1. Signing in as admin...');
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

    // Step 2: Create instructor account
    console.log('\n2. Creating instructor account...');
    const timestamp = Date.now();
    const instructorEmail = `instructor.${timestamp}@university.edu`;
    
    const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSigninResult.session.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: instructorEmail,
        password: 'InstructorPass123',
        full_name: 'Test Instructor',
        role: 'instructor',
        primary_department_id: null // We'll assign department later if needed
      })
    });

    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Instructor creation failed:', createResult.error);
      return;
    }

    console.log('✅ Instructor account created:', instructorEmail);

    // Step 3: Test instructor signin
    console.log('\n3. Testing instructor signin...');
    const instructorSigninResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: instructorEmail,
        password: 'InstructorPass123'
      })
    });

    const instructorSigninResult = await instructorSigninResponse.json();
    
    if (!instructorSigninResponse.ok) {
      console.error('❌ Instructor signin failed:', instructorSigninResult.error);
      return;
    }

    console.log('✅ Instructor signed in successfully');
    console.log('   Role:', instructorSigninResult.user.role);
    console.log('   Email:', instructorSigninResult.user.email);

    console.log('\n🎉 Instructor account ready for testing!');
    console.log('📧 Email:', instructorEmail);
    console.log('🔑 Password: InstructorPass123');

    return {
      email: instructorEmail,
      password: 'InstructorPass123',
      token: instructorSigninResult.session.token
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

createInstructorAccount();