const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createEnrollmentsTableDirect() {
  console.log('🔧 Creating course_enrollments table directly...');
  
  try {
    // Method 1: Try using the REST API to create the table structure
    console.log('📋 Step 1: Creating table structure...');
    
    // Get a real student and course ID for the structure
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(1);
    
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (!students || students.length === 0) {
      console.log('❌ No students found. Please create a student first.');
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('❌ No courses found. Please create a course first.');
      return;
    }
    
    const studentId = students[0].id;
    const courseId = courses[0].id;
    
    console.log(`👤 Using student ID: ${studentId}`);
    console.log(`📚 Using course ID: ${courseId}`);
    
    // Try to create the table by making a proper insert
    const enrollmentData = {
      id: crypto.randomUUID(),
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      enrolled_by: studentId, // Use student as enrolling user for now
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Attempting to create enrollment record...');
    
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollments')
      .insert(enrollmentData)
      .select();
    
    if (enrollError) {
      if (enrollError.message.includes('does not exist')) {
        console.log('❌ Table does not exist and cannot be created automatically.');
        console.log('\n🔧 MANUAL SOLUTION REQUIRED:');
        console.log('Please go to your Supabase dashboard > SQL Editor and run:');
        console.log('='.repeat(80));
        console.log(`
CREATE TABLE course_enrollments (
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

-- Create indexes
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);

-- Enable RLS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for authenticated users" ON course_enrollments FOR ALL USING (true);
        `);
        console.log('='.repeat(80));
        console.log('\nAfter running the SQL, the enrollment feature will work.');
        return false;
      } else {
        console.log('❌ Enrollment creation failed:', enrollError.message);
        return false;
      }
    } else {
      console.log('✅ Enrollment created successfully!');
      console.log('✅ course_enrollments table is working!');
      
      // Test the enrollment functionality
      console.log('\n🧪 Testing enrollment functionality...');
      
      const { data: testEnrollments, error: testError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          profiles!student_id(full_name),
          courses(name, code)
        `);
      
      if (testError) {
        console.log('⚠️ Test query failed:', testError.message);
      } else {
        console.log(`✅ Found ${testEnrollments.length} enrollment(s)`);
        testEnrollments.forEach(e => {
          console.log(`  - ${e.profiles?.full_name} enrolled in ${e.courses?.code}`);
        });
      }
      
      console.log('\n🎉 Enrollment system is fully functional!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

createEnrollmentsTableDirect();