'use client'

import { useState } from 'react'

export default function SetAdminPage() {
  const [email, setEmail] = useState('admin@university.edu')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const setAdminRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/set-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
            Set Admin Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Update user metadata to set admin role
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                User Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="admin@university.edu"
                />
              </div>
            </div>

            <div>
              <button
                onClick={setAdminRole}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Setting Admin Role...' : 'Set as Admin'}
              </button>
            </div>

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
                          <p><strong>Email:</strong> {email}</p>
                          <p><strong>Password:</strong> Admin123!@# (if you created it manually)</p>
                          <div className="mt-4 space-x-4">
                            <a
                              href="/auth/signin"
                              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                            >
                              Go to Sign In
                            </a>
                            <a
                              href="/admin"
                              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
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
              <h4 className="font-medium mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Make sure you created the user admin@university.edu in Supabase</li>
                <li>Click "Set as Admin" to update the user metadata</li>
                <li>Try logging in with the credentials</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}