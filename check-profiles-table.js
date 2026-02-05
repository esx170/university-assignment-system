const BASE_URL = 'http://localhost:3001';

async function checkProfilesTable() {
  try {
    // Sign in as admin
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'Admin123!@#' })
    });
    const result = await response.json();
    
    // Get all users to see what columns exist
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${result.session.token}` }
    });
    const users = await usersResponse.json();
    
    if (users.length > 0) {
      console.log('Sample user object (showing available columns):');
      console.log(JSON.stringify(users[0], null, 2));
      
      console.log('\nColumns available in profiles table:');
      Object.keys(users[0]).forEach(key => {
        console.log(`- ${key}: ${typeof users[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProfilesTable();