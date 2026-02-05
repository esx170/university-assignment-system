const BASE_URL = 'http://localhost:3002';

async function testAdminUserManagement() {
  console.log('🧪 Testing Admin User Management...\n');

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
    const adminToken = signinResult.session.token;

    // Step 2: Test getting all users
    console.log('\n2. Testing get all users...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersResponse.json();
    
    if (!usersResponse.ok) {
      console.error('❌ Get users failed:', users.error);
      return;
    }

    console.log(`✅ Retrieved ${users.length} users successfully`);

    // Step 3: Test creating a new user
    console.log('\n3. Testing create new user...');
    const timestamp = Date.now();
    const testEmail = `test.student.${timestamp}@university.edu`;
    
    const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123',
        full_name: 'Test Student',
        role: 'student',
        student_id: `TEST${timestamp}`
      })
    });

    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Create user failed:', createResult.error);
      return;
    }

    console.log('✅ User created successfully:', createResult.user.email);
    const newUserId = createResult.user.id;

    // Step 4: Test updating the user
    console.log('\n4. Testing update user...');
    const updateResponse = await fetch(`${BASE_URL}/api/admin/users/${newUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        full_name: 'Test Student Updated',
        role: 'student',
        student_id: `TEST${timestamp}`
      })
    });

    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.error('❌ Update user failed:', updateResult.error);
      return;
    }

    console.log('✅ User updated successfully:', updateResult.user.full_name);

    // Step 5: Test deleting the user
    console.log('\n5. Testing delete user...');
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/users/${newUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const deleteResult = await deleteResponse.json();
    
    if (!deleteResponse.ok) {
      console.error('❌ Delete user failed:', deleteResult.error);
      return;
    }

    console.log('✅ User deleted successfully');

    console.log('\n🎉 All admin user management tests passed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminUserManagement();