const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentCourseAssignments() {
  console.log('🔍 Checking Current Course Assignments...\n');

  try {
    // Get all courses with their instructor assignments
    console.log('1. Getting all courses and their instructor assignments...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (coursesError) {
      console.log('❌ Error fetching courses:', coursesError.message);
      return;
    }

    console.log(`Found ${courses?.length || 0} courses:`);
    courses?.forEach(course => {
      console.log(`\n  ${course.code} - ${course.name}`);
      console.log(`    Instructor ID: ${course.instructor_id || 'NULL'}`);
      console.log(`    Semester: ${course.semester} ${course.year}`);
      console.log(`    Created: ${course.created_at}`);
    });

    // Get all instructors
    console.log('\n2. Getting all instructors...');
    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, department_id')
      .eq('role', 'instructor')
      .order('full_name');

    if (instructorsError) {
      console.log('❌ Error fetching instructors:', instructorsError.message);
      return;
    }

    console.log(`Found ${instructors?.length || 0} instructors:`);
    instructors?.forEach(instructor => {
      console.log(`  ${instructor.full_name} (${instructor.email})`);
      console.log(`    ID: ${instructor.id}`);
      console.log(`    Department ID: ${instructor.department_id}`);
    });

    // Match courses to instructors
    console.log('\n3. Course-Instructor assignments:');
    courses?.forEach(course => {
      const instructor = instructors?.find(i => i.id === course.instructor_id);
      console.log(`\n  ${course.code} - ${course.name}`);
      if (instructor) {
        console.log(`    ✅ Assigned to: ${instructor.full_name} (${instructor.email})`);
      } else if (course.instructor_id) {
        console.log(`    ❌ Assigned to unknown instructor: ${course.instructor_id}`);
      } else {
        console.log(`    ⚠️ No instructor assigned`);
      }
    });

    // Show instructor workloads
    console.log('\n4. Instructor workloads:');
    instructors?.forEach(instructor => {
      const assignedCourses = courses?.filter(c => c.instructor_id === instructor.id) || [];
      console.log(`\n  ${instructor.full_name}:`);
      console.log(`    Assigned courses: ${assignedCourses.length}`);
      assignedCourses.forEach(course => {
        console.log(`      - ${course.code}: ${course.name}`);
      });
    });

    // Check departments
    console.log('\n5. Getting departments for reference...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error fetching departments:', deptError.message);
    } else {
      console.log('Available departments:');
      departments?.forEach(dept => {
        console.log(`  ${dept.code} - ${dept.name} (${dept.id})`);
      });

      // Show which instructors are in which departments
      console.log('\n6. Instructors by department:');
      departments?.forEach(dept => {
        const deptInstructors = instructors?.filter(i => i.department_id === dept.id) || [];
        console.log(`\n  ${dept.code} - ${dept.name}:`);
        if (deptInstructors.length > 0) {
          deptInstructors.forEach(instructor => {
            const assignedCourses = courses?.filter(c => c.instructor_id === instructor.id) || [];
            console.log(`    - ${instructor.full_name} (${assignedCourses.length} courses)`);
          });
        } else {
          console.log(`    - No instructors assigned`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkCurrentCourseAssignments();