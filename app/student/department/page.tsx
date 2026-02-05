'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Upload
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
    active: Enrollment[]
    completed: Enrollment[]
    total: number
  }
  upcoming_assignments: Assignment[]
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

type Enrollment = {
  enrollment_id: string
  enrolled_at: string
  status: string
  final_grade: string | null
  course: {
    id: string
    name: string
    code: string
    description: string
    credits: number
    semester: string
    year: number
    primary_instructor: {
      name: string
      email: string
    } | null
    all_instructors: {
      name: string
      email: string
      is_primary: boolean
    }[]
    department: {
      name: string
      code: string
    }
  }
  assignments: Assignment[]
  progress: {
    total_assignments: number
    completed_assignments: number
    completion_rate: number
  }
}

type Assignment = {
  id: string
  title: string
  description: string
  due_date: string
  max_points: number
  status: string
  course_id: string
  courses: {
    name: string
    code: string
  }
  submission: any
  is_submitted: boolean
  is_graded: boolean
}

export default function StudentDepartmentPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
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
        console.error('Failed to load student data:', response.statusText)
        toast.error('Failed to load course information')
      }
    } catch (error: any) {
      console.error('Load student data error:', error)
      toast.error(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/student/courses/${courseId}`)
  }

  const handleViewAssignment = (assignmentId: string) => {
    router.push(`/student/assignments/${assignmentId}`)
  }

  const handleSubmitAssignment = (assignmentId: string) => {
    router.push(`/assignments/${assignmentId}/submit`)
  }

  const getAssignmentStatusBadge = (assignment: Assignment) => {
    if (assignment.is_graded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Graded
        </span>
      )
    }
    
    if (assignment.is_submitted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Submitted
        </span>
      )
    }

    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    
    if (now > dueDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your department information...</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Department Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Unable to load your department and course information.
          </p>
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
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {studentData.student.department.name}
              </h1>
              <p className="text-gray-600">
                {studentData.student.department.code} • {studentData.student.name} ({studentData.student.student_id})
              </p>
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            {studentData.student.department.description}
          </p>
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
                  <FileText className="h-6 w-6 text-green-600" />
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
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentData.summary.completed_assignments}
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
                  <AlertCircle className="h-6 w-6 text-orange-600" />
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

        {/* Upcoming Assignments */}
        {studentData.upcoming_assignments.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upcoming Assignments
              </h3>
              <div className="space-y-3">
                {studentData.upcoming_assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">
                          {assignment.title}
                        </h4>
                        {getAssignmentStatusBadge(assignment)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {assignment.courses.code} - {assignment.courses.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(assignment.due_date).toLocaleDateString()} at {new Date(assignment.due_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewAssignment(assignment.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!assignment.is_submitted && (
                        <button
                          onClick={() => handleSubmitAssignment(assignment.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                {currentEnrollments.map((enrollment) => (
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

                    <div className="flex justify-between">
                      <button
                        onClick={() => handleViewCourse(enrollment.course.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                      >
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