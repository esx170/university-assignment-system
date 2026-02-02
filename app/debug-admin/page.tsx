'use client'

import { useState } from 'react'

export default function DebugAdminPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async (endpoint: string) => {
    setLoading(true)
    try {
      console.log(`Testing ${endpoint}...`)
      const response = await fetch(endpoint)
      const data = await response.json()
      
      setResult({
        endpoint,
        status: response.status,
        ok: response.ok,
        data
      })
    } catch (error: any) {
      setResult({
        endpoint,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin API Debug</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={() => testAPI('/api/debug-env')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mr-4"
          >
            Test Environment Variables
          </button>
          
          <button
            onClick={() => testAPI('/api/test-admin')}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mr-4"
          >
            Test Admin User Exists
          </button>
          
          <button
            onClick={() => testAPI('/api/admin/users')}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 mr-4"
          >
            Test Admin Users API
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Testing API...</p>
          </div>
        )}

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Test Result</h2>
            <div className="space-y-2 mb-4">
              <p><strong>Endpoint:</strong> {result.endpoint}</p>
              {result.status && <p><strong>Status:</strong> {result.status}</p>}
              {result.ok !== undefined && <p><strong>OK:</strong> {result.ok ? 'Yes' : 'No'}</p>}
            </div>
            
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">Debug Steps:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>First test "Environment Variables" to check if Supabase keys are set</li>
            <li>Then test "Admin User Exists" to see if the admin user was created</li>
            <li>Finally test "Admin Users API" to see the actual error</li>
            <li>Check browser console for additional error messages</li>
          </ol>
        </div>
      </div>
    </div>
  )
}