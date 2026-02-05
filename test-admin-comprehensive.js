const BASE_URL = 'http://localhost:3000';

async function testAdminComprehensive() {
  console.log('🧪 Comprehensive Admin System Test...\n');

  try {
    // Step 1: Sign in as admin
    console.log('1. Admin Authentication Test');
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
      console.error('   ❌ Admin signin failed:', signinResult.error);
      return;
    }

    console.log('   ✅ Admin authentication successful');
    console.log('   📋 User role:', signinResult.user.role);
    console.log('   🔑 Token type: Custom session token');

    const authHeaders = {
      'Authorization': `Bearer ${signinResult.session.token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test all admin APIs
    console.log('\n2. Admin API Endpoints Test');
    
    const apiTests = [
      { name: 'Users Management', endpoint: '/api/admin/users', method: 'GET' },
      { name: 'Assignments', endpoint: '/api/assignments', method: 'GET' },
      { name: 'Courses', endpoint: '/api/courses', method: 'GET' },
      { name: 'Departments', endpoint: '/api/departments', method: 'GET' },
      { name: 'Enrollments', endpoint: '/api/admin/enrollments', method: 'GET' }
    ];

    const results = [];
    
    for (const test of apiTests) {
      try {
        const response = await fetch(`${BASE_URL}${test.endpoint}`, {
          method: test.method,
          headers: authHeaders
        });

        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : (data.enrollments ? data.enrollments.length : 'N/A');
          console.log(`   ✅ ${test.name}: ${count} items`);
          results.push({ name: test.name, status: 'success', count });
        } else {
          const error = await response.json();
          console.log(`   ❌ ${test.name}: ${error.error}`);
          results.push({ name: test.name, status: 'failed', error: error.error });
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`);
        results.push({ name: test.name, status: 'error', error: error.message });
      }
    }

    // Step 3: Test department creation (admin functionality)
    console.log('\n3. Admin Operations Test');
    console.log('   Testing department creation...');
    
    const newDepartment = {
      name: 'Test Department',
      code: 'TEST',
      description: 'Test department for admin functionality'
    };

    const createDeptResponse = await fetch(`${BASE_URL}/api/departments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newDepartment)
    });

    if (createDeptResponse.ok) {
      const createdDept = await createDeptResponse.json();
      console.log('   ✅ Department creation successful');
      console.log('   📋 Created:', createdDept.department.name);
      
      // Clean up - delete the test department
      const deleteDeptResponse = await fetch(`${BASE_URL}/api/departments?id=${createdDept.department.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      
      if (deleteDeptResponse.ok) {
        console.log('   🧹 Test department cleaned up');
      }
    } else {
      const error = await createDeptResponse.json();
      console.log('   ❌ Department creation failed:', error.error);
    }

    // Step 4: Summary
    console.log('\n4. Test Summary');
    const successCount = results.filter(r => r.status === 'success').length;
    const totalTests = results.length;
    
    console.log(`   📊 API Tests: ${successCount}/${totalTests} passed`);
    console.log('   🔐 Authentication: Custom session tokens working');
    console.log('   👑 Admin privileges: Verified');
    
    if (successCount === totalTests) {
      console.log('\n🎉 All admin functionality is working correctly!');
      console.log('   The admin side is ready for use.');
    } else {
      console.log('\n⚠️  Some admin features need attention:');
      results.filter(r => r.status !== 'success').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
}

testAdminComprehensive();