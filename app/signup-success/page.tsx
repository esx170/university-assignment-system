'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function SignupSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Account created successfully!'

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-green-900">
          🎉 SUCCESS!
        </h2>
        <p className="mt-2 text-center text-sm text-green-600">
          Your account has been created
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-2 border-green-200">
          
          <div className="bg-green-100 border border-green-300 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="font-bold text-green-800">Account Created Successfully!</h3>
            </div>
            <p className="text-green-700 text-sm">
              {message}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Sign In Now
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Please sign in with your email and password to access your account
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}