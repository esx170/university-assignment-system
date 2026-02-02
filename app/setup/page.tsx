'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [adminCreated, setAdminCreated] = useState(false)
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null)

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin')
      }

      setCredentials(result.credentials)
      setAdminCreated(true)
      toast.success('Admin user created successfully!')
    } catch (error: any) {
      console.error('Create admin error:', error)
      toast.error(error.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          System Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create the initial administrator account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!adminCreated ? (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Initial Setup Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This will create the first administrator account for your system.
                        This should only be done once during initial setup.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={createAdmin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Admin User...' : 'Create Admin User'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Admin User Created Successfully!
                    </h3>
                  </div>
                </div>
              </div>

              {credentials && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Admin Credentials:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                        {credentials.email}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Password:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                        {credentials.password}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Next Steps:
                </h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Sign in with the admin credentials</li>
                  <li>Access the admin dashboard at <code>/admin</code></li>
                  <li>Change the admin password after first login</li>
                  <li>Delete this setup page for security</li>
                </ol>
              </div>

              <div className="flex space-x-3">
                <a
                  href="/auth/signin"
                  className="flex-1 text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Go to Sign In
                </a>
                <a
                  href="/admin"
                  className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Admin Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}