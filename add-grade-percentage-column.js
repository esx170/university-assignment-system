const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function addGradePercentageColumn() {
  console.log('🔧 Adding grade_percentage column to submissions table...\n');

  try {
    // Add grade_percentage column
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;`
    });

    if (error1 && !error1.message.includes('already exists')) {
      console.log('⚠️ Could not add grade_percentage via RPC, trying direct query...');
      // Try direct approach
      const { error: directError1 } = await supabase
        .from('submissions')
        .select('grade_percentage')
        .limit(1);
      
      if (directError1 && directError1.message.includes('does not exist')) {
        console.log('❌ Column grade_percentage does not exist and cannot be added via API');
        console.log('📋 Please run this SQL in Supabase SQL Editor:');
        console.log('\nALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;');
        console.log('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);');
        console.log('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'submitted\';');
        console.log('\nAfter running the SQL, run this script again.\n');
        return;
      }
    }

    console.log('✅ grade_percentage column added/verified');

    // Add graded_by column
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);`
    });

    console.log('✅ graded_by column added/verified');

    // Add status column
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';`
    });

    console.log('✅ status column added/verified');

    // Update existing submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('id, grade, status');

    if (!fetchError && submissions) {
      console.log(`\n📊 Found ${submissions.length} existing submission(s)`);
      
      for (const sub of submissions) {
        if (!sub.status) {
          const newStatus = sub.grade !== null ? 'graded' : 'submitted';
          await supabase
            .from('submissions')
            .update({ status: newStatus })
            .eq('id', sub.id);
          console.log(`   Updated submission ${sub.id} status to: ${newStatus}`);
        }
      }
    }

    console.log('\n✅ All columns added successfully!');
    console.log('🎉 Submissions table is now ready for grading functionality\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('\nALTER TABLE submissions ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;');
    console.log('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);');
    console.log('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'submitted\';\n');
  }
}

addGradePercentageColumn();
