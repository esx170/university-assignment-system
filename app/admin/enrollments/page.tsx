'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  BookOpen, 
  Building2,
  Calendar,
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  status: string
  student_name: string
  course_name: string
  course_code: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function EnrollmentsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Check custom session
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        console.error('No session found, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)
      
      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        console.error('Session expired, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      // Check if user is admin
      if (user.role !== 'admin' && user.email !== 'admin@university.edu') {
        console.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      })

      await loadEnrollmentData(session.token)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadEnrollmentData = async (authToken: string) => {
    try {
      // Load enrollments
      const enrollmentsResponse = await fetch('/api/admin/enrollments', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json()
        if (Array.isArray(enrollmentsData)) {
          setEnrollments(enrollmentsData)
        } else if (enrollmentsData.enrollments) {
          setEnrollments(enrollmentsData.enrollments)
        }
      }

      // Load students for enrollment form
      const studentsResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (studentsResponse.ok) {
        const usersData = await studentsResponse.json()
        const studentUsers = usersData.filter((user: any) => user.role === 'student')
        setStudents(studentUsers)
      }

      // Load courses for enrollment form
      const coursesResponse = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }

    } catch (error) {
      console.error('Error loading enrollment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudent || selectedCourses.length === 0) {
      alert('Please select a student and at least one course')
      return
    }

    try {
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) return

      const session = JSON.parse(sessionData)

      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          course_ids: selectedCourses
        })
      })

      if (response.ok) {
        alert('Student enrolled successfully!')
        setShowEnrollForm(false)
        setSelectedStudent('')
        setSelectedCourses([])
        // Reload data
        await loadEnrollmentData(session.token)
      } else {
        const error = await response.json()
        alert(`Enrollment failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      alert('Enrollment failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enrollments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Enrollments</h1>
            <p className="mt-2 text-gray-600">
              Manage student course enrollments and capacity
            </p>
          </div>
          <button
            onClick={() => setShowEnrollForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Student
          </button>
        </div>

        {/* Enrollment Form Modal */}
        {showEnrollForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enroll Student</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Choose a student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Courses
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {courses.map(course => (
                      <label key={course.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses([...selectedCourses, course.id])
                            } else {
                              setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {course.code} - {course.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEnrollForm(false)
                    setSelectedStudent('')
                    setSelectedCourses([])
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnrollStudent}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Enroll Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Enrollments Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by enrolling students in courses using the button above.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Available: {students.length} students, {courses.length} courses</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Current Enrollments ({enrollments.length})
                </h3>
                <div className="grid gap-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {enrollment.student_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {enrollment.course_code} - {enrollment.course_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {enrollment.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              {enrollment.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Enrollments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {enrollments.length}
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
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {courses.length}
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
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {students.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}