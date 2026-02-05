const BASE_URL = 'http://localhost:3001';

async function debugDepartmentIntegration() {
  console.log('🔍 Debugging Department Integration...\n');

  try {
    // Step 1: Check current departments in public API
    console.log('1. Checking current departments in public API...');
    const publicResponse = await fetch(`${BASE_URL}/api/public/departments`);

    if (publicResponse.ok) {
      const publicDepartments = await publicResponse.json();
      console.log(`✅ Public API departments: ${publicDepartments.length}`);
      
      publicDepartments.forEach((dept, index) => {
        console.log(`   ${index + 1}. ${dept.code}: ${dept.name} (ID: ${dept.id})`);
      });
    }

    // Step 2: Check departments in admin API
    console.log('\n2. Signing in and checking admin API departments...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    const signinResult = await signinResponse.json();
    const authHeaders = {
      'Authorization': `Bearer ${signinResult.session.token}`,
      'Content-Type': 'application/json'
    };

    const adminResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    if (adminResponse.ok) {
      const adminDepartments = await adminResponse.json();
      console.log(`✅ Admin API departments: ${adminDepartments.length}`);
      
      adminDepartments.forEach((dept, index) => {
        console.log(`   ${index + 1}. ${dept.code}: ${dept.name} (ID: ${dept.id})`);
      });

      // Step 3: Compare the two lists
      console.log('\n3. Comparing public vs admin department lists...');
      
      const publicCodes = new Set();
      const adminCodes = new Set();
      
      if (publicResponse.ok) {
        const publicDepartments = await fetch(`${BASE_URL}/api/public/departments`).then(r => r.json());
        publicDepartments.forEach(d => publicCodes.add(d.code));
      }
      
      adminDepartments.forEach(d => adminCodes.add(d.code));
      
      console.log('   Public API codes:', Array.from(publicCodes).sort());
      console.log('   Admin API codes:', Array.from(adminCodes).sort());
      
      const missingInPublic = Array.from(adminCodes).filter(code => !publicCodes.has(code));
      const missingInAdmin = Array.from(publicCodes).filter(code => !adminCodes.has(code));
      
      if (missingInPublic.length > 0) {
        console.log('   ❌ Missing in public API:', missingInPublic);
      }
      
      if (missingInAdmin.length > 0) {
        console.log('   ❌ Missing in admin API:', missingInAdmin);
      }
      
      if (missingInPublic.length === 0 && missingInAdmin.length === 0) {
        console.log('   ✅ Both APIs have the same departments');
      }
    }

    // Step 4: Test creating a unique department
    console.log('\n4. Creating a unique test department...');
    const uniqueCode = `TEST${Date.now().toString().slice(-4)}`;
    const uniqueDeptData = {
      name: `Test Department ${uniqueCode}`,
      code: uniqueCode,
      description: 'Unique test department for debugging'
    };

    const createResponse = await fetch(`${BASE_URL}/api/departments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(uniqueDeptData)
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log(`✅ Created unique department: ${createResult.department.code}`);
      
      // Immediately check if it appears in public API
      console.log('\n5. Checking if new department appears in public API...');
      const checkResponse = await fetch(`${BASE_URL}/api/public/departments`);
      
      if (checkResponse.ok) {
        const checkDepartments = await checkResponse.json();
        const foundNew = checkDepartments.find(d => d.code === uniqueCode);
        
        if (foundNew) {
          console.log('✅ New department immediately available in public API!');
          console.log(`   ${foundNew.code}: ${foundNew.name}`);
        } else {
          console.log('❌ New department NOT found in public API');
          console.log('   This suggests a caching or database sync issue');
        }
      }
    } else {
      const error = await createResponse.json();
      console.log('❌ Failed to create unique department:', error.error);
    }

    console.log('\n🎉 Department Integration Debug Complete!');

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
  }
}

debugDepartmentIntegration();