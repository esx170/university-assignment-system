'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Building2, 
  Calendar, 
  GraduationCap,
  Users,
  FileText,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

type StudentData = {
  student: {
    id: string
    name: string
    email: string
    student_id: string
    department: {
      id: string
      name: string
      code: string
      description: string
    }
  }
  enrollments: {
    active: any[]
    completed: any[]
    total: number
  }
  upcoming_assignments: any[]
  summary: {
    total_courses: number
    active_courses: number
    completed_courses: number
    total_assignments: number
    completed_assignments: number
    pending_assignments: number
    upcoming_deadlines: number
  }
}

export default function StudentCoursesPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
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

      if (user.role !== 'student' && user.role !== 'admin') {
        toast.error('Access denied: Student privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser(user)
      await loadStudentData()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadStudentData = async () => {
    try {
      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        console.error('No custom session found')
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        console.error('Session expired')
        toast.error('Session expired - please sign in again')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_data')
        router.push('/auth/signin')
        return
      }

      const response = await fetch('/api/student/courses', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudentData(data)
      } else {
        const error = await response.json()
        console.error('Failed to load student data:', error)
        toast.error(`Failed to load course information: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Load student data error:', error)
      toast.error(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Course Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Unable to load your course information. Please try again later.
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push('/student/department')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View My Department
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentEnrollments = activeTab === 'active' ? studentData.enrollments.active : studentData.enrollments.completed

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="mt-2 text-gray-600">
                {studentData.student.department.code} - {studentData.student.department.name}
              </p>
            </div>
            <button
              onClick={() => router.push('/student/department')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Building2 className="w-4 h-4 mr-2" />
              My Department
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentData.summary.active_courses}
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
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentData.summary.completed_courses}
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
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Assignments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentData.summary.total_assignments}
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
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Deadlines
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentData.summary.upcoming_deadlines}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Courses ({studentData.enrollments.active.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Courses ({studentData.enrollments.completed.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {currentEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {activeTab} courses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'active' 
                    ? "You're not enrolled in any active courses."
                    : "You haven't completed any courses yet."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentEnrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.enrollment_id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {enrollment.course.code}
                        </h3>
                        <p className="text-gray-600">{enrollment.course.name}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {enrollment.course.semester} {enrollment.course.year}
                          <span className="mx-2">•</span>
                          <GraduationCap className="w-4 h-4 mr-1" />
                          {enrollment.course.credits} credits
                        </div>
                      </div>
                      {enrollment.final_grade && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Grade: {enrollment.final_grade}
                        </span>
                      )}
                    </div>

                    {enrollment.course.primary_instructor && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Instructor:</strong> {enrollment.course.primary_instructor.name}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {enrollment.progress.completed_assignments}/{enrollment.progress.total_assignments} assignments
                        </span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progress.completion_rate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {enrollment.progress.completion_rate}% complete
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleViewCourse(enrollment.course.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Course
                      </button>
                      <div className="text-xs text-gray-500">
                        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}