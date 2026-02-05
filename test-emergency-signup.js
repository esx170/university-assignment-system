// Test the emergency signup API
async function testEmergencySignup() {
  console.log('🚨 Testing EMERGENCY signup API...')
  
  const testEmail = `emergency.test.${Date.now()}@example.com`
  const testData = {
    email: testEmail,
    password: 'password123',
    full_name: 'Emergency Test User',
    student_id: `EMRG${Date.now()}`,
    department_id: '1'
  }
  
  try {
    console.log(`📧 Testing emergency signup with: ${testEmail}`)
    
    const response = await fetch('http://localhost:3000/api/emergency-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('🎉 EMERGENCY SIGNUP WORKS!')
      console.log(`   User ID: ${result.user.id}`)
      console.log(`   Email: ${result.user.email}`)
      console.log(`   Method: ${result.method}`)
      console.log(`   Message: ${result.message}`)
      
      console.log('✅ SUCCESS - Emergency signup bypassed all Supabase auth issues!')
      
    } else {
      console.error('❌ Emergency signup failed:', result.error)
      console.error('   Details:', result.details)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testEmergencySignup()