const BASE_URL = 'http://localhost:3001';

async function testAddColumns() {
  console.log('🔧 Testing add assignments columns API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/add-assignments-columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API response received');
      console.log('   Message:', result.message);
      
      if (result.instructions) {
        console.log('\n📋 Instructions:');
        result.instructions.forEach(instruction => {
          console.log('   ' + instruction);
        });
      }
      
      if (result.sql_commands) {
        console.log('\n💾 SQL Commands to run:');
        result.sql_commands.forEach(cmd => {
          console.log('   ' + cmd);
        });
      }
    } else {
      const error = await response.json();
      console.log('❌ API failed');
      console.log('   Error:', error.error);
      console.log('   Details:', error.details);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAddColumns();