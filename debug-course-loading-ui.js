const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugCourseLoadingUI() {
  console.log('🔍 Debugging Course Loading UI Issue...\n');

  try {
    // Test the courses API that the UI calls
    console.log('1. Testing courses API endpoint...');
    
    const token = Buffer.from(`admin-test:${Date.now()}`).toString('base64');
    
    const response = await fetch('http://localhost:3000/api/courses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`API Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Courses API working');
      console.log(`Courses returned: ${data.courses?.length || 0}`);
      
      if (data.courses && data.courses.length > 0) {
        console.log('Sample courses:');
        data.courses.slice(0, 3).forEach(course => {
          console.log(`  - ${course.code}: ${course.name} (assigned: ${course.instructor_id ? 'Yes' : 'No'})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Courses API failed');
      console.log('Error:', errorText.substring(0, 200) + '...');
    }

    // Check if there are any available courses
    console.log('\n2. Checking available courses in database...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('code');

    if (coursesError) {
      console.log('❌ Database error:', coursesError.message);
    } else {
      console.log(`Total courses in database: ${courses?.length || 0}`);
      
      const assignedCourses = courses?.filter(c => c.instructor_id && c.instructor_id !== '') || [];
      const unassignedCourses = courses?.filter(c => !c.instructor_id || c.instructor_id === '') || [];
      
      console.log(`Assigned courses: ${assignedCourses.length}`);
      console.log(`Unassigned courses: ${unassignedCourses.length}`);
      
      if (unassignedCourses.length > 0) {
        console.log('Available courses for assignment:');
        unassignedCourses.forEach(course => {
          console.log(`  ✅ ${course.code}: ${course.name}`);
        });
      } else {
        console.log('⚠️ No unassigned courses available');
      }
    }

    // Check departments API
    console.log('\n3. Testing departments API...');
    
    const deptResponse = await fetch('http://localhost:3000/api/public/departments');
    console.log(`Departments API Status: ${deptResponse.status}`);
    
    if (deptResponse.ok) {
      const deptData = await deptResponse.json();
      console.log(`✅ Departments API working: ${deptData?.length || 0} departments`);
    } else {
      console.log('❌ Departments API failed');
    }

    // Provide troubleshooting steps
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('');
    console.log('If course assignment UI is not showing:');
    console.log('');
    console.log('1. 🔄 REFRESH BROWSER');
    console.log('   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
    console.log('   - Clear browser cache');
    console.log('');
    console.log('2. 🔄 RESTART DEVELOPMENT SERVER');
    console.log('   - Stop the server (Ctrl+C)');
    console.log('   - Run: npm run dev');
    console.log('');
    console.log('3. ✅ VERIFY STEPS IN UI:');
    console.log('   - Go to Admin → User Management → Create User');
    console.log('   - Select Role: "Instructor"');
    console.log('   - Select Department: Any department');
    console.log('   - Course assignment section should appear below');
    console.log('');
    console.log('4. 🐛 IF STILL NOT WORKING:');
    console.log('   - Check browser console for JavaScript errors');
    console.log('   - Check network tab for failed API calls');
    console.log('   - Verify the file changes were saved properly');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugCourseLoadingUI();