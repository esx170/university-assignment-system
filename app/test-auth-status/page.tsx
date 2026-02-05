'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { CheckCircle, XCircle, User, RefreshCw } from 'lucide-react'

export default function TestAuthStatusPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

  const loadAuthStatus = async () => {
    setLoading(true)
    try {
      // Check localStorage data
      const session = localStorage.getItem('user_session')
      const user = localStorage.getItem('user_data')
      
      setSessionData(session ? JSON.parse(session) : null)
      setUserData(user ? JSON.parse(user) : null)

      // Test getCurrentUser function
      const currentUser = await getCurrentUser()
      setProfile(currentUser)
      
      console.log('Auth status check:', {
        hasSession: !!session,
        hasUserData: !!user,
        getCurrentUserResult: currentUser
      })
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthStatus()
  }, [])

  const clearAuth = () => {
    localStorage.removeItem('user_session')
    localStorage.removeItem('user_data')
    setSessionData(null)
    setUserData(null)
    setProfile(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <User className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auth Status Test</h1>
              <p className="text-gray-600">Check if authentication is working</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Auth Status */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex items-center mb-3">
                {profile ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <h3 className="font-bold text-gray-800">
                  Authentication Status: {profile ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}
                </h3>
              </div>
              
              {loading && (
                <div className="flex items-center text-gray-600">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking authentication...
                </div>
              )}
            </div>

            {/* Current User */}
            {profile && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-3">Current User (from getCurrentUser()):</h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>ID:</strong> {profile.id}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Name:</strong> {profile.full_name}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Student ID:</strong> {profile.student_id || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Session Data */}
            {sessionData && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-3">Session Data (localStorage):</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Token:</strong> {sessionData.token?.substring(0, 30)}...</p>
                  <p><strong>Expires:</strong> {new Date(sessionData.expires).toLocaleString()}</p>
                  <p><strong>Valid:</strong> {new Date(sessionData.expires) > new Date() ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}

            {/* User Data */}
            {userData && (
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-3">User Data (localStorage):</h3>
                <div className="space-y-1 text-sm text-purple-700">
                  <p><strong>ID:</strong> {userData.id}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Name:</strong> {userData.full_name}</p>
                  <p><strong>Role:</strong> {userData.role}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={loadAuthStatus}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Refresh Status
              </button>
              
              <button
                onClick={clearAuth}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Auth Data
              </button>

              <a
                href="/dashboard"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Go to Dashboard
              </a>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-2">How to Test:</h3>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Sign up at <code>/auth/signup</code></li>
                <li>2. Sign in at <code>/auth/signin</code></li>
                <li>3. Come back to this page to see auth status</li>
                <li>4. Try going to <code>/dashboard</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}