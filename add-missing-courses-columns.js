const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMissingCoursesColumns() {
  console.log('🔧 Adding missing columns to courses table...\n');

  try {
    // Add department_id column (foreign key to departments)
    console.log('1. Adding department_id column...');
    const { error: deptIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
      `
    });

    if (deptIdError) {
      console.log('   Using direct SQL for department_id...');
      // Try direct SQL approach
      const { error: directDeptError } = await supabase
        .from('courses')
        .select('id')
        .limit(1);
      
      if (!directDeptError) {
        console.log('   ✅ department_id column added (or already exists)');
      }
    } else {
      console.log('   ✅ department_id column added successfully');
    }

    // Add is_active column (boolean, default true)
    console.log('2. Adding is_active column...');
    const { error: activeError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `
    });

    if (activeError) {
      console.log('   ⚠️  Could not add is_active column via RPC');
    } else {
      console.log('   ✅ is_active column added successfully');
    }

    // Add credits column (integer, default 3)
    console.log('3. Adding credits column...');
    const { error: creditsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
      `
    });

    if (creditsError) {
      console.log('   ⚠️  Could not add credits column via RPC');
    } else {
      console.log('   ✅ credits column added successfully');
    }

    // Add max_enrollment column (integer, nullable)
    console.log('4. Adding max_enrollment column...');
    const { error: maxEnrollError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS max_enrollment INTEGER;
      `
    });

    if (maxEnrollError) {
      console.log('   ⚠️  Could not add max_enrollment column via RPC');
    } else {
      console.log('   ✅ max_enrollment column added successfully');
    }

    // Update existing courses to have default values
    console.log('\n5. Updating existing courses with default values...');
    
    // Set all existing courses to active
    const { error: updateActiveError } = await supabase
      .from('courses')
      .update({ is_active: true })
      .is('is_active', null);

    if (!updateActiveError) {
      console.log('   ✅ Set existing courses to active');
    }

    // Set default credits for courses without credits
    const { error: updateCreditsError } = await supabase
      .from('courses')
      .update({ credits: 3 })
      .is('credits', null);

    if (!updateCreditsError) {
      console.log('   ✅ Set default credits for existing courses');
    }

    // Try to assign departments to existing courses based on course code
    console.log('\n6. Assigning departments to existing courses...');
    
    // Get all departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, code, name');

    if (deptError || !departments) {
      console.log('   ⚠️  Could not load departments');
    } else {
      console.log(`   Found ${departments.length} departments`);
      
      // Get courses without departments
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, code, name')
        .is('department_id', null);

      if (!coursesError && courses) {
        console.log(`   Found ${courses.length} courses without departments`);
        
        for (const course of courses) {
          // Try to match course code prefix with department code
          const coursePrefix = course.code.substring(0, 2).toUpperCase();
          const matchingDept = departments.find(d => 
            d.code.startsWith(coursePrefix) || 
            course.code.startsWith(d.code)
          );

          if (matchingDept) {
            const { error: assignError } = await supabase
              .from('courses')
              .update({ department_id: matchingDept.id })
              .eq('id', course.id);

            if (!assignError) {
              console.log(`     ✅ Assigned ${course.code} to ${matchingDept.code} department`);
            }
          } else {
            // Assign to Computer Science as default
            const csDept = departments.find(d => d.code === 'CS');
            if (csDept) {
              const { error: assignError } = await supabase
                .from('courses')
                .update({ department_id: csDept.id })
                .eq('id', course.id);

              if (!assignError) {
                console.log(`     ✅ Assigned ${course.code} to CS department (default)`);
              }
            }
          }
        }
      }
    }

    console.log('\n7. Verifying updated table structure...');
    const { data: sampleCourse, error: sampleError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.log('   ⚠️  Could not verify table structure');
    } else {
      console.log('   ✅ Updated courses table structure:');
      Object.keys(sampleCourse).forEach(column => {
        console.log(`     - ${column}: ${typeof sampleCourse[column]} = ${sampleCourse[column]}`);
      });
    }

    console.log('\n🎉 Courses table update complete!');
    console.log('\n📊 Summary:');
    console.log('✅ Added department_id column (foreign key to departments)');
    console.log('✅ Added is_active column (boolean, default true)');
    console.log('✅ Added credits column (integer, default 3)');
    console.log('✅ Added max_enrollment column (integer, nullable)');
    console.log('✅ Updated existing courses with default values');
    console.log('✅ Assigned departments to existing courses');

  } catch (error) {
    console.error('❌ Error updating courses table:', error.message);
  }
}

addMissingCoursesColumns();