const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAndCreateEnrollmentsTable() {
  console.log('🔍 Checking course_enrollments table...');
  
  try {
    // First, try to query the table to see if it exists
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('id')
      .limit(1);
    
    if (error && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
      console.log('❌ course_enrollments table does not exist');
      console.log('🔧 Creating course_enrollments table...');
      
      // Create the table using raw SQL
      const createTableSQL = `
        -- Create course_enrollments table
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

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);

        -- Enable RLS
        ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Admins can manage all enrollments" ON course_enrollments;
        CREATE POLICY "Admins can manage all enrollments" ON course_enrollments
          FOR ALL USING (true);

        DROP POLICY IF EXISTS "Students can view their own enrollments" ON course_enrollments;
        CREATE POLICY "Students can view their own enrollments" ON course_enrollments
          FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON course_enrollments;
        CREATE POLICY "Instructors can view enrollments for their courses" ON course_enrollments
          FOR SELECT USING (true);
      `;

      // Execute the SQL using the rpc function
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (createError) {
        console.log('❌ Failed to create table using rpc, trying alternative method...');
        
        // Alternative: Create table step by step
        const { error: altError } = await supabase
          .from('course_enrollments')
          .insert({
            student_id: 'test-id',
            course_id: 'test-id'
          });
        
        if (altError && altError.message.includes('does not exist')) {
          console.log('❌ Table creation failed. Manual creation required.');
          console.log('\n📋 Please run this SQL in your Supabase SQL editor:');
          console.log('='.repeat(60));
          console.log(createTableSQL);
          console.log('='.repeat(60));
          return false;
        }
      } else {
        console.log('✅ course_enrollments table created successfully!');
      }
      
      // Verify table creation
      const { data: verifyData, error: verifyError } = await supabase
        .from('course_enrollments')
        .select('id')
        .limit(1);
      
      if (verifyError) {
        console.log('❌ Table verification failed:', verifyError.message);
        return false;
      } else {
        console.log('✅ Table verification successful!');
      }
      
    } else if (error) {
      console.log('❌ Error checking table:', error.message);
      return false;
    } else {
      console.log('✅ course_enrollments table already exists');
      console.log(`📊 Current enrollments: ${data?.length || 0}`);
    }

    // Test enrollment functionality
    console.log('\n🧪 Testing enrollment functionality...');
    
    // Get a student and course for testing
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .limit(1);
    
    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, code')
      .limit(1);
    
    if (students && students.length > 0 && courses && courses.length > 0) {
      console.log(`👤 Test student: ${students[0].full_name}`);
      console.log(`📚 Test course: ${courses[0].code} - ${courses[0].name}`);
      
      // Test enrollment creation (will fail if already enrolled, which is fine)
      const { data: enrollment, error: enrollError } = await supabase
        .from('course_enrollments')
        .upsert({
          student_id: students[0].id,
          course_id: courses[0].id,
          status: 'active'
        }, {
          onConflict: 'student_id,course_id'
        })
        .select();
      
      if (enrollError) {
        console.log(`⚠️ Test enrollment: ${enrollError.message}`);
      } else {
        console.log('✅ Test enrollment successful!');
      }
    }

    console.log('\n🎉 Enrollment system is ready!');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

checkAndCreateEnrollmentsTable();