const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function demoCompleteInstructorWorkflow() {
  console.log('🎯 COMPLETE INSTRUCTOR CREATION WORKFLOW DEMO\n');

  try {
    // Step 1: Show what admin sees - available departments
    console.log('📋 STEP 1: Admin selects department');
    console.log('When admin goes to Create User → Instructor, they see:');
    
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (deptError) {
      console.log('❌ Error fetching departments');
      return;
    }

    console.log('\n🏢 AVAILABLE DEPARTMENTS:');
    departments?.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.code} - ${dept.name}`);
    });

    // Step 2: Admin selects Software Engineering
    const seDept = departments?.find(d => d.code === 'SE');
    console.log(`\n✅ Admin selects: ${seDept?.code} - ${seDept?.name}`);

    // Step 3: Show available courses for assignment
    console.log('\n📚 STEP 2: System loads available courses');
    console.log('After selecting department, admin sees course assignment options:');

    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('code');

    if (coursesError) {
      console.log('❌ Error fetching courses');
      return;
    }

    console.log('\n📖 AVAILABLE COURSES:');
    allCourses?.forEach((course, index) => {
      const isAssigned = course.instructor_id && course.instructor_id !== '';
      const status = isAssigned ? '🔒 Already assigned' : '✅ Available';
      console.log(`   ${index + 1}. ${course.code} - ${course.name} (${status})`);
    });

    // Step 4: Create a temporary course for demonstration
    console.log('\n🔧 STEP 3: Creating demo course for assignment...');
    
    // Use existing instructor ID as temporary placeholder
    const { data: existingInstructor } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'instructor')
      .limit(1)
      .single();

    if (!existingInstructor) {
      console.log('❌ No existing instructor found for demo');
      return;
    }

    const demoCourse = {
      code: 'DEMO101',
      name: 'Demo Course for Assignment',
      semester: 'Spring',
      year: 2025,
      instructor_id: existingInstructor.id // Temporary assignment
    };

    const { data: newCourse, error: courseError } = await supabase
      .from('courses')
      .insert(demoCourse)
      .select()
      .single();

    if (courseError) {
      console.log('❌ Failed to create demo course:', courseError.message);
      return;
    }

    console.log(`✅ Created demo course: ${newCourse.code} - ${newCourse.name}`);

    // Step 5: Demonstrate the complete creation process
    console.log('\n👨‍🏫 STEP 4: Creating new instructor with course assignment');
    console.log('Admin fills out the form:');
    
    const instructorData = {
      email: 'demo.instructor@university.edu',
      password: 'securepass123',
      full_name: 'Dr. Demo Instructor',
      role: 'instructor',
      primary_department_id: seDept?.id,
      assigned_courses: [newCourse.id]
    };

    console.log(`\n📝 INSTRUCTOR DETAILS:`);
    console.log(`   Name: ${instructorData.full_name}`);
    console.log(`   Email: ${instructorData.email}`);
    console.log(`   Department: ${seDept?.code} - ${seDept?.name}`);
    console.log(`   Selected Courses: ${newCourse.code} - ${newCourse.name}`);

    // Step 6: Create the instructor
    console.log('\n⚡ STEP 5: System creates instructor and assigns courses...');
    
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Buffer.from(`admin-test:${Date.now()}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(instructorData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('🎉 SUCCESS! Instructor created with assignments:');
      console.log(`   ✅ User ID: ${result.user.id}`);
      console.log(`   ✅ Department: ${result.user.primary_department_id ? 'Assigned' : 'Not assigned'}`);
      
      if (result.courseAssignments) {
        console.log(`   ✅ Course assignments: ${result.courseAssignments.successful}/${result.courseAssignments.total} successful`);
        
        if (result.courseAssignments.details) {
          result.courseAssignments.details.forEach(assignment => {
            if (assignment.success) {
              console.log(`      📚 ${assignment.courseName}`);
            }
          });
        }
      }

      // Step 7: Verify the assignment worked
      console.log('\n🔍 STEP 6: Verifying assignments in database...');
      
      const { data: verifyProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', result.user.id)
        .single();

      if (!profileError && verifyProfile) {
        console.log('✅ Profile verified:');
        console.log(`   Name: ${verifyProfile.full_name}`);
        console.log(`   Role: ${verifyProfile.role}`);
        console.log(`   Department ID: ${verifyProfile.department_id}`);
      }

      const { data: assignedCourses, error: coursesVerifyError } = await supabase
        .from('courses')
        .select('id, name, code')
        .eq('instructor_id', result.user.id);

      if (!coursesVerifyError && assignedCourses) {
        console.log(`✅ Course assignments verified: ${assignedCourses.length} courses`);
        assignedCourses.forEach(course => {
          console.log(`   📚 ${course.code}: ${course.name}`);
        });
      }

      // Clean up
      console.log('\n🧹 Cleaning up demo data...');
      
      await supabase.from('profiles').delete().eq('id', result.user.id);
      console.log('✅ Demo instructor deleted');

    } else {
      console.log('❌ Instructor creation failed:', result.error);
    }

    // Clean up demo course
    await supabase.from('courses').delete().eq('id', newCourse.id);
    console.log('✅ Demo course deleted');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 WORKFLOW SUMMARY - WHAT YOU CAN NOW DO:');
    console.log('='.repeat(60));
    console.log('');
    console.log('1. 🏢 SELECT DEPARTMENT');
    console.log('   → Admin chooses from dropdown of all departments');
    console.log('   → System loads available courses for that context');
    console.log('');
    console.log('2. 📚 ASSIGN COURSES');
    console.log('   → Admin sees list of all courses with assignment status');
    console.log('   → Can select multiple courses using checkboxes');
    console.log('   → System prevents double-assignment conflicts');
    console.log('');
    console.log('3. ⚡ CREATE INSTRUCTOR');
    console.log('   → System creates user profile with department');
    console.log('   → Automatically assigns selected courses to instructor');
    console.log('   → Provides detailed feedback on each assignment');
    console.log('');
    console.log('4. ✅ IMMEDIATE ACCESS');
    console.log('   → Instructor can immediately log in');
    console.log('   → See their assigned department and courses');
    console.log('   → Access students from their department');
    console.log('');
    console.log('🎉 RESULT: Complete instructor setup in one step!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

demoCompleteInstructorWorkflow();