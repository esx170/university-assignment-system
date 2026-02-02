'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'

export default function WhoAmIPage() {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [rawUserData, setRawUserData] = useState<any>(null)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // Also get raw Supabase user data
      const { supabase } = await import('@/lib/supabase')
      const { data: { user: rawUser } } = await supabase.auth.getUser()
      setRawUserData(rawUser)
      
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Who Am I? - User Debug</h1>
        
        <div className="space-y-6">
          {/* Processed User Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Processed User Data (from getCurrentUser)</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Full Name:</strong> {user.full_name}</p>
                <p><strong>Role:</strong> <span className={`px-2 py-1 rounded ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span></p>
                <p><strong>Student ID:</strong> {user.student_id || 'N/A'}</p>
                <p><strong>Created At:</strong> {user.created_at.toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-600">No user data found - not logged in</p>
            )}
          </div>

          {/* Raw Supabase User Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Raw Supabase User Data</h2>
            {rawUserData ? (
              <div className="space-y-4">
                <div>
                  <p><strong>Email:</strong> {rawUserData.email}</p>
                  <p><strong>Email Confirmed:</strong> {rawUserData.email_confirmed_at ? 'Yes' : 'No'}</p>
                  <p><strong>Created At:</strong> {rawUserData.created_at}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">User Metadata:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(rawUserData.user_metadata, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold">App Metadata:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(rawUserData.app_metadata, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-red-600">No raw user data found</p>
            )}
          </div>

          {/* Admin Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Status Check</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>Is Hardcoded Admin Email:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded ${user.email === 'admin@university.edu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.email === 'admin@university.edu' ? 'YES' : 'NO'}
                  </span>
                </p>
                <p><strong>Current Role:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.role}
                  </span>
                </p>
                <p><strong>Should Have Admin Access:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded ${user.email === 'admin@university.edu' && user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.email === 'admin@university.edu' && user.role === 'admin' ? 'YES' : 'NO'}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-red-600">Not logged in</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <a
                href="/set-admin"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Set Admin Role
              </a>
              <a
                href="/auth/signin"
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Sign In Again
              </a>
              <a
                href="/admin"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Try Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}