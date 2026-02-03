'use client'

import { useState } from 'react'

export default function FixAdminUser() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createAdminUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/force-create-admin', {
        method: 'POST'
      })
      const data = await response.json()
      setResult({
        status: response.status,
        data: data,
        success: response.ok
      })
    } catch (error: any) {
      setResult({
        error: error.message,
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  const loginAsAdmin = () => {
    // Redirect to login page
    window.location.href = '/auth/signin'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fix Admin User</h1>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
        <h2 className="text-red-800 font-semibold">Issue Detected:</h2>
        <p className="text-red-700">No authenticated user found. Admin user may not exist or you're not logged in.</p>
      </div>

      <div className="space-y-4 mb-6">
        <button 
          onClick={createAdminUser}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating Admin User...' : 'Step 1: Create Admin User'}
        </button>
        
        <button 
          onClick={loginAsAdmin}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 ml-4"
        >
          Step 2: Login as Admin
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="font-semibold text-blue-800">Admin Credentials:</h3>
        <div className="text-blue-700 mt-2">
          <p><strong>Email:</strong> admin@university.edu</p>
          <p><strong>Password:</strong> Admin123!@#</p>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-semibold text-yellow-800">Steps to Fix:</h3>
        <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
          <li>Click "Create Admin User" to ensure the admin user exists</li>
          <li>Click "Login as Admin" to go to the login page</li>
          <li>Login with: admin@university.edu / Admin123!@#</li>
          <li>Go back to /admin to test if it works</li>
        </ol>
      </div>
    </div>
  )
}