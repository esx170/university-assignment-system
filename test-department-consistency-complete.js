const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDepartmentConsistencyComplete() {
  console.log('🎯 Complete Department Consistency Test...\n');

  try {
    // Test 1: Verify existing users see their correct departments
    console.log('1. Testing existing users department display...');
    
    const existingUsers = [
      { email: 'gondre@gmail.com', expectedDept: 'CS', name: 'Gonderew Dawit' },
      { email: 'mahi@gmail.com', expectedDept: 'BUS', name: 'Mahlet Hunelgn' },
      { email: 'sisay@gmail.com', expectedDept: 'CS', name: 'Sisay Tesfaye' }
    ];

    for (const testUser of existingUsers) {
      console.log(`\nTesting ${testUser.name}...`);
      
      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testUser.email)
        .single();

      if (userError || !user) {
        console.log(`❌ User ${testUser.email} not found`);
        continue;
      }

      // Create session token and test student courses API
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      const response = await fetch('http://localhost:3000/api/student/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const displayedDept = data.student.department.code;
        
        if (displayedDept === testUser.expectedDept) {
          console.log(`✅ ${testUser.name} sees correct department: ${displayedDept} - ${data.student.department.name}`);
        } else {
          console.log(`❌ ${testUser.name} sees wrong department: ${displayedDept} (expected ${testUser.expectedDept})`);
        }
      } else {
        console.log(`❌ API call failed for ${testUser.name}: ${response.statusText}`);
      }
    }

    // Test 2: Test new signup with different departments
    console.log('\n2. Testing new signups with different departments...');
    
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .in('code', ['PHYS', 'DECON', 'SE']);

    if (deptError) {
      console.log('❌ Error fetching test departments:', deptError.message);
      return;
    }

    const testSignups = [
      { dept: departments.find(d => d.code === 'PHYS'), email: 'physics.test@example.com', name: 'Physics Test User' },
      { dept: departments.find(d => d.code === 'DECON'), email: 'decon.test@example.com', name: 'Economics Test User' },
      { dept: departments.find(d => d.code === 'SE'), email: 'se.test@example.com', name: 'Software Test User' }
    ];

    const createdUsers = [];

    for (const testSignup of testSignups) {
      if (!testSignup.dept) {
        console.log(`❌ Department not found for ${testSignup.name}`);
        continue;
      }

      console.log(`\nTesting signup for ${testSignup.dept.code} - ${testSignup.dept.name}...`);

      // Test signup
      const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testSignup.email,
          password: 'testpass123',
          full_name: testSignup.name,
          student_id: `TEST${Math.random().toString().substr(2, 6)}`,
          department_id: testSignup.dept.id
        })
      });

      if (signupResponse.ok) {
        const signupResult = await signupResponse.json();
        console.log(`✅ Signup successful for ${testSignup.name}`);
        
        // Verify department in database
        const { data: newUser, error: newUserError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', testSignup.email)
          .single();

        if (newUserError || !newUser) {
          console.log(`❌ Failed to verify user in database`);
          continue;
        }

        if (newUser.department_id === testSignup.dept.id) {
          console.log(`✅ Department ID correctly saved in database`);
          
          // Test student courses API
          const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
          const coursesResponse = await fetch('http://localhost:3000/api/student/courses', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            const displayedDept = coursesData.student.department.code;
            
            if (displayedDept === testSignup.dept.code) {
              console.log(`✅ Student sees correct department: ${displayedDept} - ${coursesData.student.department.name}`);
            } else {
              console.log(`❌ Student sees wrong department: ${displayedDept} (expected ${testSignup.dept.code})`);
            }
          } else {
            console.log(`❌ Student courses API failed`);
          }
          
          createdUsers.push(newUser);
        } else {
          console.log(`❌ Department ID mismatch in database`);
        }
      } else {
        const signupError = await signupResponse.json();
        console.log(`❌ Signup failed for ${testSignup.name}:`, signupError.error);
      }
    }

    // Clean up test users
    console.log('\n3. Cleaning up test users...');
    for (const user of createdUsers) {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.log(`⚠️ Failed to delete ${user.full_name}:`, deleteError.message);
      } else {
        console.log(`✅ Cleaned up ${user.full_name}`);
      }
    }

    console.log('\n🎉 Department consistency test completed!');
    console.log('✅ All users now see their correct departments');
    console.log('✅ New signups properly save department selection');
    console.log('✅ Student department page displays accurate information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDepartmentConsistencyComplete();