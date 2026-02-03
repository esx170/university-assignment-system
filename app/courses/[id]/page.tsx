'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, Calendar, FileText, ArrowLeft, Plus } from 'lucide-react'

type Course = {
  id: string
  name: string
  code: string
  description: string
  semester: string
  year: number
  credits: number
  instructor: {
    full_name: string
    email: string
  }
  enrollments: any[]
  assignments: any[]
}

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadCourse()
  }, [params.id])

  const loadCourse = async () => {
    try {
      // Mock course data for now
      const mockCourse: Course = {
        id: params.id,
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'This course introduces students to the fundamental concepts of computer science, including programming basics, data structures, and problem-solving techniques.',
        semester: 'Fall',
        year: 2024,
        credits: 3,
        instructor: {
          full_name: 'Dr. John Smith',
          email: 'john.smith@university.edu'
        },
        enrollments: [
          { id: '1', student_name: 'Alice Johnson', student_id: 'STU001' },
          { id: '2', student_name: 'Bob Wilson', student_id: 'STU002' },
          { id: '3', student_name: 'Carol Davis', student_id: 'STU003' }
        ],
        assignments: [
          { id: '1', title: 'Programming Basics', due_date: '2024-02-15', status: 'active' },
          { id: '2', title: 'Data Structures', due_date: '2024-03-01', status: 'draft' }
        ]
      }
      setCourse(mockCourse)
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course Not Found</h2>
          <p className="mt-2 text-gray-600">The requested course could not be found.</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                <p className="mt-2 text-gray-600">{course.code} • {course.semester} {course.year} • {course.credits} Credits</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/assignments/create?courseId=${course.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Description</h3>
                <p className="text-gray-700">{course.description}</p>
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
                  <button
                    onClick={() => router.push(`/assignments/create?courseId=${course.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Assignment
                  </button>
                </div>
                <div className="space-y-3">
                  {course.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <p className="text-sm text-gray-500">Due: {assignment.due_date}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  ))}
                  {course.assignments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No assignments created yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instructor</h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {course.instructor.full_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{course.instructor.full_name}</p>
                    <p className="text-sm text-gray-500">{course.instructor.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Enrolled Students</span>
                    </div>
                    <span className="font-medium">{course.enrollments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Assignments</span>
                    </div>
                    <span className="font-medium">{course.assignments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Credits</span>
                    </div>
                    <span className="font-medium">{course.credits}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolled Students */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enrolled Students</h3>
                <div className="space-y-2">
                  {course.enrollments.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{enrollment.student_name}</span>
                      <span className="text-xs text-gray-500">{enrollment.student_id}</span>
                    </div>
                  ))}
                  {course.enrollments.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{course.enrollments.length - 5} more students
                    </p>
                  )}
                  {course.enrollments.length === 0 && (
                    <p className="text-gray-500 text-center py-2 text-sm">No students enrolled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}