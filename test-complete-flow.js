// Test the complete signup and signin flow
async function testCompleteFlow() {
  console.log('🔄 Testing COMPLETE signup and signin flow...')
  
  const testEmail = `complete.test.${Date.now()}@example.com`
  const testPassword = 'password123'
  const testData = {
    email: testEmail,
    password: testPassword,
    full_name: 'Complete Test User',
    student_id: `COMP${Date.now()}`,
    department_id: '1'
  }
  
  try {
    // Step 1: Test Signup
    console.log(`📧 Step 1: Testing signup with: ${testEmail}`)
    
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const signupResult = await signupResponse.json()
    
    if (signupResponse.ok) {
      console.log('✅ SIGNUP SUCCESS!')
      console.log(`   User ID: ${signupResult.user.id}`)
      console.log(`   Email: ${signupResult.user.email}`)
      console.log(`   Profile Created: ${signupResult.profileCreated}`)
      
      // Step 2: Test Signin
      console.log(`🔐 Step 2: Testing signin with same credentials...`)
      
      const signinResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      })
      
      const signinResult = await signinResponse.json()
      
      if (signinResponse.ok) {
        console.log('✅ SIGNIN SUCCESS!')
        console.log(`   User ID: ${signinResult.user.id}`)
        console.log(`   Session Token: ${signinResult.session.token.substring(0, 20)}...`)
        console.log(`   Role: ${signinResult.user.role}`)
        
        console.log('🎉 COMPLETE FLOW SUCCESS!')
        console.log('   ✅ Signup works')
        console.log('   ✅ Signin works')
        console.log('   ✅ Normal /auth/signup and /auth/signin are fully functional!')
        
      } else {
        console.error('❌ Signin failed:', signinResult.error)
      }
      
    } else {
      console.error('❌ Signup failed:', signupResult.error)
      console.error('   Details:', signupResult.details)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCompleteFlow()