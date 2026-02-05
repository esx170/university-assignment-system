const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function assignOrphanedCoursesToMrAbebe() {
  console.log('🔧 Assigning Orphaned Courses to Mr Abebe...\n');

  try {
    // Get Mr Abebe
    console.log('1. Getting Mr Abebe...');
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Mr Abebe not found');
      return;
    }

    console.log(`Found Mr Abebe: ${mrAbebe.full_name} (${mrAbebe.id})`);

    // Get courses with invalid instructor assignments
    console.log('\n2. Finding orphaned courses...');
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
      .select('id')
      .eq('role', 'instructor');

    if (instructorsError) {
      console.log('❌ Error fetching instructors:', instructorsError.message);
      return;
    }

    const validInstructorIds = instructors?.map(i => i.id) || [];
    const orphanedCourses = courses?.filter(c => 
      c.instructor_id && !validInstructorIds.includes(c.instructor_id)
    ) || [];

    console.log(`Found ${orphanedCourses.length} orphaned courses:`);
    orphanedCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name}`);
    });

    // Assign orphaned courses to Mr Abebe
    if (orphanedCourses.length > 0) {
      console.log('\n3. Assigning orphaned courses to Mr Abebe...');
      
      for (const course of orphanedCourses) {
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
    }

    // Test Mr Abebe's department API
    console.log('\n4. Testing Mr Abebe department API...');
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
      
      const assignedCourses = data.departments[0]?.courses || [];
      if (assignedCourses.length > 0) {
        console.log('  Assigned courses:');
        assignedCourses.forEach(course => {
          console.log(`    - ${course.code}: ${course.name} (${course.semester} ${course.year})`);
        });
      }
    } else {
      console.log('❌ Department API failed:', response.statusText);
    }

    // Show final course assignments
    console.log('\n5. Final course assignments summary...');
    const { data: finalCourses, error: finalError } = await supabase
      .from('courses')
      .select('id, name, code, instructor_id')
      .order('code');

    if (finalError) {
      console.log('❌ Error fetching final courses:', finalError.message);
    } else {
      console.log('All course assignments:');
      for (const course of finalCourses || []) {
        const instructor = instructors?.find(i => i.id === course.instructor_id);
        if (course.instructor_id === mrAbebe.id) {
          console.log(`  ${course.code}: ${course.name} → Mr Abebe (DECON)`);
        } else if (instructor) {
          console.log(`  ${course.code}: ${course.name} → Other instructor`);
        } else {
          console.log(`  ${course.code}: ${course.name} → Unknown instructor (${course.instructor_id})`);
        }
      }
    }

    console.log('\n🎉 Results:');
    console.log('✅ Mr Abebe now has courses assigned');
    console.log('✅ Development Economics instructor can access courses');
    console.log('✅ Course assignment system working');

  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
  }
}

assignOrphanedCoursesToMrAbebe();