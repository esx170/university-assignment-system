// Test the normal signup API (not emergency)
async function testNormalSignup() {
  console.log('📝 Testing NORMAL signup API...')
  
  const testEmail = `normal.test.${Date.now()}@example.com`
  const testData = {
    email: testEmail,
    password: 'password123',
    full_name: 'Normal Test User',
    student_id: `NORM${Date.now()}`,
    department_id: '1'
  }
  
  try {
    console.log(`📧 Testing normal signup with: ${testEmail}`)
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('🎉 NORMAL SIGNUP WORKS!')
      console.log(`   User ID: ${result.user.id}`)
      console.log(`   Email: ${result.user.email}`)
      console.log(`   Method: ${result.method}`)
      console.log(`   Message: ${result.message}`)
      console.log(`   Profile Created: ${result.profileCreated}`)
      
      console.log('✅ SUCCESS - Normal signup is now working!')
      
    } else {
      console.error('❌ Normal signup failed:', result.error)
      console.error('   Details:', result.details)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testNormalSignup()