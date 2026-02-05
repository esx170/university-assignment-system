// Quick test script to verify signup works
const { createClient } = require('@supabase/supabase-js')

async function testSignup() {
  console.log('🧪 Testing restored signup functionality...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const testEmail = `test.restored.${Date.now()}@example.com`
  const testPassword = 'password123'
  
  try {
    console.log(`📧 Testing signup with: ${testEmail}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Restored User',
          role: 'student',
          student_id: `RESTORED${Date.now()}`,
          department_id: '1'
        }
      }
    })
    
    if (error) {
      console.error('❌ Signup failed:', error.message)
      return
    }
    
    if (data.user) {
      console.log('✅ Auth user created successfully!')
      console.log(`   User ID: ${data.user.id}`)
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Needs confirmation: ${!data.session}`)
      
      // Wait a moment for trigger to process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        console.log('✅ Profile created by trigger!')
        console.log(`   Profile ID: ${profile.id}`)
        console.log(`   Full Name: ${profile.full_name}`)
        console.log(`   Role: ${profile.role}`)
        console.log(`   Student ID: ${profile.student_id}`)
      } else {
        console.log('⚠️  Profile not found:', profileError?.message)
      }
      
    } else {
      console.error('❌ No user returned from signup')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSignup()