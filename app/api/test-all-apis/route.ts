import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    },
    tests: [] as any[]
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      error: 'Missing Supabase configuration',
      testResults
    }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Create a test admin token
  let adminToken = ''
  try {
    const { data: adminUser } = await supabaseAdmin.auth.admin.listUsers()
    const admin = adminUser?.users?.find(u => u.email === 'admin@university.edu')
    
    if (admin) {
      const { data: tokenData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: admin.email!
      })
      // This is a simplified approach - in real scenarios you'd need proper token generation
    }
  } catch (error) {
    console.log('Could not generate admin token for testing')
  }

  // Test cases
  const apiTests = [
    {
      name: 'Public Departments API',
      method: 'GET',
      url: '/api/public/departments',
      expectedStatus: 200,
      requiresAuth: false
    },
    {
      name: 'Departments API (Auth Required)',
      method: 'GET', 
      url: '/api/departments',
      expectedStatus: 401, // Should fail without auth
      requiresAuth: true
    },
    {
      name: 'System Diagnostic API',
      method: 'GET',
      url: '/api/system-diagnostic',
      expectedStatus: 200,
      requiresAuth: false
    },
    {
      name: 'Signup API',
      method: 'POST',
      url: '/api/auth/signup',
      expectedStatus: 200,
      requiresAuth: false,
      body: {
        email: `test.api.${Date.now()}@example.com`,
        password: 'password123',
        full_name: 'API Test User',
        student_id: `API${Date.now()}`,
        department_id: '1'
      }
    },
    {
      name: 'Debug Create User API',
      method: 'POST',
      url: '/api/debug-create-user',
      expectedStatus: 200,
      requiresAuth: false,
      body: {
        email: `debug.${Date.now()}@example.com`,
        password: 'password123',
        full_name: 'Debug Test User',
        role: 'student',
        student_id: `DEBUG${Date.now()}`,
        primary_department_id: null
      }
    }
  ]

  // Run tests
  for (const test of apiTests) {
    testResults.summary.total++
    
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      if (test.body) {
        options.body = JSON.stringify(test.body)
      }

      if (test.requiresAuth && adminToken) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${adminToken}`
        }
      }

      const response = await fetch(`${baseUrl}${test.url}`, options)
      const responseData = await response.text()
      
      let parsedData
      try {
        parsedData = JSON.parse(responseData)
      } catch {
        parsedData = responseData
      }

      const passed = response.status === test.expectedStatus
      
      testResults.tests.push({
        name: test.name,
        method: test.method,
        url: test.url,
        expectedStatus: test.expectedStatus,
        actualStatus: response.status,
        passed,
        response: parsedData,
        error: null
      })

      if (passed) {
        testResults.summary.passed++
      } else {
        testResults.summary.failed++
      }

    } catch (error: any) {
      testResults.tests.push({
        name: test.name,
        method: test.method,
        url: test.url,
        expectedStatus: test.expectedStatus,
        actualStatus: null,
        passed: false,
        response: null,
        error: error.message
      })
      
      testResults.summary.failed++
    }
  }

  // Additional database direct tests
  const dbTests = [
    {
      name: 'Direct Department Query',
      test: async () => {
        const { data, error } = await supabaseAdmin
          .from('departments')
          .select('*')
          .limit(1)
        return { success: !error, data, error: error?.message }
      }
    },
    {
      name: 'Direct Department Insert',
      test: async () => {
        const testDept = {
          name: `API Test Dept ${Date.now()}`,
          code: `APITEST${Date.now()}`,
          description: 'API test department'
        }
        
        const { data, error } = await supabaseAdmin
          .from('departments')
          .insert(testDept)
          .select()
        
        // Clean up
        if (data && data.length > 0) {
          await supabaseAdmin
            .from('departments')
            .delete()
            .eq('id', data[0].id)
        }
        
        return { success: !error, data, error: error?.message }
      }
    },
    {
      name: 'Auth User List',
      test: async () => {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers()
        return { 
          success: !error, 
          data: { userCount: data?.users?.length || 0 }, 
          error: error?.message 
        }
      }
    }
  ]

  for (const dbTest of dbTests) {
    testResults.summary.total++
    
    try {
      const result = await dbTest.test()
      
      testResults.tests.push({
        name: dbTest.name,
        type: 'database',
        passed: result.success,
        response: result.data,
        error: result.error
      })

      if (result.success) {
        testResults.summary.passed++
      } else {
        testResults.summary.failed++
      }

    } catch (error: any) {
      testResults.tests.push({
        name: dbTest.name,
        type: 'database',
        passed: false,
        response: null,
        error: error.message
      })
      
      testResults.summary.failed++
    }
  }

  return NextResponse.json(testResults)
}