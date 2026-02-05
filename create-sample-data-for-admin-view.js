const { createClient } = require('@supabase/supabase-js');

async function createSampleDataForAdminView() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Creating Sample Data for Admin View...\n');

  try {
    // Step 1: Get departments and create instructor profiles if needed
    console.log('1. Getting departments and creating instructor profiles...');
    
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .limit(3);

    if (!departments || departments.length === 0) {
      console.log('   ❌ No departments found');
      return;
    }

    console.log(`   ✅ Found ${departments.length} departments`);

    // Create instructor profiles for courses
    const instructors = [
      {
        id: crypto.randomUUID(),
        email: 'prof.smith@university.edu',
        full_name: 'Dr. John Smith',
        role: 'instructor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        email: 'prof.johnson@university.edu',
        full_name: 'Dr. Sarah Johnson',
        role: 'instructor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Check if instructors already exist
    const { data: existingInstructors } = await supabase
      .from('profiles')
      .select('email')
      .in('email', instructors.map(i => i.email));

    const newInstructors = instructors.filter(i => 
      !existingInstructors?.some(ei => ei.email === i.email)
    );

    if (newInstructors.length > 0) {
      const { error: instructorError } = await supabase
        .from('profiles')
        .insert(newInstructors);

      if (instructorError) {
        console.log('   ⚠️  Could not create instructors:', instructorError.message);
      } else {
        console.log(`   ✅ Created ${newInstructors.length} instructor profiles`);
      }
    }

    // Get all instructors (existing + new)
    const { data: allInstructors } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'instructor');

    // Step 2: Create courses with proper schema
    console.log('\n2. Creating sample courses...');
    
    const sampleCourses = [
      {
        id: crypto.randomUUID(),
        name: 'Introduction to Programming',
        code: 'CS101',
        description: 'Basic programming concepts and problem solving',
        credits: 3,
        semester: 'Fall',
        year: 2024,
        department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id,
        instructor_id: allInstructors?.[0]?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced data structures and algorithmic thinking',
        credits: 4,
        semester: 'Spring',
        year: 2024,
        department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id,
        instructor_id: allInstructors?.[0]?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Calculus I',
        code: 'MATH101',
        description: 'Differential and integral calculus',
        credits: 4,
        semester: 'Fall',
        year: 2024,
        department_id: departments.find(d => d.code === 'MATH')?.id || departments[1]?.id || departments[0].id,
        instructor_id: allInstructors?.[1]?.id || allInstructors?.[0]?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .upsert(sampleCourses, { onConflict: 'code,semester,year' })
      .select();

    if (coursesError) {
      console.log('   ❌ Courses creation failed:', coursesError.message);
    } else {
      console.log(`   ✅ Created ${courses?.length || 0} sample courses`);
      courses?.forEach(course => {
        console.log(`      - ${course.code}: ${course.name}`);
      });
    }

    // Step 3: Create assignments with proper schema
    console.log('\n3. Creating sample assignments...');
    
    if (courses && courses.length > 0 && allInstructors && allInstructors.length > 0) {
      const sampleAssignments = [
        {
          id: crypto.randomUUID(),
          title: 'Hello World Program',
          description: 'Write your first program that prints "Hello, World!"',
          course_id: courses.find(c => c.code === 'CS101')?.id || courses[0].id,
          instructor_id: allInstructors[0].id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 10,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          title: 'Binary Search Implementation',
          description: 'Implement binary search algorithm in your preferred language',
          course_id: courses.find(c => c.code === 'CS201')?.id || courses[1]?.id || courses[0].id,
          instructor_id: allInstructors[0].id,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 25,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          title: 'Derivative Calculations',
          description: 'Solve calculus problems involving derivatives',
          course_id: courses.find(c => c.code === 'MATH101')?.id || courses[2]?.id || courses[0].id,
          instructor_id: allInstructors[1]?.id || allInstructors[0].id,
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 20,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .upsert(sampleAssignments, { onConflict: 'title' })
        .select();

      if (assignmentsError) {
        console.log('   ❌ Assignments creation failed:', assignmentsError.message);
      } else {
        console.log(`   ✅ Created ${assignments?.length || 0} sample assignments`);
        assignments?.forEach(assignment => {
          console.log(`      - ${assignment.title} (${assignment.max_points} pts)`);
        });
      }
    }

    // Step 4: Create some course enrollments for students
    console.log('\n4. Creating course enrollments for students...');
    
    const { data: students } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'student')
      .limit(5);

    if (students && students.length > 0 && courses && courses.length > 0) {
      const enrollments = [];
      
      // Enroll each student in 1-2 courses
      students.forEach((student, index) => {
        const coursesToEnroll = courses.slice(0, 2); // First 2 courses
        coursesToEnroll.forEach(course => {
          enrollments.push({
            id: crypto.randomUUID(),
            course_id: course.id,
            student_id: student.id,
            enrolled_at: new Date().toISOString()
          });
        });
      });

      const { data: createdEnrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .upsert(enrollments, { onConflict: 'course_id,student_id' })
        .select();

      if (enrollmentError) {
        console.log('   ❌ Enrollments creation failed:', enrollmentError.message);
      } else {
        console.log(`   ✅ Created ${createdEnrollments?.length || 0} course enrollments`);
      }
    }

    console.log('\n🎉 Sample Data Creation Complete!');
    console.log('\nSummary:');
    console.log(`- ✅ Instructor profiles: ${allInstructors?.length || 0}`);
    console.log(`- ✅ Sample courses: ${courses?.length || 0}`);
    console.log(`- ✅ Sample assignments: ${courses && allInstructors ? '3' : '0'}`);
    console.log('- ✅ Course enrollments for students');
    console.log('\nThe Admin User View should now show:');
    console.log('- Courses assigned to instructors');
    console.log('- Assignments created by instructors');
    console.log('- Course enrollments for students');
    console.log('- Department information (if department_id column exists)');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
}

createSampleDataForAdminView();