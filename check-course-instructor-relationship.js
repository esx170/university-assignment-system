const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCourseInstructorRelationship() {
  console.log('🔍 Checking Course-Instructor Relationship...\n');

  try {
    // Check courses table structure
    console.log('1. Checking courses table structure...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(3);

    if (coursesError) {
      console.log('❌ Error accessing courses:', coursesError.message);
    } else {
      console.log(`Found ${courses?.length || 0} courses. Sample structure:`);
      if (courses && courses.length > 0) {
        const sampleCourse = courses[0];
        console.log('Course columns:');
        Object.keys(sampleCourse).forEach(key => {
          console.log(`  ${key}: ${sampleCourse[key]} (${typeof sampleCourse[key]})`);
        });
      }
    }

    // Check if there's an instructor_id column in courses
    console.log('\n2. Checking instructor assignments in courses...');
    const { data: coursesWithInstructor, error: instructorError } = await supabase
      .from('courses')
      .select('id, name, code, instructor_id, department_id')
      .order('name');

    if (instructorError) {
      console.log('❌ Error checking instructor assignments:', instructorError.message);
    } else {
      console.log(`Found ${coursesWithInstructor?.length || 0} courses:`);
      coursesWithInstructor?.forEach(course => {
        console.log(`  ${course.code} - ${course.name}`);
        console.log(`    Instructor ID: ${course.instructor_id || 'NULL'}`);
        console.log(`    Department ID: ${course.department_id || 'NULL'}`);
      });
    }

    // Check instructors and their potential course assignments
    console.log('\n3. Checking current instructors...');
    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, department_id')
      .eq('role', 'instructor');

    if (instructorsError) {
      console.log('❌ Error fetching instructors:', instructorsError.message);
    } else {
      console.log(`Found ${instructors?.length || 0} instructors:`);
      
      for (const instructor of instructors || []) {
        console.log(`\n  ${instructor.full_name} (${instructor.email})`);
        console.log(`    Department ID: ${instructor.department_id}`);
        
        // Check courses assigned to this instructor
        const { data: assignedCourses, error: assignedError } = await supabase
          .from('courses')
          .select('id, name, code, department_id')
          .eq('instructor_id', instructor.id);

        if (assignedError) {
          console.log(`    ❌ Error checking assigned courses: ${assignedError.message}`);
        } else {
          console.log(`    Assigned courses: ${assignedCourses?.length || 0}`);
          assignedCourses?.forEach(course => {
            console.log(`      - ${course.code}: ${course.name}`);
          });
        }

        // Check courses in instructor's department
        if (instructor.department_id) {
          const { data: deptCourses, error: deptCoursesError } = await supabase
            .from('courses')
            .select('id, name, code, instructor_id')
            .eq('department_id', instructor.department_id);

          if (!deptCoursesError && deptCourses) {
            console.log(`    Department courses: ${deptCourses.length}`);
            deptCourses.forEach(course => {
              const isAssigned = course.instructor_id === instructor.id;
              console.log(`      - ${course.code}: ${course.name} ${isAssigned ? '(ASSIGNED)' : '(unassigned)'}`);
            });
          }
        }
      }
    }

    // Check if there's a separate instructor_courses table
    console.log('\n4. Checking for instructor_courses relationship table...');
    try {
      const { data: instructorCourses, error: relError } = await supabase
        .from('instructor_courses')
        .select('*')
        .limit(1);

      if (relError) {
        console.log('❌ instructor_courses table does not exist:', relError.message);
      } else {
        console.log('✅ instructor_courses table exists');
        console.log('Sample structure:', instructorCourses?.[0] || 'No data');
      }
    } catch (error) {
      console.log('❌ instructor_courses table does not exist');
    }

    // Summary
    console.log('\n5. Summary:');
    console.log('Current course-instructor relationship model:');
    if (coursesWithInstructor && coursesWithInstructor.length > 0) {
      const hasInstructorId = coursesWithInstructor.some(c => c.instructor_id !== null);
      if (hasInstructorId) {
        console.log('✅ Courses have instructor_id column (one-to-many: one instructor per course)');
      } else {
        console.log('⚠️ Courses have instructor_id column but no assignments made');
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkCourseInstructorRelationship();