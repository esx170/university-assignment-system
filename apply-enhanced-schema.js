const BASE_URL = 'http://localhost:3001';

async function applyEnhancedSchema() {
  console.log('🔧 Applying Enhanced Schema...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/apply-enhanced-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Enhanced schema applied successfully');
      console.log('   Tables found:', result.tables_found);
      console.log('   Message:', result.message);
    } else {
      const error = await response.json();
      console.log('❌ Failed to apply enhanced schema');
      console.log('   Error:', error.error);
      console.log('   Details:', error.details);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

applyEnhancedSchema();