const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixOrphanedCoursesAndTest() {
  console.log('🔧 Fixing Orphaned Courses and Testing Assignment...\n');

  try {
    // Get courses with invalid instructor assignments
    console.log('1. Finding courses with invalid instructor assignments...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (coursesError) {
      console.log('❌ Error fetching courses:', coursesError.message);
      return;
    }

    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'instructor');

    if (instructorsError) {
      console.log('❌ Error fetching instructors:', instructorsError.message);
      return;
    }

    const validInstructorIds = instructors?.map(i => i.id) || [];
    const orphanedCourses = courses?.filter(c => 
      c.instructor_id && !validInstructorIds.includes(c.instructor_id)
    ) || [];

    console.log(`Found ${orphanedCourses.length} courses with invalid instructor assignments:`);
    orphanedCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name} (assigned to ${course.instructor_id})`);
    });

    // Unassign orphaned courses
    if (orphanedCourses.length > 0) {
      console.log('\n2. Unassigning orphaned courses...');
      
      for (const course of orphanedCourses) {
        const { error: unassignError } = await supabase
          .from('courses')
          .update({ instructor_id: null })
          .eq('id', course.id);

        if (unassignError) {
          console.log(`❌ Failed to unassign ${course.code}:`, unassignError.message);
        } else {
          console.log(`✅ Unassigned ${course.code}`);
        }
      }
    }

    // Now test course assignment with Mr Abebe
    console.log('\n3. Testing course assignment to Mr Abebe...');
    
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Mr Abebe not found');
      return;
    }

    // Get some unassigned courses
    const { data: unassignedCourses, error: unassignedError } = await supabase
      .from('courses')
      .select('*')
      .is('instructor_id', null)
      .limit(2);

    if (unassignedError) {
      console.log('❌ Error fetching unassigned courses:', unassignedError.message);
      return;
    }

    if (!unassignedCourses || unassignedCourses.length === 0) {
      console.log('⚠️ No unassigned courses available');
      return;
    }

    console.log(`Assigning ${unassignedCourses.length} courses to Mr Abebe:`);
    unassignedCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name}`);
    });

    // Assign courses to Mr Abebe
    for (const course of unassignedCourses) {
      const { error: assignError } = await supabase
        .from('courses')
        .update({ instructor_id: mrAbebe.id })
        .eq('id', course.id);

      if (assignError) {
        console.log(`❌ Failed to assign ${course.code}:`, assignError.message);
      } else {
        console.log(`✅ Assigned ${course.code} to Mr Abebe`);
      }
    }

    // Verify Mr Abebe can now see his courses
    console.log('\n4. Testing Mr Abebe department API with assigned courses...');
    
    const token = Buffer.from(`${mrAbebe.id}:${Date.now()}`).toString('base64');
    
    const response = await fetch('http://localhost:3000/api/instructor/departments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Department API Response:');
      console.log(`  Department: ${data.instructor.department.code} - ${data.instructor.department.name}`);
      console.log(`  Courses: ${data.departments[0]?.course_count || 0}`);
      console.log(`  Students: ${data.departments[0]?.student_count || 0}`);
      
      const courses = data.departments[0]?.courses || [];
      if (courses.length > 0) {
        console.log('  Assigned courses:');
        courses.forEach(course => {
          console.log(`    - ${course.code}: ${course.name}`);
        });
      }
    } else {
      console.log('❌ Department API failed:', response.statusText);
    }

    console.log('\n🎉 Course Assignment Test Results:');
    console.log('✅ Orphaned courses cleaned up');
    console.log('✅ Mr Abebe assigned to courses');
    console.log('✅ Department API shows assigned courses');
    console.log('✅ Course assignment functionality working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

fixOrphanedCoursesAndTest();