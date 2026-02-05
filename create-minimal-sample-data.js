const { createClient } = require('@supabase/supabase-js');

async function createMinimalSampleData() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Creating Minimal Sample Data...\n');

  try {
    // Step 1: Get an instructor to use for courses
    console.log('1. Getting instructor profiles...');
    
    const { data: instructors } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'instructor');

    console.log(`   Found ${instructors?.length || 0} instructors`);

    if (!instructors || instructors.length === 0) {
      console.log('   Creating a sample instructor...');
      const { data: newInstructor, error: instructorError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: 'instructor@university.edu',
          full_name: 'Dr. Sample Instructor',
          role: 'instructor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (instructorError) {
        console.log('   ❌ Could not create instructor:', instructorError.message);
        return;
      } else {
        instructors.push(newInstructor);
        console.log('   ✅ Created sample instructor');
      }
    }

    // Step 2: Create courses with minimal required fields
    console.log('\n2. Creating courses with minimal fields...');
    
    const instructor = instructors[0];
    
    // Try different combinations to find what works
    const courseAttempts = [
      // Attempt 1: Just required fields
      {
        name: 'Introduction to Programming',
        code: 'CS101',
        instructor_id: instructor.id
      },
      // Attempt 2: Add more common fields
      {
        name: 'Data Structures',
        code: 'CS201',
        instructor_id: instructor.id,
        semester: 'Fall',
        year: 2024
      }
    ];

    let successfulCourses = [];
    
    for (const courseData of courseAttempts) {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (courseError) {
        console.log(`   ❌ Course creation failed: ${courseError.message}`);
      } else {
        successfulCourses.push(course);
        console.log(`   ✅ Created course: ${course.code} - ${course.name}`);
      }
    }

    // Step 3: Create assignments with minimal required fields
    console.log('\n3. Creating assignments...');
    
    if (successfulCourses.length > 0) {
      const assignmentAttempts = [
        // Attempt 1: Just required fields
        {
          title: 'Programming Assignment 1',
          course_id: successfulCourses[0].id
        },
        // Attempt 2: Add instructor_id if required
        {
          title: 'Programming Assignment 2',
          course_id: successfulCourses[0].id,
          instructor_id: instructor.id
        }
      ];

      for (const assignmentData of assignmentAttempts) {
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (assignmentError) {
          console.log(`   ❌ Assignment creation failed: ${assignmentError.message}`);
        } else {
          console.log(`   ✅ Created assignment: ${assignment.title}`);
        }
      }
    }

    // Step 4: Test the admin user view API
    console.log('\n4. Testing admin user view API...');
    
    // Sign in as admin first
    const signinResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    if (signinResponse.ok) {
      const signinResult = await signinResponse.json();
      
      // Test the users API
      const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${signinResult.session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log(`   ✅ Admin API working - found ${users.length} users`);
        
        // Check if any user has course/assignment data
        const userWithData = users.find(u => 
          (u.assigned_courses && u.assigned_courses.length > 0) ||
          (u.assignments && u.assignments.length > 0)
        );
        
        if (userWithData) {
          console.log('   ✅ Found user with course/assignment data');
          console.log(`      - Courses: ${userWithData.assigned_courses?.length || 0}`);
          console.log(`      - Assignments: ${userWithData.assignments?.length || 0}`);
        } else {
          console.log('   ⚠️  No users have course/assignment data yet');
        }
      } else {
        console.log('   ❌ Admin API test failed');
      }
    } else {
      console.log('   ❌ Admin signin failed');
    }

    console.log('\n🎉 Minimal Sample Data Creation Complete!');
    console.log('\nNext steps:');
    console.log('1. Check the View button in admin user management');
    console.log('2. Verify that course and assignment data appears');
    console.log('3. If department_id column exists, users will show department info');

  } catch (error) {
    console.error('❌ Error creating minimal sample data:', error.message);
  }
}

createMinimalSampleData();