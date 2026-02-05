'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, Calendar, Plus } from 'lucide-react'

type Course = {
  id: string
  name: string
  code: string
  description: string
  instructor_id: string
  semester: string
  year: number
  instructor?: {
    full_name: string
    email: string
  }
  enrollments?: any[]
  assignments?: any[]
}

export default function CoursesPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadCourses()
  }, [])

  const checkAuthAndLoadCourses = async () => {
    try {
      const user = await getCurrentUserWithAuth()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setCurrentUser(user)
      await loadCourses(user)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth/signin')
    }
  }

  const handleCreateCourse = () => {
    router.push('/courses/create') // Navigate to course creation page
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`) // Navigate to course details
  }

  const loadCourses = async (user: Profile) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const coursesData = await response.json()
        setCourses(coursesData)
      } else {
        console.error('Failed to load courses:', response.statusText)
        // Fall back to mock data for now
        const mockCourses: Course[] = [
          {
            id: '1',
            name: 'Introduction to Computer Science',
            code: 'CS101',
            description: 'Basic concepts of programming and computer science',
            instructor_id: user.id,
            semester: 'Fall',
            year: 2024,
            instructor: {
              full_name: 'Dr. John Smith',
              email: 'john.smith@university.edu'
            },
            enrollments: [],
            assignments: []
          }
        ]
        setCourses(mockCourses)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      // Fall back to mock data
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const getPageTitle = () => {
    switch (currentUser?.role) {
      case 'admin': return 'All Courses'
      case 'instructor': return 'My Courses'
      case 'student': return 'My Courses'
      default: return 'Courses'
    }
  }

  const canCreateCourse = currentUser?.role === 'admin' // Only admin can create courses
  const canViewAllCourses = currentUser?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="mt-2 text-gray-600">
              {currentUser?.role === 'admin' && 'Manage all courses in the system'}
              {currentUser?.role === 'instructor' && 'Courses you are teaching'}
              {currentUser?.role === 'student' && 'Courses you are enrolled in'}
            </p>
          </div>
          
          {canCreateCourse && (
            <button 
              onClick={handleCreateCourse}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentUser?.role === 'student' && "You're not enrolled in any courses yet."}
              {currentUser?.role === 'instructor' && "You haven't created any courses yet."}
              {currentUser?.role === 'admin' && "No courses have been created in the system."}
            </p>
            {canCreateCourse && (
              <div className="mt-6">
                <button 
                  onClick={handleCreateCourse}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first course
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.code}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {course.semester} {course.year}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {course.enrollments?.length || 0} students
                    </div>
                  </div>
                  
                  {course.instructor && currentUser?.role !== 'instructor' && (
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Instructor:</span> {course.instructor.full_name}
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <button 
                      onClick={() => handleViewCourse(course.id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      View Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}