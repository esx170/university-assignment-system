const { createClient } = require('@supabase/supabase-js');

async function checkCoursesTableStructure() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Checking courses table structure...\n');

  try {
    // Get existing courses to see structure
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (coursesError) {
      console.log('❌ Courses table error:', coursesError.message);
      return;
    }

    if (courses && courses.length > 0) {
      console.log('✅ Courses table exists with columns:');
      const sample = courses[0];
      Object.keys(sample).forEach(col => {
        console.log(`   - ${col}: ${typeof sample[col]} = ${sample[col]}`);
      });
    } else {
      console.log('✅ Courses table exists but is empty');
      
      // Try to insert a minimal record to see what columns are required
      const testId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('courses')
        .insert({
          id: testId,
          name: 'Test Course Structure',
          code: 'TESTSTR'
        })
        .select();
      
      if (insertError) {
        console.log('📋 Required columns based on error:', insertError.message);
      } else {
        console.log('✅ Minimal insert successful');
        // Clean up
        await supabase.from('courses').delete().eq('id', testId);
      }
    }

    // Test specific columns that might be missing
    console.log('\n🔍 Testing specific columns...');
    
    const columnsToTest = [
      'id', 'name', 'code', 'description', 'credits', 'semester', 'year', 
      'department_id', 'instructor_id', 'is_active', 'max_enrollment',
      'created_at', 'updated_at'
    ];

    const existingColumns = [];
    
    for (const column of columnsToTest) {
      const { data, error } = await supabase
        .from('courses')
        .select(column)
        .limit(1);

      if (!error) {
        existingColumns.push(column);
      }
    }

    console.log('   ✅ Existing columns:', existingColumns.join(', '));
    console.log('   ❌ Missing columns:', columnsToTest.filter(col => !existingColumns.includes(col)).join(', '));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCoursesTableStructure();