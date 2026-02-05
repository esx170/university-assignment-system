const BASE_URL = 'http://localhost:3000';

async function testAdminUserCreation() {
  console.log('🧪 Testing Admin User Creation...\n');

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

    // Step 2: Get departments for testing
    console.log('\n2. Getting departments...');
    const deptResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    let departmentId = null;
    if (deptResponse.ok) {
      const departments = await deptResponse.json();
      if (departments.length > 0) {
        departmentId = departments[0].id;
        console.log('✅ Found departments:', departments.length);
        console.log('   Using department:', departments[0].name);
      }
    }

    // Step 3: Test user creation
    console.log('\n3. Testing user creation...');
    
    const testUsers = [
      {
        name: 'Test Student',
        email: `test.student.${Date.now()}@university.edu`,
        password: 'TestPass123',
        full_name: 'Test Student User',
        role: 'student',
        student_id: `STU${Date.now()}`,
        primary_department_id: departmentId
      },
      {
        name: 'Test Instructor',
        email: `test.instructor.${Date.now()}@university.edu`,
        password: 'TestPass123',
        full_name: 'Test Instructor User',
        role: 'instructor',
        primary_department_id: departmentId
      }
    ];

    const createdUsers = [];

    for (const testUser of testUsers) {
      console.log(`\n   Creating ${testUser.name}...`);
      
      const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(testUser)
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log(`   ✅ ${testUser.name} created successfully`);
        console.log(`      ID: ${result.user.id}`);
        console.log(`      Email: ${result.user.email}`);
        if (result.user.note) {
          console.log(`      Note: ${result.user.note}`);
        }
        createdUsers.push(result.user);
      } else {
        const error = await createResponse.json();
        console.log(`   ❌ ${testUser.name} creation failed: ${error.error}`);
        if (error.details) {
          console.log(`      Details: ${error.details}`);
        }
      }
    }

    // Step 4: Verify users were created
    console.log('\n4. Verifying created users...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: authHeaders
    });

    if (usersResponse.ok) {
      const allUsers = await usersResponse.json();
      console.log(`✅ Total users in system: ${allUsers.length}`);
      
      // Check if our test users are in the list
      createdUsers.forEach(createdUser => {
        const foundUser = allUsers.find(u => u.id === createdUser.id);
        if (foundUser) {
          console.log(`   ✅ ${createdUser.email}: Found in system`);
          console.log(`      Status: ${foundUser.is_active ? 'Active' : 'Inactive'}`);
          console.log(`      Role: ${foundUser.role}`);
        } else {
          console.log(`   ❌ ${createdUser.email}: Not found in system`);
        }
      });
    }

    // Step 5: Clean up test users
    console.log('\n5. Cleaning up test users...');
    for (const createdUser of createdUsers) {
      const deleteResponse = await fetch(`${BASE_URL}/api/admin/users/${createdUser.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (deleteResponse.ok) {
        console.log(`   🧹 Deleted ${createdUser.email}`);
      } else {
        console.log(`   ⚠️  Failed to delete ${createdUser.email}`);
      }
    }

    console.log('\n🎉 User creation test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAdminUserCreation();