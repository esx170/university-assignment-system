'use client'

import { useState } from 'react'

export default function LocalAdminPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const checkEnv = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-env')
      const data = await response.json()
      setResult(data)
      setStep(2)
    } catch (error) {
      setResult({ error: 'Failed to check environment' })
    } finally {
      setLoading(false)
    }
  }

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/create-admin-direct', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
      if (data.success) {
        setStep(3)
      }
    } catch (error) {
      setResult({ error: 'Failed to create admin' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Local Development - Admin Setup</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Step 1: Check Environment Variables</h2>
            <button
              onClick={checkEnv}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && step === 1 ? 'Checking...' : 'Check Environment'}
            </button>
            
            {step >= 2 && result && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Environment Status:</h3>
                <div className="text-sm space-y-1">
                  <p>✅ Supabase URL: {result.environment?.hasSupabaseUrl ? 'Found' : '❌ Missing'}</p>
                  <p>✅ Service Key: {result.environment?.hasServiceKey ? 'Found' : '❌ Missing'}</p>
                  <p>✅ Environment: {result.environment?.nodeEnv}</p>
                </div>
              </div>
            )}
          </div>

          {step >= 2 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Step 2: Create Admin User</h2>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800">
                  <strong>Admin Credentials:</strong><br/>
                  Email: admin@university.edu<br/>
                  Password: Admin123!@#
                </p>
              </div>
              
              <button
                onClick={createAdmin}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading && step === 2 ? 'Creating Admin...' : 'Create Admin User'}
              </button>
            </div>
          )}

          {step >= 3 && result?.success && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Admin Created Successfully!</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800">
                    <strong>Login Credentials:</strong><br/>
                    Email: admin@university.edu<br/>
                    Password: Admin123!@#
                  </p>
                </div>
                
                <div className="space-x-4">
                  <a
                    href="/auth/signin"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Go to Sign In
                  </a>
                  <a
                    href="/admin"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Admin Dashboard
                  </a>
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Error</h2>
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">{result.error}</p>
                {result.details && (
                  <pre className="text-sm mt-2 bg-red-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Manual Alternative (if API fails):</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://supabase.com/dashboard" className="underline" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
              <li>Select your project: jcbnprvpceywmkfdcyyy</li>
              <li>Go to Authentication → Users</li>
              <li>Click Add user</li>
              <li>Email: admin@university.edu, Password: Admin123!@#</li>
              <li>Check Auto Confirm User</li>
              <li>After creating, edit user metadata</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}