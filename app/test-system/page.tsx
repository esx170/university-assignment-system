'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function TestSystemPage() {
  const [user, setUser] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const runTests = async () => {
    setLoading(true)
    const results: any[] = []

    // Test 1: Check authentication
    try {
      const { data: { session } } = await supabase.auth.getSession()
      results.push({
        test: 'Authentication',
        status: session ? 'PASS' : 'FAIL',
        details: session ? `User: ${session.user?.email}` : 'No active session'
      })
    } catch (error) {
      results.push({
        test: 'Authentication',
        status: 'ERROR',
        details: error
      })
    }

    // Test 2: Check departments table
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .limit(5)

      results.push({
        test: 'Departments Table',
        status: error ? 'FAIL' : 'PASS',
        details: error ? error.message : `Found ${data?.length || 0} departments`
      })
    } catch (error) {
      results.push({
        test: 'Departments Table',
        status: 'ERROR',
        details: error
      })
    }

    // Test 3: Check profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)

      results.push({
        test: 'Profiles Table',
        status: error ? 'FAIL' : 'PASS',
        details: error ? error.message : `Found ${data?.length || 0} profiles`
      })
    } catch (error) {
      results.push({
        test: 'Profiles Table',
        status: 'ERROR',
        details: error
      })
    }

    // Test 4: Check courses table
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(5)

      results.push({
        test: 'Courses Table',
        status: error ? 'FAIL' : 'PASS',
        details: error ? error.message : `Found ${data?.length || 0} courses`
      })
    } catch (error) {
      results.push({
        test: 'Courses Table',
        status: 'ERROR',
        details: error
      })
    }

    // Test 5: Check enhanced tables
    try {
      const { data, error } = await supabase
        .from('instructor_department_assignments')
        .select('*')
        .limit(1)

      results.push({
        test: 'Enhanced Tables (instructor_department_assignments)',
        status: error ? 'FAIL' : 'PASS',
        details: error ? error.message : 'Enhanced schema is available'
      })
    } catch (error) {
      results.push({
        test: 'Enhanced Tables',
        status: 'ERROR',
        details: error
      })
    }

    // Test 6: Test departments API
    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/departments', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()
        results.push({
          test: 'Departments API',
          status: response.ok ? 'PASS' : 'FAIL',
          details: response.ok ? `API returned ${data.length || 0} departments` : data.error
        })
      } catch (error) {
        results.push({
          test: 'Departments API',
          status: 'ERROR',
          details: error
        })
      }
    }

    setTestResults(results)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-100'
      case 'FAIL': return 'text-red-600 bg-red-100'
      case 'ERROR': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Test</h1>
          <p className="text-gray-600">Test the current state of the university assignment system</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user logged in</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">System Tests</h2>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.test}</h3>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{JSON.stringify(result.details)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}