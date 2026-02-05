const { createClient } = require('@supabase/supabase-js');

async function checkData() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 Checking database data...\n');

  console.log('1. Checking departments...');
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*');
  
  if (deptError) {
    console.error('❌ Departments error:', deptError.message);
  } else {
    console.log(`✅ Departments found: ${departments.length}`);
    departments.forEach(d => console.log(`   - ${d.code}: ${d.name}`));
  }

  console.log('\n2. Checking assignments...');
  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('*');
  
  if (assignError) {
    console.error('❌ Assignments error:', assignError.message);
  } else {
    console.log(`✅ Assignments found: ${assignments.length}`);
    assignments.forEach(a => console.log(`   - ${a.title} (${a.max_points} pts)`));
  }

  console.log('\n3. Checking courses...');
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('*');
  
  if (courseError) {
    console.error('❌ Courses error:', courseError.message);
  } else {
    console.log(`✅ Courses found: ${courses.length}`);
    courses.forEach(c => console.log(`   - ${c.code}: ${c.name}`));
  }

  console.log('\n4. Checking profiles with department_id...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department_id')
    .not('department_id', 'is', null);
  
  if (profileError) {
    console.error('❌ Profiles error:', profileError.message);
  } else {
    console.log(`✅ Profiles with departments: ${profiles.length}`);
    profiles.forEach(p => console.log(`   - ${p.email} (${p.role}) -> dept: ${p.department_id}`));
  }
}

checkData().catch(console.error);