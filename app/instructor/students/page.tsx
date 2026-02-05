'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building2, 
  BookOpen, 
  GraduationCap,
  Mail,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function InstructorStudentsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      if (user.role !== 'instructor' && user.role !== 'admin') {
        toast.error('Access denied: Instructor privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser(user)
      setLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="mt-2 text-gray-600">
            Students from your assigned departments
          </p>
        </div>

        {/* Redirect Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                View Students by Department
              </h3>
              <p className="text-blue-700 mt-1">
                Your students are organized by department. Use "My Departments" to see all students in your assigned departments, along with their course enrollments and progress.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/instructor/departments')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Go to My Departments
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Assigned Departments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      View in My Departments
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      View in My Departments
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Course Enrollments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      View in My Departments
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Available */}
        <div className="bg-white shadow rounded-lg mt-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Available in My Departments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Users className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Student Lists</h4>
                  <p className="text-sm text-gray-600">View all students in your assigned departments with their contact information and student IDs.</p>
                </div>
              </div>
              <div className="flex items-start">
                <BookOpen className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Course Enrollments</h4>
                  <p className="text-sm text-gray-600">See which courses each student is enrolled in and their progress.</p>
                </div>
              </div>
              <div className="flex items-start">
                <GraduationCap className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Academic Progress</h4>
                  <p className="text-sm text-gray-600">Track student performance and assignment completion rates.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Contact Information</h4>
                  <p className="text-sm text-gray-600">Access student email addresses and other contact details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}