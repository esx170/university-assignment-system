'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, UserPlus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Department = {
  id: string
  name: string
  code: string
  description: string
}

export default function EmergencySignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    student_id: '',
    department_id: ''
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/public/departments');
      
      if (response.ok) {
        const realDepartments = await response.json();
        if (realDepartments && realDepartments.length > 0) {
          setDepartments(realDepartments);
          return;
        }
      }
      
      // Fallback to hardcoded departments
      const hardcodedDepartments = [
        { id: '1', name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Engineering' },
        { id: '2', name: 'Mathematics', code: 'MATH', description: 'Department of Mathematics' },
        { id: '3', name: 'Physics', code: 'PHYS', description: 'Department of Physics' },
        { id: '4', name: 'Business Administration', code: 'BUS', description: 'School of Business Administration' },
        { id: '5', name: 'Development Economics', code: 'DECON', description: 'Department of Development Economics' },
        { id: '6', name: 'Software Engineering', code: 'SE', description: 'Department of Software Engineering' }
      ]
      
      setDepartments(hardcodedDepartments)
    } catch (error) {
      console.error('Error loading departments:', error)
      setDepartments([
        { id: '1', name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Engineering' }
      ])
    } finally {
      setLoadingDepartments(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (!formData.department_id) {
      toast.error('Please select a department')
      return
    }

    setLoading(true)

    try {
      console.log('Using EMERGENCY signup method...')
      
      const response = await fetch('/api/emergency-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          student_id: formData.student_id,
          department_id: formData.department_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('🎉 Account created successfully with emergency method!')
        // Store temporary auth for emergency signin
        if (data.tempAuth) {
          localStorage.setItem('emergency_auth', JSON.stringify(data.tempAuth))
        }
        router.push('/signup-success?message=Account created successfully with emergency method!')
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error: any) {
      console.error('Emergency signup error:', error)
      toast.error('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          🚨 EMERGENCY SIGNUP
        </h2>
        <p className="mt-2 text-center text-sm text-red-600">
          Bypassing broken Supabase auth system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-2 border-red-200">
          
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-bold text-red-800">Emergency Mode Active</h3>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This bypasses the broken Supabase auth and creates accounts directly in the database.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  placeholder="john.doe@student.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <div className="mt-1">
                <input
                  id="student_id"
                  name="student_id"
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="STU001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <div className="mt-1">
                {loadingDepartments ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
                ) : (
                  <select
                    id="department_id"
                    name="department_id"
                    required
                    value={formData.department_id}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                )}
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Password (min. 6 characters)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || loadingDepartments}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : '🚨 CREATE EMERGENCY ACCOUNT'}
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
                onClick={() => router.push('/emergency-signin')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Emergency Sign In
              </button>
              
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Normal Signup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}