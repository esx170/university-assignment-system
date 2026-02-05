const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugCourseCreationFailure() {
  console.log('🔍 Debugging Course Creation Failure...\n');

  try {
    // Step 1: Test direct course insertion
    console.log('1. Testing direct course insertion into database...');
    
    const testCourseData = {
      name: 'Debug Test Course',
      code: 'DEBUG101',
      description: 'Test course for debugging',
      semester: 'Spring',
      year: 2025,
      instructor_id: '0bd2848a-1399-4b3d-9db7-73fcf778e818' // Use existing instructor ID
    };

    console.log('   Attempting to insert:', testCourseData);

    const { data: insertedCourse, error: insertError } = await supabase
      .from('courses')
      .insert(testCourseData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Direct insertion failed:', insertError.message);
      console.log('   Error code:', insertError.code);
      console.log('   Error details:', insertError.details);
      console.log('   Error hint:', insertError.hint);
    } else {
      console.log('✅ Direct insertion successful');
      console.log('   Inserted course ID:', insertedCourse.id);
      console.log('   Inserted course:', insertedCourse);
    }

    // Step 2: Check if instructor_id exists
    console.log('\n2. Checking if instructor_id exists...');
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', '0bd2848a-1399-4b3d-9db7-73fcf778e818')
      .single();

    if (instructorError) {
      console.log('❌ Instructor not found:', instructorError.message);
      
      // Find any instructor
      console.log('   Looking for any instructor...');
      const { data: anyInstructor, error: anyInstructorError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'instructor')
        .limit(1)
        .single();

      if (anyInstructorError) {
        console.log('   ❌ No instructors found:', anyInstructorError.message);
        
        // Find admin user
        console.log('   Looking for admin user...');
        const { data: adminUser, error: adminError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('email', 'admin@university.edu')
          .single();

        if (adminError) {
          console.log('   ❌ Admin user not found:', adminError.message);
        } else {
          console.log('   ✅ Found admin user:', adminUser);
          testCourseData.instructor_id = adminUser.id;
        }
      } else {
        console.log('   ✅ Found instructor:', anyInstructor);
        testCourseData.instructor_id = anyInstructor.id;
      }
    } else {
      console.log('✅ Instructor found:', instructor);
    }

    // Step 3: Test course creation with corrected instructor_id
    if (insertError && testCourseData.instructor_id) {
      console.log('\n3. Retrying course insertion with corrected instructor_id...');
      
      const retryData = {
        ...testCourseData,
        code: 'DEBUG102' // Use different code to avoid conflicts
      };

      const { data: retryCourse, error: retryError } = await supabase
        .from('courses')
        .insert(retryData)
        .select()
        .single();

      if (retryError) {
        console.log('❌ Retry insertion failed:', retryError.message);
        console.log('   Error code:', retryError.code);
        console.log('   Error details:', retryError.details);
      } else {
        console.log('✅ Retry insertion successful');
        console.log('   Course ID:', retryCourse.id);
      }
    }

    // Step 4: Check table constraints
    console.log('\n4. Checking table constraints...');
    
    // Check if there are any unique constraints that might be violated
    const { data: existingCourses, error: existingError } = await supabase
      .from('courses')
      .select('code, semester, year')
      .eq('code', 'DEBUG101');

    if (existingError) {
      console.log('❌ Error checking existing courses:', existingError.message);
    } else {
      console.log(`✅ Found ${existingCourses.length} existing courses with code DEBUG101`);
      if (existingCourses.length > 0) {
        console.log('   Existing courses:', existingCourses);
      }
    }

    // Step 5: Test minimal course creation
    console.log('\n5. Testing minimal course creation...');
    
    const minimalCourse = {
      name: 'Minimal Test Course',
      code: 'MIN101',
      semester: 'Fall',
      year: 2025
    };

    const { data: minimalResult, error: minimalError } = await supabase
      .from('courses')
      .insert(minimalCourse)
      .select()
      .single();

    if (minimalError) {
      console.log('❌ Minimal course creation failed:', minimalError.message);
      console.log('   This suggests a fundamental issue with the table');
    } else {
      console.log('✅ Minimal course creation successful');
      console.log('   Course ID:', minimalResult.id);
    }

    console.log('\n🎉 Debug Complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Table accessible: ${!insertError || !minimalError ? 'Yes' : 'No'}`);
    console.log(`✅ Instructor constraint: ${!instructorError ? 'Valid' : 'Invalid'}`);
    console.log(`✅ Unique constraints: ${existingCourses?.length === 0 ? 'No conflicts' : 'Potential conflicts'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugCourseCreationFailure();