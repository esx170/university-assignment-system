const BASE_URL = 'http://localhost:3000';

async function testAdminUserEdit() {
  console.log('🧪 Testing Admin User Edit...\n');

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

    // Step 2: Create a test user to edit
    console.log('\n2. Creating test user...');
    const testUser = {
      email: `test.edit.${Date.now()}@university.edu`,
      password: 'TestPass123',
      full_name: 'Test Edit User',
      role: 'student',
      student_id: `EDIT${Date.now()}`
    };

    const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testUser)
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Failed to create test user:', error.error);
      return;
    }

    const createResult = await createResponse.json();
    const userId = createResult.user.id;
    console.log('✅ Test user created:', createResult.user.email);

    // Step 3: Test user update
    console.log('\n3. Testing user update...');
    const updateData = {
      email: testUser.email,
      full_name: 'Updated Test User Name',
      role: 'instructor', // Change role
      student_id: testUser.student_id
    };

    const updateResponse = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ User updated successfully');
      console.log('   New name:', updateResult.user.full_name);
      console.log('   New role:', updateResult.user.role);
    } else {
      const error = await updateResponse.json();
      console.log('❌ User update failed:', error.error);
      if (error.details) {
        console.log('   Details:', error.details);
      }
    }

    // Step 4: Verify the update
    console.log('\n4. Verifying update...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: authHeaders
    });

    if (usersResponse.ok) {
      const allUsers = await usersResponse.json();
      const updatedUser = allUsers.find(u => u.id === userId);
      
      if (updatedUser) {
        console.log('✅ Updated user found in system');
        console.log('   Name:', updatedUser.full_name);
        console.log('   Role:', updatedUser.role);
        console.log('   Status:', updatedUser.is_active ? 'Active' : 'Inactive');
      } else {
        console.log('❌ Updated user not found in system');
      }
    }

    // Step 5: Clean up
    console.log('\n5. Cleaning up...');
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (deleteResponse.ok) {
      console.log('🧹 Test user deleted successfully');
    } else {
      console.log('⚠️  Failed to delete test user');
    }

    console.log('\n🎉 User edit test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminUserEdit();