'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, LogIn, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmergencySigninPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required')
      return
    }

    setLoading(true)

    try {
      console.log('Using EMERGENCY signin method...')
      
      const response = await fetch('/api/emergency-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('🎉 Signed in successfully with emergency method!')
        // Store session info
        if (data.session) {
          localStorage.setItem('emergency_session', JSON.stringify(data.session))
          localStorage.setItem('emergency_user', JSON.stringify(data.user))
        }
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Failed to sign in')
      }
    } catch (error: any) {
      console.error('Emergency signin error:', error)
      toast.error('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-red-900">
          🚨 EMERGENCY SIGNIN
        </h2>
        <p className="mt-2 text-center text-sm text-red-600">
          Sign in to your emergency account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-2 border-red-200">
          
          {message && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm">{message}</p>
              </div>
            </div>
          )}

          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-bold text-red-800">Emergency Mode Active</h3>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This uses the emergency authentication system that bypasses broken Supabase auth.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {loading ? 'Signing In...' : '🚨 EMERGENCY SIGN IN'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Emergency Options</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/emergency-signup')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Create Emergency Account
              </button>
              
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Normal Sign In
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}