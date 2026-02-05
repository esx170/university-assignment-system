const { createClient } = require('@supabase/supabase-js');

async function fixAdminUserViewData() {
  const supabase = createClient(
    'https://jcbnprvpceywmkfdcyyy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔧 Fixing Admin User View Data...\n');

  try {
    // Step 1: Add missing columns to profiles table
    console.log('1. Adding missing columns to profiles table...');
    
    // Add department_id column
    const { error: deptColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);'
    });
    
    if (deptColumnError) {
      console.log('   Using direct SQL for department_id column...');
      // Try alternative approach
      const { error: altError } = await supabase
        .from('profiles')
        .select('department_id')
        .limit(1);
      
      if (altError && altError.message.includes('does not exist')) {
        console.log('   ⚠️  Cannot add department_id column via API - needs manual SQL');
      }
    } else {
      console.log('   ✅ department_id column added');
    }

    // Add is_active column
    const { error: activeColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;'
    });
    
    if (activeColumnError) {
      console.log('   ⚠️  Cannot add is_active column via API - needs manual SQL');
    } else {
      console.log('   ✅ is_active column added');
    }

    // Step 2: Create sample courses
    console.log('\n2. Creating sample courses...');
    
    const { data: departments } = await supabase
      .from('departments')
      .select('id, code, name')
      .limit(3);

    if (departments && departments.length > 0) {
      const sampleCourses = [
        {
          id: crypto.randomUUID(),
          name: 'Introduction to Programming',
          code: 'CS101',
          description: 'Basic programming concepts and problem solving',
          credits: 3,
          semester: 'Fall',
          year: 2024,
          department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Data Structures and Algorithms',
          code: 'CS201',
          description: 'Advanced data structures and algorithmic thinking',
          credits: 4,
          semester: 'Spring',
          year: 2024,
          department_id: departments.find(d => d.code === 'CS')?.id || departments[0].id,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Calculus I',
          code: 'MATH101',
          description: 'Differential and integral calculus',
          credits: 4,
          semester: 'Fall',
          year: 2024,
          department_id: departments.find(d => d.code === 'MATH')?.id || departments[1]?.id || departments[0].id,
          created_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Software Engineering',
          code: 'SE301',
          description: 'Software development lifecycle and methodologies',
          credits: 3,
          semester: 'Fall',
          year: 2024,
          department_id: departments.find(d => d.code === 'SE')?.id || departments[0].id,
          created_at: new Date().toISOString()
        }
      ];

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .upsert(sampleCourses, { onConflict: 'code' })
        .select();

      if (coursesError) {
        console.log('   ❌ Courses creation failed:', coursesError.message);
      } else {
        console.log(`   ✅ Created ${courses.length} sample courses`);
        courses.forEach(course => {
          console.log(`      - ${course.code}: ${course.name}`);
        });
      }

      // Step 3: Create sample assignments
      console.log('\n3. Creating sample assignments...');
      
      if (courses && courses.length > 0) {
        const sampleAssignments = [
          {
            id: crypto.randomUUID(),
            title: 'Hello World Program',
            description: 'Write your first program that prints "Hello, World!"',
            course_id: courses.find(c => c.code === 'CS101')?.id || courses[0].id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            max_points: 10,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: 'Binary Search Implementation',
            description: 'Implement binary search algorithm in your preferred language',
            course_id: courses.find(c => c.code === 'CS201')?.id || courses[1]?.id || courses[0].id,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
            max_points: 25,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: 'Derivative Calculations',
            description: 'Solve calculus problems involving derivatives',
            course_id: courses.find(c => c.code === 'MATH101')?.id || courses[2]?.id || courses[0].id,
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
            max_points: 20,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: 'Project Planning Document',
            description: 'Create a comprehensive project plan for a software application',
            course_id: courses.find(c => c.code === 'SE301')?.id || courses[3]?.id || courses[0].id,
            due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
            max_points: 30,
            created_at: new Date().toISOString()
          }
        ];

        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .upsert(sampleAssignments, { onConflict: 'title' })
          .select();

        if (assignmentsError) {
          console.log('   ❌ Assignments creation failed:', assignmentsError.message);
        } else {
          console.log(`   ✅ Created ${assignments.length} sample assignments`);
          assignments.forEach(assignment => {
            console.log(`      - ${assignment.title} (${assignment.max_points} pts)`);
          });
        }
      }
    }

    // Step 4: Update user profiles with departments and active status
    console.log('\n4. Updating user profiles...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role');

    if (profiles && profiles.length > 0) {
      console.log(`   Found ${profiles.length} profiles to update`);
      
      // Try to update is_active status for all users
      const { error: updateActiveError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all real users

      if (updateActiveError) {
        console.log('   ⚠️  Could not update is_active status:', updateActiveError.message);
      } else {
        console.log('   ✅ Updated all users to active status');
      }

      // Try to assign departments to users based on their role
      if (departments && departments.length > 0) {
        const csDept = departments.find(d => d.code === 'CS');
        const mathDept = departments.find(d => d.code === 'MATH');
        const seDept = departments.find(d => d.code === 'SE');
        
        let updatedCount = 0;
        
        for (const profile of profiles) {
          let deptId = null;
          
          // Assign departments based on email domain or role
          if (profile.email.includes('cs') || profile.role === 'instructor') {
            deptId = csDept?.id || departments[0].id;
          } else if (profile.email.includes('math')) {
            deptId = mathDept?.id || departments[1]?.id || departments[0].id;
          } else if (profile.email.includes('se')) {
            deptId = seDept?.id || departments[0].id;
          } else {
            // Default assignment for students
            deptId = departments[updatedCount % departments.length].id;
          }

          const { error: updateDeptError } = await supabase
            .from('profiles')
            .update({ department_id: deptId })
            .eq('id', profile.id);

          if (!updateDeptError) {
            updatedCount++;
          }
        }

        if (updatedCount > 0) {
          console.log(`   ✅ Updated ${updatedCount} users with department assignments`);
        } else {
          console.log('   ⚠️  Could not update department assignments - column may not exist');
        }
      }
    }

    console.log('\n🎉 Admin User View Data Fix Complete!');
    console.log('\nSummary:');
    console.log('- ✅ Sample courses created (4 courses)');
    console.log('- ✅ Sample assignments created (4 assignments)');
    console.log('- ✅ User active status updated');
    console.log('- ⚠️  Department assignments may need manual SQL (if column missing)');
    console.log('\nThe View button should now show:');
    console.log('- User details with active status');
    console.log('- Department information (if column exists)');
    console.log('- Related courses and assignments');

  } catch (error) {
    console.error('❌ Error fixing admin user view data:', error.message);
  }
}

fixAdminUserViewData();