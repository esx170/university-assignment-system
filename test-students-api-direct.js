const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testStudentsApiDirect() {
  console.log('🧪 Testing Students API Direct...\n');

  try {
    // Get Mr Abebe
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Mr Abebe not found');
      return;
    }

    console.log(`Testing with Mr Abebe (${mrAbebe.full_name})`);
    console.log(`Department ID: ${mrAbebe.department_id}`);

    const token = Buffer.from(`${mrAbebe.id}:${Date.now()}`).toString('base64');
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Test different API endpoints to see which ones work
    const endpoints = [
      '/api/instructor/departments',
      '/api/instructor/students',
      '/api/instructor/courses'
    ];

    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint}...`);
      
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Success - Response keys: ${Object.keys(data).join(', ')}`);
          
          if (endpoint === '/api/instructor/students' && data.students) {
            console.log(`  Students count: ${data.students.length}`);
            data.students.forEach(student => {
              console.log(`    - ${student.name}`);
            });
          }
        } else {
          const errorText = await response.text();
          console.log(`  ❌ Error: ${errorText}`);
        }
      } catch (fetchError) {
        console.log(`  ❌ Fetch error: ${fetchError.message}`);
      }
    }

    // Test if the route file has any syntax errors by checking compilation
    console.log('\n🔍 Checking route file compilation...');
    try {
      // This will help us see if there are any import/syntax errors
      const routeModule = require('../app/api/instructor/students/route.ts');
      console.log('✅ Route file compiles successfully');
    } catch (compileError) {
      console.log('❌ Route file compilation error:', compileError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentsApiDirect();