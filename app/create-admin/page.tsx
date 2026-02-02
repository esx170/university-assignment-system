'use client'

import { useState } from 'react'

export default function CreateAdminPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-admin', {
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
        <h1 className="text-2xl font-bold mb-6">Create Admin User</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={createAdmin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">Manual Method (Recommended):</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Go to Supabase Dashboard → Authentication → Users</li>
            <li>Create a student account via your app's signup first</li>
            <li>Click on the user → Edit "Raw User Meta Data"</li>
            <li>Change the JSON to: <code>{`{"role": "admin", "full_name": "Admin User"}`}</code></li>
            <li>Save and login with that user's credentials</li>
          </ol>
        </div>
      </div>
    </div>
  )
}