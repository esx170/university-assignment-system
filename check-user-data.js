const BASE_URL = 'http://localhost:3001';

async function checkUserData() {
  try {
    // Sign in as admin
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'Admin123!@#' })
    });
    const result = await response.json();
    
    // Get all users
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${result.session.token}` }
    });
    const users = await usersResponse.json();
    
    // Find a recent student user
    const recentUser = users.find(u => u.email.includes('student.') || u.email.includes('flowtest.'));
    console.log('Recent student user data:');
    console.log(JSON.stringify(recentUser, null, 2));
    
    // Check if department_id is stored
    if (recentUser) {
      console.log('\nDepartment info:');
      console.log('- department_id:', recentUser.department_id);
      console.log('- primary_department:', recentUser.primary_department);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserData();