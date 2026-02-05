const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUnassignedCoursesForTesting() {
  console.log('🎯 Creating Unassigned Courses for Testing...\n');

  try {
    // Get an existing instructor to use as temporary placeholder
    console.log('1. Getting existing instructor for temporary assignment...');
    const { data: existingInstructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'instructor')
      .limit(1)
      .single();

    if (instructorError || !existingInstructor) {
      console.log('❌ No existing instructor found');
      return;
    }

    console.log(`Using ${existingInstructor.full_name} as temporary placeholder`);

    // Create sample courses for different departments
    console.log('\n2. Creating sample courses...');
    
    const sampleCourses = [
      {
        code: 'SE301',
        name: 'Advanced Software Engineering',
        semester: 'Fall',
        year: 2025,
        instructor_id: existingInstructor.id // Temporary - will be available for reassignment
      },
      {
        code: 'SE401',
        name: 'Software Project Management',
        semester: 'Spring',
        year: 2025,
        instructor_id: existingInstructor.id
      },
      {
        code: 'BUS201',
        name: 'Business Analytics',
        semester: 'Fall',
        year: 2025,
        instructor_id: existingInstructor.id
      },
      {
        code: 'PHYS101',
        name: 'Introduction to Physics',
        semester: 'Fall',
        year: 2025,
        instructor_id: existingInstructor.id
      },
      {
        code: 'MATH201',
        name: 'Calculus II',
        semester: 'Spring',
        year: 2025,
        instructor_id: existingInstructor.id
      }
    ];

    const createdCourses = [];
    for (const course of sampleCourses) {
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

      if (courseError) {
        console.log(`❌ Failed to create ${course.code}:`, courseError.message);
      } else {
        console.log(`✅ Created: ${newCourse.code} - ${newCourse.name}`);
        createdCourses.push(newCourse);
      }
    }

    console.log(`\n✅ Created ${createdCourses.length} new courses`);

    // Show current course status
    console.log('\n3. Current course assignment status:');
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, code, name, instructor_id')
      .order('code');

    if (coursesError) {
      console.log('❌ Error fetching courses:', coursesError.message);
    } else {
      console.log(`Total courses: ${allCourses?.length || 0}`);
      
      // Get instructor names for display
      const { data: instructors, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'instructor');

      if (!instructorsError && instructors) {
        const instructorMap = {};
        instructors.forEach(inst => {
          instructorMap[inst.id] = inst.full_name;
        });

        console.log('\nCourse assignments:');
        allCourses?.forEach(course => {
          const instructorName = instructorMap[course.instructor_id] || 'Unknown';
          console.log(`  ${course.code}: ${course.name} → ${instructorName}`);
        });
      }
    }

    console.log('\n🎉 READY FOR TESTING!');
    console.log('');
    console.log('Now you can test the instructor creation workflow:');
    console.log('1. 🔄 Refresh your browser (Ctrl+F5)');
    console.log('2. 🔄 Or restart development server if needed');
    console.log('3. 📝 Go to Admin → User Management → Create User');
    console.log('4. 👨‍🏫 Select Role: "Instructor"');
    console.log('5. 🏢 Select any Department');
    console.log('6. 📚 Course assignment section should now appear!');
    console.log('');
    console.log('Available courses for assignment:');
    createdCourses.forEach(course => {
      console.log(`  ✅ ${course.code}: ${course.name}`);
    });

  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  }
}

createUnassignedCoursesForTesting();