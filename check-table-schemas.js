const { createClient } = require('@supabase/supabase-js');

async function checkTableSchemas() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Checking table schemas...\n');

  // Check courses table
  console.log('1. Courses table:');
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .limit(1);

  if (coursesError) {
    console.log('   ❌ Courses table error:', coursesError.message);
  } else if (courses.length > 0) {
    console.log('   ✅ Courses table exists with columns:');
    Object.keys(courses[0]).forEach(col => {
      console.log(`      - ${col}: ${typeof courses[0][col]}`);
    });
  } else {
    console.log('   ✅ Courses table exists but is empty');
    // Try to insert a minimal record to see what columns are required
    const { error: insertError } = await supabase
      .from('courses')
      .insert({ name: 'Test Course', code: 'TEST' })
      .select();
    
    if (insertError) {
      console.log('   📋 Required columns based on error:', insertError.message);
    } else {
      console.log('   ✅ Minimal insert successful');
      // Clean up
      await supabase.from('courses').delete().eq('code', 'TEST');
    }
  }

  // Check assignments table
  console.log('\n2. Assignments table:');
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('*')
    .limit(1);

  if (assignmentsError) {
    console.log('   ❌ Assignments table error:', assignmentsError.message);
  } else if (assignments.length > 0) {
    console.log('   ✅ Assignments table exists with columns:');
    Object.keys(assignments[0]).forEach(col => {
      console.log(`      - ${col}: ${typeof assignments[0][col]}`);
    });
  } else {
    console.log('   ✅ Assignments table exists but is empty');
    // Try to insert a minimal record to see what columns are required
    const { error: insertError } = await supabase
      .from('assignments')
      .insert({ title: 'Test Assignment' })
      .select();
    
    if (insertError) {
      console.log('   📋 Required columns based on error:', insertError.message);
    } else {
      console.log('   ✅ Minimal insert successful');
      // Clean up
      await supabase.from('assignments').delete().eq('title', 'Test Assignment');
    }
  }

  // Check profiles table columns
  console.log('\n3. Profiles table:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profilesError) {
    console.log('   ❌ Profiles table error:', profilesError.message);
  } else if (profiles.length > 0) {
    console.log('   ✅ Profiles table exists with columns:');
    Object.keys(profiles[0]).forEach(col => {
      console.log(`      - ${col}: ${typeof profiles[0][col]}`);
    });
  }
}

checkTableSchemas();