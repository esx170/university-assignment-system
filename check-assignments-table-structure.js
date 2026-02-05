const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAssignmentsTable() {
  console.log('🔍 Checking assignments table structure...\n');

  try {
    // Check if assignments table exists
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (assignmentsError) {
      console.log('❌ Assignments table error:', assignmentsError.message);
      
      if (assignmentsError.code === '42P01') {
        console.log('   Table does not exist - need to create assignments table');
        return;
      }
    } else {
      console.log(`✅ Assignments table exists`);
      
      if (assignments && assignments.length > 0) {
        console.log('   Sample assignment:');
        Object.entries(assignments[0]).forEach(([key, value]) => {
          console.log(`     ${key}: ${typeof value} = ${value}`);
        });
      } else {
        console.log('   Table is empty');
      }
    }

    // Test specific columns that might be missing
    console.log('\n🔍 Testing specific columns...');
    const testColumns = ['instructor_id', 'status', 'max_points', 'course_id'];
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Column '${column}' missing or inaccessible: ${error.message}`);
        } else {
          console.log(`   ✅ Column '${column}' exists`);
        }
      } catch (err) {
        console.log(`   ❌ Column '${column}' test failed: ${err.message}`);
      }
    }

    // Check if we can create a test assignment
    console.log('\n🔍 Testing assignment creation...');
    
    // First get a course to use
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, code, name')
      .limit(1);

    if (coursesError || !courses || courses.length === 0) {
      console.log('   ❌ No courses available for testing assignment creation');
      return;
    }

    const testCourse = courses[0];
    console.log(`   Using course: ${testCourse.code} - ${testCourse.name}`);

    const testAssignment = {
      title: 'Test Assignment',
      description: 'Test assignment for debugging',
      course_id: testCourse.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      max_points: 100
    };

    const { data: createdAssignment, error: createError } = await supabase
      .from('assignments')
      .insert(testAssignment)
      .select()
      .single();

    if (createError) {
      console.log('   ❌ Assignment creation failed:', createError.message);
      console.log('   Error code:', createError.code);
      console.log('   Error details:', createError.details);
    } else {
      console.log('   ✅ Assignment creation successful');
      console.log('   Created assignment ID:', createdAssignment.id);
      console.log('   Assignment data:', createdAssignment);
    }

    console.log('\n🎉 Assignments table check complete!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAssignmentsTable();