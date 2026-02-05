const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCoursesTable() {
  console.log('🔧 Fixing courses table structure...\n');

  try {
    // First, check current table structure
    console.log('1. Checking current courses table structure...');
    const { data: currentCourses, error: checkError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Failed to check current table:', checkError.message);
      return;
    }

    const currentColumns = Object.keys(currentCourses?.[0] || {});
    console.log('   Current columns:', currentColumns);

    // Check which columns are missing
    const requiredColumns = ['department_id', 'is_active', 'credits', 'max_enrollment'];
    const missingColumns = requiredColumns.filter(col => !currentColumns.includes(col));
    
    console.log('   Missing columns:', missingColumns);

    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist!');
      return;
    }

    // Since we can't use ALTER TABLE directly, we'll update the courses using the API
    console.log('\n2. Getting all courses to update...');
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, code, name, instructor_id');

    if (coursesError) {
      console.error('❌ Failed to get courses:', coursesError.message);
      return;
    }

    console.log(`   Found ${allCourses?.length || 0} courses to update`);

    // Get departments for assignment
    console.log('\n3. Getting departments for assignment...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, code, name');

    if (deptError) {
      console.error('❌ Failed to get departments:', deptError.message);
      return;
    }

    console.log(`   Found ${departments?.length || 0} departments`);

    // Update each course with the missing data
    console.log('\n4. Updating courses with missing columns...');
    const results = [];

    for (const course of allCourses || []) {
      try {
        // Find matching department based on course code
        const coursePrefix = course.code.substring(0, 2).toUpperCase();
        let matchingDept = departments?.find(d => 
          d.code.startsWith(coursePrefix) || 
          course.code.startsWith(d.code)
        );

        // Default to CS department if no match
        if (!matchingDept) {
          matchingDept = departments?.find(d => d.code === 'CS');
        }

        // Prepare update data with only the fields that exist in the table
        const updateData = {};

        // Try to update with new columns - if they don't exist, the update will just ignore them
        if (missingColumns.includes('department_id') && matchingDept) {
          updateData.department_id = matchingDept.id;
        }
        if (missingColumns.includes('is_active')) {
          updateData.is_active = true;
        }
        if (missingColumns.includes('credits')) {
          updateData.credits = 3;
        }
        if (missingColumns.includes('max_enrollment')) {
          updateData.max_enrollment = 50;
        }

        // Update the course
        const { error: updateError } = await supabase
          .from('courses')
          .update(updateData)
          .eq('id', course.id);

        if (updateError) {
          console.log(`   ⚠️  Failed to update course ${course.code}: ${updateError.message}`);
          results.push({
            course: course.code,
            status: 'failed',
            error: updateError.message
          });
        } else {
          console.log(`   ✅ Updated course ${course.code} with department ${matchingDept?.code || 'none'}`);
          results.push({
            course: course.code,
            status: 'success',
            department: matchingDept?.code || 'none'
          });
        }
      } catch (error) {
        console.log(`   ❌ Error updating course ${course.code}: ${error.message}`);
        results.push({
          course: course.code,
          status: 'error',
          error: error.message
        });
      }
    }

    // Verify the updates
    console.log('\n5. Verifying updated table structure...');
    const { data: updatedCourses, error: verifyError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('   ⚠️  Could not verify updates:', verifyError.message);
    } else {
      const updatedColumns = Object.keys(updatedCourses?.[0] || {});
      console.log('   ✅ Updated table columns:', updatedColumns);
      
      // Show sample data
      if (updatedCourses?.[0]) {
        console.log('   Sample course data:');
        Object.entries(updatedCourses[0]).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }
    }

    console.log('\n🎉 Courses table fix complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Total courses processed: ${allCourses?.length || 0}`);
    console.log(`✅ Successfully updated: ${results.filter(r => r.status === 'success').length}`);
    console.log(`⚠️  Failed updates: ${results.filter(r => r.status !== 'success').length}`);

    if (results.filter(r => r.status !== 'success').length > 0) {
      console.log('\n❌ Failed courses:');
      results.filter(r => r.status !== 'success').forEach(r => {
        console.log(`   ${r.course}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing courses table:', error.message);
  }
}

fixCoursesTable();