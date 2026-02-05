const BASE_URL = 'http://localhost:3001';

async function testStudentPages() {
  console.log('🧪 Testing Student Pages...\n');

  try {
    // Step 1: Create a new student account with department
    console.log('1. Creating new student account with department...');
    const timestamp = Date.now();
    const studentEmail = `teststudent.${timestamp}@university.edu`;
    
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'StudentPass123',
        full_name: 'Test Student With Department',
        student_id: `STU${timestamp}`,
        department_id: '1' // Computer Science
      })
    });

    const signupResult = await signupResponse.json();
    
    if (!signupResponse.ok) {
      console.error('❌ Student signup failed:', signupResult.error);
      return;
    }

    console.log('✅ Student account created:', studentEmail);

    // Step 2: Sign in as the new student
    console.log('\n2. Signing in as the new student...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'StudentPass123'
      })
    });

    const signinResult = await signinResponse.json();
    
    if (!signinResponse.ok) {
      console.error('❌ Student signin failed:', signinResult.error);
      return;
    }

    console.log('✅ Student signed in successfully');
    console.log('   Role:', signinResult.user.role);
    console.log('   Student ID:', signinResult.user.student_id);

    // Step 3: Test student courses API
    console.log('\n3. Testing student courses API...');
    const coursesResponse = await fetch(`${BASE_URL}/api/student/courses`, {
      headers: {
        'Authorization': `Bearer ${signinResult.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Student courses API working');
      console.log('   Student name:', coursesData.student.name);
      console.log('   Department:', coursesData.student.department?.name || 'No department');
      console.log('   Total courses:', coursesData.summary.total_courses);
    } else {
      const error = await coursesResponse.json();
      console.log('❌ Student courses API failed:', error.error);
    }

    // Step 4: Check if department was saved properly
    console.log('\n4. Checking if department was saved...');
    const adminSigninResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    const adminSigninResult = await adminSigninResponse.json();
    
    if (adminSigninResponse.ok) {
      const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminSigninResult.session.token}` }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        const newStudent = users.find(u => u.email === studentEmail);
        
        if (newStudent) {
          console.log('✅ Student found in database');
          console.log('   Department ID:', newStudent.department_id || 'Not saved');
          console.log('   Primary Department:', newStudent.primary_department?.name || 'Not found');
        }
      }
    }

    console.log('\n🎉 Student pages test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testStudentPages();