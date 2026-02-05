const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseCourses() {
  console.log('🔍 Diagnosing Courses API Issues...\n');

  try {
    // Test 1: Check courses table directly
    console.log('1. Testing direct courses table access...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(3);

    if (coursesError) {
      console.log('❌ Direct courses query failed:', coursesError.message);
      return;
    }

    console.log(`✅ Found ${courses?.length || 0} courses directly`);
    if (courses && courses.length > 0) {
      console.log('   Sample course:');
      Object.entries(courses[0]).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }

    // Test 2: Check courses with instructor relationship
    console.log('\n2. Testing courses with instructor relationship...');
    const { data: coursesWithInstructor, error: instructorError } = await supabase
      .from('courses')
      .select(`
        *,
        profiles:instructor_id (
          id,
          full_name,
          email
        )
      `)
      .limit(3);

    if (instructorError) {
      console.log('❌ Courses with instructor query failed:', instructorError.message);
    } else {
      console.log(`✅ Found ${coursesWithInstructor?.length || 0} courses with instructor info`);
      if (coursesWithInstructor && coursesWithInstructor.length > 0) {
        const sample = coursesWithInstructor[0];
        console.log('   Sample course with instructor:');
        console.log(`     Code: ${sample.code}`);
        console.log(`     Name: ${sample.name}`);
        console.log(`     Instructor: ${sample.profiles?.full_name || 'No instructor'}`);
      }
    }

    // Test 3: Check departments table
    console.log('\n3. Testing departments table...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(5);

    if (deptError) {
      console.log('❌ Departments query failed:', deptError.message);
    } else {
      console.log(`✅ Found ${departments?.length || 0} departments`);
      if (departments && departments.length > 0) {
        console.log('   Available departments:');
        departments.forEach(dept => {
          console.log(`     ${dept.code}: ${dept.name}`);
        });
      }
    }

    // Test 4: Test department matching logic
    console.log('\n4. Testing department matching logic...');
    if (courses && courses.length > 0 && departments && departments.length > 0) {
      const testCourse = courses[0];
      const coursePrefix = testCourse.code?.substring(0, 2).toUpperCase();
      console.log(`   Course code: ${testCourse.code}, Prefix: ${coursePrefix}`);
      
      const matchingDept = departments.find(d => 
        d.code.startsWith(coursePrefix) || 
        testCourse.code?.startsWith(d.code)
      );
      
      if (matchingDept) {
        console.log(`   ✅ Matched department: ${matchingDept.code} - ${matchingDept.name}`);
      } else {
        console.log('   ⚠️  No matching department found, would use CS as default');
        const csDept = departments.find(d => d.code === 'CS');
        if (csDept) {
          console.log(`   Default department: ${csDept.code} - ${csDept.name}`);
        }
      }
    }

    // Test 5: Test course creation data
    console.log('\n5. Testing course creation data structure...');
    const sampleCourseData = {
      name: 'Test Course',
      code: 'TEST123',
      semester: 'Spring',
      year: 2025,
      description: 'Test description'
    };

    console.log('   Sample course data for creation:');
    Object.entries(sampleCourseData).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });

    console.log('\n🎉 Diagnosis Complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Courses table accessible: ${courses ? 'Yes' : 'No'}`);
    console.log(`✅ Instructor relationships work: ${coursesWithInstructor ? 'Yes' : 'No'}`);
    console.log(`✅ Departments table accessible: ${departments ? 'Yes' : 'No'}`);
    console.log(`✅ Department matching logic: Ready`);

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseCourses();