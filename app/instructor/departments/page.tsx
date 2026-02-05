'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Plus,
  Eye,
  ChevronRight,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'

type Department = {
  id: string
  name: string
  code: string
  description: string
  is_primary: boolean
  assigned_at: string
  courses: Course[]
  students: Student[]
  course_count: number
  student_count: number
  assigned_course_count: number
}

type Course = {
  id: string
  name: string
  code: string
  description: string
  credits: number
  semester: string
  year: number
  is_assigned_to_instructor: boolean
  enrollment_count: number
  enrolled_students: string[]
}

type Student = {
  id: string
  full_name: string
  email: string
  student_id: string
  is_active: boolean
}

type InstructorData = {
  instructor: {
    id: string
    name: string
    email: string
  }
  departments: Department[]
  summary: {
    total_departments: number
    total_courses: number
    total_assigned_courses: number
    total_students: number
  }
}

export default function InstructorDepartmentsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
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

      if (user.role !== 'instructor' && user.role !== 'admin') {
        toast.error('Access denied: Instructor privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser(user)
      await loadInstructorData()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadInstructorData = async () => {
    try {
      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      
      if (!sessionData) {
        console.error('No custom session found')
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        console.error('Session expired')
        toast.error('Session expired - please sign in again')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_data')
        router.push('/auth/signin')
        return
      }

      const response = await fetch('/api/instructor/departments', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstructorData(data)
        
        // Auto-select first department if available
        if (data.departments && data.departments.length > 0) {
          setSelectedDepartment(data.departments[0].id)
        }
      } else {
        console.error('Failed to load instructor data:', response.statusText)
        toast.error('Failed to load department information')
      }
    } catch (error: any) {
      console.error('Load instructor data error:', error)
      toast.error(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = (courseId: string) => {
    router.push(`/assignments/create?courseId=${courseId}`)
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/instructor/students/${studentId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your departments...</p>
        </div>
      </div>
    )
  }

  if (!instructorData || instructorData.departments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Department Assignments</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't been assigned to any departments yet. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  const selectedDept = instructorData.departments.find(dept => dept.id === selectedDepartment)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Departments</h1>
          <p className="mt-2 text-gray-600">
            Manage courses and students in your assigned departments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Departments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {instructorData.summary.total_departments}
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
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Assigned Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {instructorData.summary.total_assigned_courses}
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
                      Total Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {instructorData.summary.total_courses}
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
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {instructorData.summary.total_students}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Department List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Departments</h3>
                <div className="space-y-2">
                  {instructorData.departments.map((department) => (
                    <button
                      key={department.id}
                      onClick={() => setSelectedDepartment(department.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDepartment === department.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">
                              {department.code}
                            </span>
                            {department.is_primary && (
                              <Star className="w-4 h-4 text-yellow-500 ml-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {department.name}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{department.assigned_course_count} courses</span>
                        <span>{department.student_count} students</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Department Details */}
          <div className="lg:col-span-3">
            {selectedDept && (
              <div className="space-y-6">
                {/* Department Info */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedDept.name}
                          </h2>
                          {selectedDept.is_primary && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{selectedDept.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Assigned on {new Date(selectedDept.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedDept.code}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courses */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Courses ({selectedDept.course_count})
                    </h3>
                    {selectedDept.courses.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No courses in this department
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDept.courses.map((course) => (
                          <div
                            key={course.id}
                            className={`border rounded-lg p-4 ${
                              course.is_assigned_to_instructor
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="font-medium text-gray-900">
                                    {course.code}
                                  </h4>
                                  {course.is_assigned_to_instructor && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {course.name}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {course.semester} {course.year}
                                  <span className="mx-2">•</span>
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  {course.credits} credits
                                  <span className="mx-2">•</span>
                                  <Users className="w-3 h-3 mr-1" />
                                  {course.enrollment_count} students
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => handleViewCourse(course.id)}
                                className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                <Eye className="w-3 h-3 inline mr-1" />
                                View
                              </button>
                              {course.is_assigned_to_instructor && (
                                <button
                                  onClick={() => handleCreateAssignment(course.id)}
                                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  <Plus className="w-3 h-3 inline mr-1" />
                                  Assignment
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Students */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Students ({selectedDept.student_count})
                    </h3>
                    {selectedDept.students.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No students in this department
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedDept.students.map((student) => (
                          <div
                            key={student.id}
                            className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {student.full_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  ID: {student.student_id}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {student.email}
                                </p>
                              </div>
                              <button
                                onClick={() => handleViewStudent(student.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}