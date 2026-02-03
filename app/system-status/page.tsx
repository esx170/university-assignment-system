'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function SystemStatusPage() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const user = await getCurrentUserWithAuth()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  const runFullDiagnostics = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // Test 1: Database structure
      console.log('Testing database structure...')
      const dbResponse = await fetch('/api/test-db')
      results.database = await dbResponse.json()

      // Test 2: Admin user check
      console.log('Checking admin user...')
      const adminResponse = await fetch('/api/check-admin')
      results.adminCheck = await adminResponse.json()

      // Test 3: Authentication test
      console.log('Testing authentication...')
      const authResponse = await fetch('/api/debug-auth')
      results.authTest = await authResponse.json()

      // Test 4: Departments API
      console.log('Testing departments API...')
      const deptResponse = await fetch('/api/departments')
      results.departments = await deptResponse.json()

      // Test 5: Current user session
      const { data: { session } } = await supabase.auth.getSession()
      results.session = {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        } : null,
        hasToken: !!session?.access_token
      }

      setStatus(results)
    } catch (error: any) {
      toast.error(`Diagnostics failed: ${error.message}`)
      setStatus({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fixAdminUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-admin', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        toast.success('Admin user fixed successfully!')
        setStatus((prev: any) => ({ ...prev, adminFix: result }))
      } else {
        toast.error(`Failed to fix admin: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Fix admin failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAdminLogin = async () => {
    setLoading(true)
    try {
      const result = await signIn('admin@university.edu', 'Admin123!@#')
      if (result.user) {
        toast.success('Admin login successful!')
        await checkCurrentUser()
        // Refresh the page to update all components
        window.location.reload()
      }
    } catch (error: any) {
      toast.error(`Admin login failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAdminAPI = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('No authentication token found')
        return
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`Admin API working! Found ${result.length} users`)
        setStatus((prev: any) => ({ ...prev, adminAPI: { success: true, users: result } }))
      } else {
        toast.error(`Admin API failed: ${result.error}`)
        setStatus((prev: any) => ({ ...prev, adminAPI: { success: false, error: result.error } }))
      }
    } catch (error: any) {
      toast.error(`Admin API test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status & Diagnostics</h1>
        
        {/* Current User Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
          {currentUser ? (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
              <p><strong>Name:</strong> {currentUser.full_name}</p>
              <p><strong>Is Admin:</strong> {currentUser.email === 'admin@university.edu' ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p>No user currently logged in</p>
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        {currentUser && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/admin"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-center"
              >
                Admin Panel
              </a>
              <a
                href="/courses"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
              >
                All Courses
              </a>
              <a
                href="/courses/create"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
              >
                Create Course
              </a>
              <a
                href="/admin/settings"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
              >
                Settings
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={runFullDiagnostics}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Run Diagnostics
            </button>
            <button
              onClick={fixAdminUser}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Fix Admin User
            </button>
            <button
              onClick={testAdminLogin}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Test Admin Login
            </button>
            <button
              onClick={testAdminAPI}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Test Admin API
            </button>
          </div>
        </div>

        {/* Results */}
        {Object.keys(status).length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">System Setup Instructions</h2>
          <div className="space-y-4 text-blue-800">
            <div className="bg-white p-4 rounded border-l-4 border-blue-500">
              <h3 className="font-semibold mb-2">🚀 Quick Start (Current State)</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Fix Admin User" to ensure admin account exists</li>
                <li>Click "Test Admin Login" to sign in as admin</li>
                <li>Click "Test Admin API" to verify admin permissions work</li>
                <li>Use Quick Navigation links to test the system</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-500">
              <h3 className="font-semibold mb-2">⚠️ Current Limitations</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Departments table doesn't exist - using mock data</li>
                <li>Courses are mock data - will work but not persist</li>
                <li>User profiles exist but without department assignments</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
              <h3 className="font-semibold mb-2">✅ What's Working</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Admin authentication and user management</li>
                <li>Course creation and listing (mock data)</li>
                <li>Role-based access control</li>
                <li>All UI components and navigation</li>
              </ul>
            </div>

            <div className="bg-red-50 p-4 rounded border-l-4 border-red-500">
              <h3 className="font-semibold mb-2">🔧 For Full Functionality</h3>
              <p className="mb-2"><strong>Apply Database Schema:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Copy contents of <code className="bg-gray-200 px-1 rounded">supabase/schema.sql</code></li>
                <li>Run the SQL to create departments, courses, and other tables</li>
                <li>Refresh this page and run diagnostics again</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-500">
              <h3 className="font-semibold mb-2">🔑 Admin Credentials</h3>
              <p><strong>Email:</strong> admin@university.edu</p>
              <p><strong>Password:</strong> Admin123!@#</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}