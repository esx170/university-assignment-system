'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function QuickTestPage() {
  const [loading, setLoading] = useState(false)

  const loginAsAdmin = async () => {
    setLoading(true)
    try {
      const result = await signIn('admin@university.edu', 'Admin123!@#')
      if (result.user) {
        toast.success('Admin login successful!')
        window.location.href = '/admin'
      }
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Quick System Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={loginAsAdmin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login as Admin & Go to Admin Panel'}
          </button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Or navigate directly:</p>
            <div className="space-y-2">
              <a href="/admin" className="block bg-red-100 text-red-800 px-3 py-2 rounded hover:bg-red-200">
                Admin Panel
              </a>
              <a href="/courses" className="block bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200">
                All Courses
              </a>
              <a href="/auth/signin" className="block bg-green-100 text-green-800 px-3 py-2 rounded hover:bg-green-200">
                Sign In Page
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Admin Credentials:</h3>
          <p className="text-sm">Email: admin@university.edu</p>
          <p className="text-sm">Password: Admin123!@#</p>
        </div>
      </div>
    </div>
  )
}