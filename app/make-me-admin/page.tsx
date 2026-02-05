'use client'

import { useState } from 'react'
import { Shield, UserCheck, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MakeMeAdminPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Email is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`${email} is now an admin!`)
        setResult(data)
      } else {
        toast.error(data.error || 'Failed to make user admin')
        setResult(data)
      }
    } catch (error: any) {
      console.error('Make admin error:', error)
      toast.error('Failed to make user admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-900">
          Make User Admin
        </h2>
        <p className="mt-2 text-center text-sm text-blue-600">
          Grant admin privileges to any user
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-2 border-blue-200">
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-bold text-blue-800">Admin Access</h3>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Enter the email of a user who has already signed up to make them an admin.
            </p>
          </div>

          <form onSubmit={handleMakeAdmin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                User Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="w-5 h-5 mr-2" />
                {loading ? 'Making Admin...' : 'Make Admin'}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </h3>
              <pre className="text-sm overflow-auto bg-white p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              The user must have already signed up before you can make them an admin
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Quick Actions</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <a
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Account
              </a>
              
              <a
                href="/admin/users"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to User Management
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}