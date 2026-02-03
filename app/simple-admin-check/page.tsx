'use client'

import { useState } from 'react'

export default function SimpleAdminCheck() {
  const [result, setResult] = useState<any>(null)

  const checkAuth = async () => {
    try {
      // Test the API directly
      const response = await fetch('/api/admin/users')
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
      <h1 className="text-2xl font-bold mb-6">Simple Admin Check</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={checkAuthState}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Check Auth State
        </button>
        
        <button 
          onClick={checkAuth}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
        >
          Test Admin API
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 mt-2">
          <li>Make sure you're logged in as admin@university.edu</li>
          <li>Click "Check Auth State" to see authentication status</li>
          <li>Click "Test Admin API" to test the admin users API</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  )
}