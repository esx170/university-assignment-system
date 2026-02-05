const BASE_URL = 'http://localhost:3000';

async function createSampleData() {
  console.log('🧪 Creating Sample Data for Testing...\n');

  try {
    // Step 1: Sign in as admin
    console.log('1. Signing in as admin...');
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

    const authHeaders = {
      'Authorization': `Bearer ${signinResult.session.token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get departments
    console.log('\n2. Getting departments...');
    const deptResponse = await fetch(`${BASE_URL}/api/departments`, {
      headers: authHeaders
    });

    if (!deptResponse.ok) {
      console.error('❌ Failed to get departments');
      return;
    }

    const departments = await deptResponse.json();
    console.log(`✅ Found ${departments.length} departments`);

    if (departments.length === 0) {
      console.log('❌ No departments found - cannot create courses');
      return;
    }

    // Step 3: Create sample courses
    console.log('\n3. Creating sample courses...');
    const sampleCourses = [
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Basic concepts of computer science and programming',
        credits: 3,
        semester: 'Fall',
        year: 2024,
        department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced data structures and algorithm design',
        credits: 4,
        semester: 'Spring',
        year: 2024,
        department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id
      },
      {
        name: 'Calculus I',
        code: 'MATH101',
        description: 'Introduction to differential calculus',
        credits: 4,
        semester: 'Fall',
        year: 2024,
        department_id: departments.find(d => d.code === 'MATH')?.id || departments[1]?.id || departments[0].id
      }
    ];

    const createdCourses = [];

    for (const course of sampleCourses) {
      console.log(`   Creating course: ${course.code} - ${course.name}`);
      
      const createResponse = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(course)
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log(`   ✅ Created: ${result.course.code}`);
        createdCourses.push(result.course);
      } else {
        const error = await createResponse.json();
        console.log(`   ❌ Failed to create ${course.code}: ${error.error}`);
      }
    }

    // Step 4: Create sample assignments
    console.log('\n4. Creating sample assignments...');
    
    if (createdCourses.length > 0) {
      const sampleAssignments = [
        {
          title: 'Programming Assignment 1',
          description: 'Write a simple calculator program',
          course_id: createdCourses[0].id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          max_points: 100
        },
        {
          title: 'Algorithm Analysis',
          description: 'Analyze the time complexity of sorting algorithms',
          course_id: createdCourses[1]?.id || createdCourses[0].id,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
          max_points: 150
        },
        {
          title: 'Calculus Problem Set 1',
          description: 'Solve derivative problems from chapter 3',
          course_id: createdCourses[2]?.id || createdCourses[0].id,
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          max_points: 75
        }
      ];

      for (const assignment of sampleAssignments) {
        console.log(`   Creating assignment: ${assignment.title}`);
        
        const createResponse = await fetch(`${BASE_URL}/api/assignments`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(assignment)
        });

        if (createResponse.ok) {
          const result = await createResponse.json();
          console.log(`   ✅ Created: ${result.assignment.title}`);
        } else {
          const error = await createResponse.json();
          console.log(`   ❌ Failed to create ${assignment.title}: ${error.error}`);
        }
      }
    } else {
      console.log('   ⚠️  No courses created - skipping assignments');
    }

    // Step 5: Verify the data
    console.log('\n5. Verifying created data...');
    
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
      headers: authHeaders
    });

    if (coursesResponse.ok) {
      const courses = await coursesResponse.json();
      console.log(`✅ Total courses in system: ${courses.length}`);
    }

    const assignmentsResponse = await fetch(`${BASE_URL}/api/assignments`, {
      headers: authHeaders
    });

    if (assignmentsResponse.ok) {
      const assignments = await assignmentsResponse.json();
      console.log(`✅ Total assignments in system: ${assignments.length}`);
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('You can now test the admin user management with actual course and assignment data.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

createSampleData();