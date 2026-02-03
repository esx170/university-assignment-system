'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, getCurrentUserWithAuth, isAdmin } from '@/lib/auth'

export default function TestAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testAuth()
  }, [])

  const testAuth = async () => {
    try {
      console.log('=== Testing Authentication ===')
      
      const user1 = await getCurrentUser()
      const user2 = await getCurrentUserWithAuth()
      
      console.log('getCurrentUser:', user1)
      console.log('getCurrentUserWithAuth:', user2)
      
      const isAdminResult = isAdmin(user1)
      console.log('isAdmin result:', isAdminResult)
      
      setAuthState({
        getCurrentUser: user1,
        getCurrentUserWithAuth: user2,
        isAdmin: isAdminResult,
        adminEmail: 'admin@university.edu',
        emailMatch: user1?.email === 'admin@university.edu'
      })
    } catch (error) {
      console.error('Auth test error:', error)
      setAuthState({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      console.log('API Response:', response.status, data)
      alert(`API Response: ${response.status} - ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('API test error:', error)
      alert(`API Error: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="p-8">Loading auth test...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Authentication State:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <button 
          onClick={testAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Auth Test
        </button>
        
        <button 
          onClick={testApiCall}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
        >
          Test Admin API Call
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2">
          <li>Make sure you're logged in as admin@university.edu</li>
          <li>Check the authentication state above</li>
          <li>Test the API call to see if it works</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  )
}