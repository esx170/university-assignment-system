const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://jcbnprvpceywmkfdcyyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createUnassignedCourses() {
  console.log('🎯 Creating unassigned courses for instructor assignment testing...');
  
  const newCourses = [
    {
      id: crypto.randomUUID(),
      code: 'UNASSIGNED01',
      name: 'Available Course 1',
      description: 'This course is available for assignment',
      instructor_id: null, // Explicitly unassigned
      semester: 'Fall',
      year: 2025,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      code: 'UNASSIGNED02',
      name: 'Available Course 2',
      description: 'This course is available for assignment',
      instructor_id: null, // Explicitly unassigned
      semester: 'Spring',
      year: 2025,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      code: 'UNASSIGNED03',
      name: 'Available Course 3',
      description: 'This course is available for assignment',
      instructor_id: null, // Explicitly unassigned
      semester: 'Fall',
      year: 2025,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      code: 'UNASSIGNED04',
      name: 'Available Course 4',
      description: 'This course is available for assignment',
      instructor_id: null, // Explicitly unassigned
      semester: 'Spring',
      year: 2026,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      code: 'UNASSIGNED05',
      name: 'Available Course 5',
      description: 'This course is available for assignment',
      instructor_id: null, // Explicitly unassigned
      semester: 'Fall',
      year: 2026,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  try {
    const { data: insertedCourses, error } = await supabase
      .from('courses')
      .insert(newCourses)
      .select();

    if (error) {
      console.error('❌ Error creating courses:', error);
      return;
    }

    console.log(`✅ Successfully created ${insertedCourses.length} unassigned courses:`);
    insertedCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name}`);
    });

    // Verify the total count
    const { data: allCourses, error: countError } = await supabase
      .from('courses')
      .select('*');

    if (!countError) {
      const unassigned = allCourses.filter(c => !c.instructor_id);
      console.log(`\n📊 Total courses: ${allCourses.length}`);
      console.log(`🎯 Unassigned courses: ${unassigned.length}`);
      console.log(`👨‍🏫 Assigned courses: ${allCourses.length - unassigned.length}`);
    }

  } catch (error) {
    console.error('❌ Failed to create courses:', error);
  }
}

createUnassignedCourses();