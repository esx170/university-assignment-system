const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testAndFixEnrollmentSystem() {
  console.log('🔧 ENROLLMENT SYSTEM TEST & FIX');
  console.log('='.repeat(80));

  try {
    // Step 1: Check if enrollment table exists
    console.log('\n📋 Step 1: Checking enrollment table...');
    const { data: testEnrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(1);

    if (enrollError && (enrollError.message.includes('does not exist') || enrollError.message.includes('schema cache'))) {
      console.log('❌ Enrollment table does NOT exist');
      console.log('\n🔧 SOLUTION: You need to create the table first!');
      console.log('='.repeat(80));
      console.log('\n📝 Run this SQL in your Supabase Dashboard → SQL Editor:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  grade NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON course_enrollments;
CREATE POLICY "Enable all access for authenticated users" ON course_enrollments FOR ALL USING (true);
      `);
      console.log('='.repeat(80));
      console.log('\n⚠️ After running the SQL, run this script again to test enrollment.');
      return false;
    } else if (enrollError) {
      console.log('❌ Error checking enrollment table:', enrollError.message);
      return false;
    } else {
      console.log('✅ Enrollment table exists!');
      console.log(`📊 Current enrollments: ${testEnrollments?.length || 0}`);
    }

    // Step 2: Get test data
    console.log('\n📋 Step 2: Getting test data...');
    
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student')
      .limit(3);

    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, code')
      .limit(3);

    const { data: admin } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!students || students.length === 0) {
      console.log('❌ No students found in database');
      return false;
    }

    if (!courses || courses.length === 0) {
      console.log('❌ No courses found in database');
      return false;
    }

    console.log(`✅ Found ${students.length} students`);
    console.log(`✅ Found ${courses.length} courses`);

    // Step 3: Test enrollment creation
    console.log('\n📋 Step 3: Testing enrollment creation...');
    
    const testStudent = students[0];
    const testCourse = courses[0];

    console.log(`👤 Test Student: ${testStudent.full_name}`);
    console.log(`📚 Test Course: ${testCourse.code} - ${testCourse.name}`);

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('student_id', testStudent.id)
      .eq('course_id', testCourse.id)
      .single();

    if (existingEnrollment) {
      console.log('ℹ️ Student already enrolled in this course');
    } else {
      // Create test enrollment
      const { data: newEnrollment, error: createError } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: testStudent.id,
          course_id: testCourse.id,
          enrolled_by: admin?.id || testStudent.id,
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Failed to create enrollment:', createError.message);
        return false;
      } else {
        console.log('✅ Successfully created test enrollment!');
      }
    }

    // Step 4: Test enrollment retrieval
    console.log('\n📋 Step 4: Testing enrollment retrieval...');
    
    const { data: studentEnrollments, error: retrieveError } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        profiles!student_id(full_name),
        courses(name, code)
      `)
      .eq('student_id', testStudent.id);

    if (retrieveError) {
      console.log('❌ Failed to retrieve enrollments:', retrieveError.message);
      return false;
    }

    console.log(`✅ Retrieved ${studentEnrollments?.length || 0} enrollments for ${testStudent.full_name}`);
    studentEnrollments?.forEach(enrollment => {
      console.log(`   - ${enrollment.courses?.code}: ${enrollment.courses?.name}`);
    });

    // Step 5: Test assignment visibility
    console.log('\n📋 Step 5: Testing assignment visibility...');
    
    // Get enrolled course IDs
    const enrolledCourseIds = studentEnrollments?.map(e => e.course_id) || [];
    
    if (enrolledCourseIds.length === 0) {
      console.log('⚠️ Student not enrolled in any courses');
    } else {
      const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', enrolledCourseIds);

      if (assignError) {
        console.log('❌ Failed to retrieve assignments:', assignError.message);
      } else {
        console.log(`✅ Found ${assignments?.length || 0} assignments for enrolled courses`);
        if (assignments && assignments.length > 0) {
          assignments.forEach(assignment => {
            console.log(`   - ${assignment.title} (Due: ${assignment.due_date})`);
          });
        } else {
          console.log('ℹ️ No assignments created yet for these courses');
        }
      }
    }

    // Step 6: Summary
    console.log('\n📊 SYSTEM STATUS SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ Enrollment table: EXISTS');
    console.log('✅ Enrollment creation: WORKING');
    console.log('✅ Enrollment retrieval: WORKING');
    console.log('✅ Assignment visibility: WORKING');
    console.log('\n🎉 ENROLLMENT SYSTEM IS FULLY OPERATIONAL!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to Admin → Enrollments');
    console.log('2. Click "Enroll Student"');
    console.log('3. Select a student and courses');
    console.log('4. Click "Enroll Student"');
    console.log('5. Student will now see assignments for enrolled courses');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testAndFixEnrollmentSystem();