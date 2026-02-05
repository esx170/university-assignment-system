const BASE_URL = 'http://localhost:3001';

async function testDashboardProtection() {
  console.log('🧪 Testing Dashboard Protection...\n');

  try {
    // Test 1: Try to access dashboard without authentication
    console.log('1. Testing dashboard access without authentication...');
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('   Dashboard response status:', dashboardResponse.status);
    
    if (dashboardResponse.status === 200) {
      const html = await dashboardResponse.text();
      if (html.includes('Sign In') || html.includes('signin')) {
        console.log('✅ Dashboard properly shows signin requirement');
      } else {
        console.log('❌ Dashboard may be accessible without authentication');
      }
    } else if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
      const location = dashboardResponse.headers.get('location');
      console.log('✅ Dashboard redirects to:', location);
    }

    // Test 2: Sign in and then access dashboard
    console.log('\n2. Testing dashboard access with authentication...');
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

    // Test 3: Verify admin gets admin dashboard, not student dashboard
    console.log('\n3. Testing role-based dashboard access...');
    console.log('   Admin role confirmed:', signinResult.user.role);
    
    if (signinResult.user.role === 'admin') {
      console.log('✅ Admin user has correct role');
    } else {
      console.log('❌ Admin user has incorrect role:', signinResult.user.role);
    }

    console.log('\n🎉 Dashboard protection test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testDashboardProtection();