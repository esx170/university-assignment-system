const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkExistingSubmissions() {
  console.log('🔍 CHECKING EXISTING SUBMISSIONS');
  console.log('='.repeat(80));

  try {
    // Get all submissions
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments(title, max_points, courses(name, code)),
        profiles!student_id(full_name, student_id)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching submissions:', error.message);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log('ℹ️ No submissions found in database');
      console.log('\n💡 To test the complete workflow:');
      console.log('   1. Sign in as a student');
      console.log('   2. Go to /student/assignments');
      console.log('   3. Click "Submit Assignment" on any assignment');
      console.log('   4. Upload a file and submit');
      console.log('   5. Then run this test again');
      return;
    }

    console.log(`✅ Found ${submissions.length} submission(s):\n`);

    submissions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.profiles?.full_name || 'Unknown'} (${sub.profiles?.student_id || 'N/A'})`);
      console.log(`   Assignment: ${sub.assignments?.title || 'Unknown'}`);
      console.log(`   Course: ${sub.assignments?.courses?.code || 'Unknown'}`);
      console.log(`   Submitted: ${new Date(sub.submitted_at).toLocaleString()}`);
      console.log(`   Grade: ${sub.grade !== null ? `${sub.grade}/${sub.assignments?.max_points}` : 'Not graded'}`);
      console.log(`   Status: ${sub.status || 'submitted'}`);
      console.log(`   Feedback: ${sub.feedback || 'No feedback'}`);
      console.log('');
    });

    // Check grading statistics
    const graded = submissions.filter(s => s.grade !== null).length;
    const pending = submissions.filter(s => s.grade === null).length;

    console.log('📊 Statistics:');
    console.log(`   Total: ${submissions.length}`);
    console.log(`   Graded: ${graded}`);
    console.log(`   Pending: ${pending}`);

    if (pending > 0) {
      console.log('\n💡 You can test grading by:');
      console.log('   1. Sign in as an instructor');
      console.log('   2. Go to /instructor/grading');
      console.log('   3. Click "Grade" on a pending submission');
      console.log('   4. Enter grade and feedback');
      console.log('   5. Click "Save Grade"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExistingSubmissions();
