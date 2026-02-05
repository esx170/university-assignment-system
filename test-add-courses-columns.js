const BASE_URL = 'http://localhost:3001';

async function testAddCoursesColumns() {
  console.log('🧪 Testing Add Courses Columns API...\n');

  try {
    console.log('1. Calling add-courses-columns API...');
    const response = await fetch(`${BASE_URL}/api/add-courses-columns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API call successful!');
      console.log('\n📊 Results:');
      console.log('Message:', result.message);
      
      if (result.columnResults) {
        console.log('\n🔧 Column Addition Results:');
        result.columnResults.forEach(col => {
          const status = col.status === 'success' ? '✅' : '❌';
          console.log(`   ${status} ${col.column}: ${col.status}`);
          if (col.error) {
            console.log(`      Error: ${col.error}`);
          }
        });
      }

      if (result.updateResults) {
        console.log('\n📝 Course Update Results:');
        const successful = result.updateResults.filter(r => r.status === 'success');
        const failed = result.updateResults.filter(r => r.status !== 'success');
        
        console.log(`   ✅ Successful updates: ${successful.length}`);
        console.log(`   ❌ Failed updates: ${failed.length}`);
        
        if (successful.length > 0) {
          console.log('   Successful courses:');
          successful.forEach(r => {
            console.log(`     - ${r.course} → ${r.department} department`);
          });
        }
        
        if (failed.length > 0) {
          console.log('   Failed courses:');
          failed.forEach(r => {
            console.log(`     - ${r.course}: ${r.error}`);
          });
        }
      }

      if (result.sampleCourse) {
        console.log('\n📋 Sample Updated Course:');
        Object.entries(result.sampleCourse).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }

      console.log(`\n📈 Summary: ${result.successfulUpdates}/${result.totalCourses} courses updated successfully`);

    } else {
      const error = await response.json();
      console.log('❌ API call failed:', error.error);
      if (error.details) {
        console.log('   Details:', error.details);
      }
    }

    // Test the courses API to see if it now works properly
    console.log('\n2. Testing courses API after column addition...');
    
    // Sign in as admin first
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      })
    });

    if (signinResponse.ok) {
      const signinResult = await signinResponse.json();
      
      // Test courses API
      const coursesResponse = await fetch(`${BASE_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${signinResult.session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        console.log('✅ Courses API working!');
        console.log(`   Found ${courses.length} courses`);
        
        if (courses.length > 0) {
          console.log('   Sample course:');
          const sample = courses[0];
          console.log(`     Code: ${sample.code}`);
          console.log(`     Name: ${sample.name}`);
          console.log(`     Department: ${sample.department?.name || 'No department'}`);
          console.log(`     Status: ${sample.is_active ? 'Active' : 'Inactive'}`);
          console.log(`     Credits: ${sample.credits || 'Not set'}`);
        }
      } else {
        const error = await coursesResponse.json();
        console.log('❌ Courses API still failing:', error.error);
      }
    }

    console.log('\n🎉 Test complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAddCoursesColumns();