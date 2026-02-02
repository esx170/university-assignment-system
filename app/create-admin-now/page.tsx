'use client'

import { useState } from 'react'

export default function CreateAdminNowPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createAdminNow = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-admin-direct', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to create admin' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Admin User</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Click the button below to create the admin user with these credentials:
            </p>
            <div className="bg-blue-50 p-4 rounded border">
              <p><strong>Email:</strong> admin@university.edu</p>
              <p><strong>Password:</strong> Admin123!@#</p>
            </div>
          </div>

          <button
            onClick={createAdminNow}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating Admin User...' : 'Create Admin User Now'}
          </button>

          {result && (
            <div className="mt-6">
              {result.success ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h3 className="font-bold text-green-800 mb-2">✅ Success!</h3>
                  <p className="text-green-700 mb-4">{result.message}</p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> admin@university.edu</p>
                    <p><strong>Password:</strong> Admin123!@#</p>
                  </div>
                  <div className="mt-4 space-x-4">
                    <a
                      href="/auth/signin"
                      className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Go to Sign In
                    </a>
                    <a
                      href="/admin"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Admin Dashboard
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <h3 className="font-bold text-red-800 mb-2">❌ Error</h3>
                  <p className="text-red-700">{result.error}</p>
                  {result.details && (
                    <pre className="text-sm mt-2 bg-red-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Click "Create Admin User Now" above</li>
            <li>Wait for success message</li>
            <li>Go to Sign In page</li>
            <li>Login with admin@university.edu / Admin123!@#</li>
            <li>Access /admin dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  )
}