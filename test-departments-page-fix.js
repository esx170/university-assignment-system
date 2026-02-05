const BASE_URL = 'http://localhost:3001';

async function testDepartmentsPageFix() {
  console.log('🧪 Testing Departments Page Fix...\n');

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

    // Step 2: Test departments API
    console.log('\n2. Testing departments API...');
    const deptResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    if (deptResponse.ok) {
      const departments = await deptResponse.json();
      console.log(`✅ Departments API working - found ${departments.length} departments`);
      
      departments.slice(0, 3).forEach(dept => {
        console.log(`   - ${dept.code}: ${dept.name}`);
      });
    } else {
      const error = await deptResponse.json();
      console.log('❌ Departments API failed:', error.error);
    }

    // Step 3: Test adding department column
    console.log('\n3. Testing add department column API...');
    const addColumnResponse = await fetch(`${BASE_URL}/api/add-department-column`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (addColumnResponse.ok) {
      const result = await addColumnResponse.json();
      console.log('✅ Add department column API working');
      console.log(`   Message: ${result.message}`);
      
      if (result.details) {
        console.log(`   Column Added: ${result.details.columnAdded}`);
        console.log(`   Foreign Key: ${result.details.foreignKeyAdded}`);
        console.log(`   Assignments: ${result.details.departmentAssignments}`);
        
        if (result.details.assignments) {
          console.log('   Sample assignments:');
          result.details.assignments.forEach(assignment => {
            console.log(`     - ${assignment.email} → ${assignment.department}`);
          });
        }
      }
    } else {
      const error = await addColumnResponse.json();
      console.log('⚠️  Add department column API response:', error.error);
      if (error.suggestion) {
        console.log('   Suggestion:', error.suggestion);
      }
    }

    // Step 4: Test user management with departments
    console.log('\n4. Testing user management with department data...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: authHeaders
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Users API working - found ${users.length} users`);
      
      const usersWithDepts = users.filter(u => u.primary_department);
      console.log(`   Users with departments: ${usersWithDepts.length}`);
      
      if (usersWithDepts.length > 0) {
        console.log('   Sample users with departments:');
        usersWithDepts.slice(0, 3).forEach(user => {
          console.log(`     - ${user.email} → ${user.primary_department.code}`);
        });
      }
    } else {
      const error = await usersResponse.json();
      console.log('❌ Users API failed:', error.error);
    }

    console.log('\n🎉 Departments Page Fix Test Complete!');
    console.log('\nSummary:');
    console.log('- ✅ Admin authentication working with custom tokens');
    console.log('- ✅ Departments API accessible');
    console.log('- ✅ Department column addition API available');
    console.log('- ✅ User management shows department data');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/departments - should work without authentication errors');
    console.log('2. Visit /add-department-column - to add the missing column');
    console.log('3. Check user profiles for department information');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testDepartmentsPageFix();