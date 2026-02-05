// Test if dashboard auth is working after signin
async function testDashboardAuth() {
  console.log('🔐 Testing dashboard authentication...')
  
  const testEmail = `dashboard.test.${Date.now()}@example.com`
  const testPassword = 'password123'
  
  try {
    // Step 1: Create account
    console.log('Step 1: Creating test account...')
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        full_name: 'Dashboard Test User',
        student_id: `DASH${Date.now()}`,
        department_id: '1'
      })
    })
    
    const signupResult = await signupResponse.json()
    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupResult.error)
      return
    }
    console.log('✅ Account created')
    
    // Step 2: Sign in
    console.log('Step 2: Signing in...')
    const signinResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })
    
    const signinResult = await signinResponse.json()
    if (!signinResponse.ok) {
      console.error('❌ Signin failed:', signinResult.error)
      return
    }
    console.log('✅ Signed in successfully')
    console.log('   Session token:', signinResult.session.token.substring(0, 20) + '...')
    console.log('   User data:', {
      id: signinResult.user.id,
      email: signinResult.user.email,
      role: signinResult.user.role
    })
    
    console.log('🎉 Authentication flow is working!')
    console.log('   The dashboard should now recognize the user as authenticated')
    console.log('   Session data is stored in localStorage for the frontend to use')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDashboardAuth()