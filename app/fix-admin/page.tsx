'use client'

import { useState } from 'react'

export default function FixAdminPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const forceAdminRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/force-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'admin@university.edu' }),
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to set admin role' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Fix Admin Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Force set admin role for admin@university.edu
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-sm text-yellow-800">
                This will force set the admin role for admin@university.edu in the database.
                Use this if you're logged in as admin@university.edu but getting "Unauthorized" errors.
              </p>
            </div>

            <button
              onClick={forceAdminRole}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Setting Admin Role...' : 'Force Set Admin Role'}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex">
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? '✅ Success!' : '❌ Error'}
                    </h3>
                    <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      <p>{result.message || result.error}</p>
                      {result.success && (
                        <div className="mt-4 space-y-2">
                          <p><strong>Now try:</strong></p>
                          <div className="space-x-4">
                            <a
                              href="/whoami"
                              className="inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                            >
                              Check User Info
                            </a>
                            <a
                              href="/admin"
                              className="inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                            >
                              Admin Dashboard
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-2">Troubleshooting Steps:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>First check <a href="/whoami" className="text-blue-600 hover:underline">Who Am I</a> to see your current user info</li>
                <li>If you're not admin@university.edu, sign out and sign in with the correct account</li>
                <li>If you are admin@university.edu but role is not "admin", click the button above</li>
                <li>After fixing, try the <a href="/admin" className="text-blue-600 hover:underline">Admin Dashboard</a></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}