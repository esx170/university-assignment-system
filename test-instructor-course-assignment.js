const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testInstructorCourseAssignment() {
  console.log('🧪 Testing Instructor Course Assignment...\n');

  try {
    // Get available courses and departments
    console.log('1. Getting available courses and departments...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (coursesError) {
      console.log('❌ Error fetching courses:', coursesError.message);
      return;
    }

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('code', 'DECON')
      .single();

    if (deptError || !departments) {
      console.log('❌ Error fetching DECON department:', deptError?.message);
      return;
    }

    console.log(`Found ${courses?.length || 0} courses available`);
    console.log(`DECON Department: ${departments.name} (${departments.id})`);

    // Find unassigned courses to test with
    const unassignedCourses = courses?.filter(c => !c.instructor_id || c.instructor_id === '') || [];
    console.log(`Unassigned courses: ${unassignedCourses.length}`);
    
    if (unassignedCourses.length === 0) {
      console.log('⚠️ No unassigned courses available for testing');
      return;
    }

    // Select first 2 unassigned courses for testing
    const testCourses = unassignedCourses.slice(0, 2);
    console.log('Test courses selected:');
    testCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name}`);
    });

    // Test creating instructor with course assignments
    console.log('\n2. Testing instructor creation with course assignments...');
    
    const testInstructorData = {
      email: 'test.instructor.courses@university.edu',
      password: 'testpass123',
      full_name: 'Test Instructor With Courses',
      role: 'instructor',
      primary_department_id: departments.id,
      assigned_courses: testCourses.map(c => c.id)
    };

    console.log(`Creating instructor with ${testCourses.length} course assignments...`);

    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Buffer.from(`admin-test:${Date.now()}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testInstructorData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Instructor created successfully!');
      console.log(`User ID: ${result.user.id}`);
      console.log(`Course assignments: ${result.courseAssignments?.successful || 0}/${result.courseAssignments?.total || 0} successful`);
      
      if (result.courseAssignments?.details) {
        result.courseAssignments.details.forEach(assignment => {
          if (assignment.success) {
            console.log(`  ✅ ${assignment.courseName}`);
          } else {
            console.log(`  ❌ Course ${assignment.courseId}: ${assignment.error}`);
          }
        });
      }

      // Verify assignments in database
      console.log('\n3. Verifying course assignments in database...');
      
      const { data: assignedCourses, error: verifyError } = await supabase
        .from('courses')
        .select('id, name, code, instructor_id')
        .eq('instructor_id', result.user.id);

      if (verifyError) {
        console.log('❌ Error verifying assignments:', verifyError.message);
      } else {
        console.log(`✅ Verified ${assignedCourses?.length || 0} courses assigned in database:`);
        assignedCourses?.forEach(course => {
          console.log(`  - ${course.code}: ${course.name}`);
        });
      }

      // Clean up - delete test instructor
      console.log('\n4. Cleaning up test instructor...');
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', result.user.id);

      if (deleteError) {
        console.log('⚠️ Failed to delete test instructor:', deleteError.message);
      } else {
        console.log('✅ Test instructor cleaned up');
      }

    } else {
      console.log('❌ Instructor creation failed:', result.error);
      console.log('Details:', result.details || 'No additional details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInstructorCourseAssignment();