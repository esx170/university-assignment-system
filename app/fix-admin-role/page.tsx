'use client'

import { useState } from 'react'

export default function FixAdminRole() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fixAdminRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/set-admin-role', {
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

  const checkAuthState = async () => {
    try {
      const response = await fetch('/api/debug-auth')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        error: error.message,
        success: false
      })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fix Admin Role</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
        <h2 className="text-yellow-800 font-semibold">Issue:</h2>
        <p className="text-yellow-700">You're logged in but API doesn't recognize you as admin. This usually means the user metadata is missing the admin role.</p>
      </div>

      <div className="space-y-4 mb-6">
        <button 
          onClick={checkAuthState}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Check Current Auth State
        </button>
        
        <button 
          onClick={fixAdminRole}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          {loading ? 'Fixing Admin Role...' : 'Fix Admin Role'}
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
        <h3 className="font-semibold text-blue-800">Steps:</h3>
        <ol className="list-decimal list-inside text-blue-700 mt-2 space-y-1">
          <li>Click "Check Current Auth State" to see what the API sees</li>
          <li>Click "Fix Admin Role" to set the correct admin role in user metadata</li>
          <li>Go back to /admin and test if users load properly</li>
        </ol>
      </div>
    </div>
  )
}