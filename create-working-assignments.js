const { createClient } = require('@supabase/supabase-js');

async function createWorkingAssignments() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Creating Working Assignments...\n');

  try {
    // Step 1: Get existing courses
    console.log('1. Getting existing courses...');
    
    const { data: courses } = await supabase
      .from('courses')
      .select('*');

    console.log(`   Found ${courses?.length || 0} courses`);
    
    if (!courses || courses.length === 0) {
      console.log('   No courses found - creating a sample course first...');
      
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'instructor')
        .limit(1);

      if (instructors && instructors.length > 0) {
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            name: 'Programming Fundamentals',
            code: 'CS100',
            semester: 'Fall',
            year: 2024,
            instructor_id: instructors[0].id
          })
          .select()
          .single();

        if (courseError) {
          console.log('   ❌ Could not create course:', courseError.message);
          return;
        } else {
          courses.push(newCourse);
          console.log('   ✅ Created sample course');
        }
      }
    }

    // Step 2: Create assignments with required fields only
    console.log('\n2. Creating assignments with required fields...');
    
    if (courses && courses.length > 0) {
      const assignmentsToCreate = [
        {
          title: 'Hello World Program',
          description: 'Write your first program',
          course_id: courses[0].id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 10
        },
        {
          title: 'Variables and Data Types',
          description: 'Practice with different data types',
          course_id: courses[0].id,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 15
        }
      ];

      let createdCount = 0;
      
      for (const assignmentData of assignmentsToCreate) {
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (assignmentError) {
          console.log(`   ❌ Assignment creation failed: ${assignmentError.message}`);
        } else {
          createdCount++;
          console.log(`   ✅ Created: ${assignment.title} (${assignment.max_points} pts)`);
        }
      }

      console.log(`   Total assignments created: ${createdCount}`);
    }

    // Step 3: Verify data exists
    console.log('\n3. Verifying created data...');
    
    const { data: finalCourses } = await supabase
      .from('courses')
      .select('*');
    
    const { data: finalAssignments } = await supabase
      .from('assignments')
      .select('*');

    console.log(`   ✅ Total courses in database: ${finalCourses?.length || 0}`);
    console.log(`   ✅ Total assignments in database: ${finalAssignments?.length || 0}`);

    if (finalCourses && finalCourses.length > 0) {
      console.log('   📚 Courses:');
      finalCourses.forEach(course => {
        console.log(`      - ${course.code}: ${course.name}`);
      });
    }

    if (finalAssignments && finalAssignments.length > 0) {
      console.log('   📝 Assignments:');
      finalAssignments.forEach(assignment => {
        console.log(`      - ${assignment.title} (${assignment.max_points} pts)`);
      });
    }

    console.log('\n🎉 Working Assignments Created!');
    console.log('\nThe Admin User View should now show:');
    console.log('- Course information for instructors');
    console.log('- Assignment data linked to courses');
    console.log('- User details with active status (if is_active column exists)');
    console.log('\n🔍 Next: Test the View button in the admin interface');

  } catch (error) {
    console.error('❌ Error creating working assignments:', error.message);
  }
}

createWorkingAssignments();