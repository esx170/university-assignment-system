const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testCoursesAPI() {
  console.log('🔍 Testing courses API...');
  
  try {
    // Test direct database query
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('code');
      
    if (error) {
      console.error('❌ Database Error:', error);
      return;
    }
    
    console.log(`📚 Found ${courses.length} courses in database:`);
    courses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name} (Instructor: ${course.instructor_id || 'Unassigned'})`);
    });
    
    // Check unassigned courses
    const unassigned = courses.filter(c => !c.instructor_id);
    console.log(`\n🎯 ${unassigned.length} unassigned courses available for assignment`);
    
    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/public/courses');
    
    if (response.ok) {
      const apiData = await response.json();
      console.log(`✅ API returned ${apiData.courses?.length || 0} courses`);
      console.log('API Response:', JSON.stringify(apiData, null, 2));
    } else {
      console.log(`❌ API failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCoursesAPI();