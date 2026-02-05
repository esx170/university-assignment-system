const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugMrAbebeIssue() {
  console.log('🔍 Debugging Mr Abebe Department API Issue...\n');

  try {
    // Get Mr Abebe's exact data
    console.log('1. Getting Mr Abebe exact data...');
    const { data: mrAbebe, error: abebeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'abebe@gmail.com')
      .single();

    if (abebeError || !mrAbebe) {
      console.log('❌ Error fetching Mr Abebe:', abebeError?.message);
      return;
    }

    console.log('Mr Abebe data:');
    console.log(`  ID: ${mrAbebe.id}`);
    console.log(`  Name: "${mrAbebe.full_name}" (length: ${mrAbebe.full_name?.length})`);
    console.log(`  Email: ${mrAbebe.email}`);
    console.log(`  Role: ${mrAbebe.role}`);
    console.log(`  Department ID: ${mrAbebe.department_id}`);

    // Check for any special characters or spaces
    if (mrAbebe.full_name) {
      console.log('  Name characters:');
      for (let i = 0; i < mrAbebe.full_name.length; i++) {
        const char = mrAbebe.full_name[i];
        const code = char.charCodeAt(0);
        console.log(`    [${i}]: "${char}" (code: ${code})`);
      }
    }

    // Test token creation and verification
    console.log('\n2. Testing token creation...');
    const token = Buffer.from(`${mrAbebe.id}:${Date.now()}`).toString('base64');
    console.log(`Token: ${token}`);

    // Decode token to verify
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestamp] = decoded.split(':');
    console.log(`Decoded - User ID: ${userId}, Timestamp: ${timestamp}`);
    console.log(`Match: ${userId === mrAbebe.id}`);

    // Test department API with detailed logging
    console.log('\n3. Testing department API with detailed logging...');
    
    try {
      const response = await fetch('http://localhost:3000/api/instructor/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ API Error Response:', errorText);
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    }

    // Verify department exists
    console.log('\n4. Verifying department exists...');
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', mrAbebe.department_id)
      .single();

    if (deptError || !department) {
      console.log('❌ Department not found:', deptError?.message);
    } else {
      console.log('✅ Department found:');
      console.log(`  ID: ${department.id}`);
      console.log(`  Code: ${department.code}`);
      console.log(`  Name: ${department.name}`);
    }

    // Test direct profile query in API format
    console.log('\n5. Testing direct profile query...');
    const { data: profileTest, error: profileTestError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        department_id
      `)
      .eq('id', mrAbebe.id)
      .single();

    if (profileTestError) {
      console.log('❌ Profile query error:', profileTestError.message);
    } else {
      console.log('✅ Profile query successful:', profileTest);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMrAbebeIssue();