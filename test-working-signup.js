// Test the working signup API
async function testWorkingSignup() {
  console.log('🧪 Testing WORKING signup API...')
  
  const testEmail = `working.test.${Date.now()}@example.com`
  const testData = {
    email: testEmail,
    password: 'password123',
    full_name: 'Working Test User',
    student_id: `WORK${Date.now()}`,
    department_id: '1'
  }
  
  try {
    console.log(`📧 Testing signup with: ${testEmail}`)
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ SIGNUP WORKS!')
      console.log(`   User ID: ${result.user.id}`)
      console.log(`   Email: ${result.user.email}`)
      console.log(`   Profile Created: ${result.profileCreated}`)
      console.log(`   Message: ${result.message}`)
      
      // Test signin
      console.log('🔐 Testing signin...')
      
      const signinResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'password123'
        })
      })
      
      if (signinResponse.ok) {
        console.log('✅ SIGNIN ALSO WORKS!')
        console.log('🎉 COMPLETE SUCCESS - Signup system is FIXED!')
      } else {
        const signinError = await signinResponse.json()
        console.log('⚠️  Signup works but signin has issues:', signinError.error)
      }
      
    } else {
      console.error('❌ Signup failed:', result.error)
      console.error('   Details:', result.details)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWorkingSignup()