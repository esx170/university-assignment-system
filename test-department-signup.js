const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDepartmentSignup() {
  console.log('🧪 Testing Department Signup Fix...\n');

  try {
    // First, get available departments
    console.log('1. Getting available departments...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error fetching departments:', deptError.message);
      return;
    }

    console.log('Available departments:');
    departments?.forEach(dept => {
      console.log(`  ${dept.id}: ${dept.code} - ${dept.name}`);
    });

    // Test signup with Software Engineering department
    const seDept = departments?.find(d => d.code === 'SE');
    if (!seDept) {
      console.log('❌ Software Engineering department not found');
      return;
    }

    console.log(`\n2. Testing signup with department: ${seDept.code} - ${seDept.name}`);
    console.log(`   Department ID: ${seDept.id}`);

    // Test the signup API
    const signupData = {
      email: 'test.department@example.com',
      password: 'testpass123',
      full_name: 'Test Department User',
      student_id: 'TEST001',
      department_id: seDept.id
    };

    console.log('\n3. Calling signup API...');
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup successful!');
      console.log('Response:', result);

      // Verify the user was created with correct department_id
      console.log('\n4. Verifying user in database...');
      const { data: newUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', signupData.email)
        .single();

      if (userError) {
        console.log('❌ Error fetching created user:', userError.message);
      } else {
        console.log('✅ User found in database:');
        console.log(`   Name: ${newUser.full_name}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Student ID: ${newUser.student_id}`);
        console.log(`   Department ID: ${newUser.department_id}`);
        
        if (newUser.department_id === seDept.id) {
          console.log('✅ Department ID correctly saved!');
        } else {
          console.log('❌ Department ID mismatch!');
          console.log(`   Expected: ${seDept.id}`);
          console.log(`   Got: ${newUser.department_id}`);
        }

        // Test the student courses API
        console.log('\n5. Testing student courses API...');
        
        // Create a custom session token
        const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
        
        const coursesResponse = await fetch('http://localhost:3000/api/student/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log('✅ Student courses API successful!');
          console.log(`   Department shown: ${coursesData.student.department.code} - ${coursesData.student.department.name}`);
          
          if (coursesData.student.department.code === seDept.code) {
            console.log('✅ Correct department displayed!');
          } else {
            console.log('❌ Wrong department displayed!');
          }
        } else {
          console.log('❌ Student courses API failed:', coursesResponse.statusText);
        }

        // Clean up - delete test user
        console.log('\n6. Cleaning up test user...');
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('email', signupData.email);

        if (deleteError) {
          console.log('⚠️ Failed to delete test user:', deleteError.message);
        } else {
          console.log('✅ Test user cleaned up');
        }
      }
    } else {
      console.log('❌ Signup failed:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDepartmentSignup();