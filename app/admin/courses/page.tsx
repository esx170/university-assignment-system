'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Plus, 
  Building2, 
  Users, 
  Calendar, 
  GraduationCap,
  Eye,
  Edit,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

type Course = {
  id: string
  name: string
  code: string
  description: string
  credits: number
  semester: string
  year: number
  department_id: string
  is_active: boolean
  max_enrollment?: number
  departments?: {
    id: string
    name: string
    code: string
  }
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  enrollment_count?: number
}

export default function AdminCoursesPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [departments, setDepartments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check custom session first
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData)
        const user = JSON.parse(userData)
        
        // Check if session is still valid
        if (new Date(session.expires) > new Date()) {
          if (user.role !== 'admin') {
            toast.error('Access denied: Administrator privileges required')
            router.push('/dashboard')
            return
          }
          
          setCurrentUser({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            student_id: user.student_id || null,
            created_at: new Date(),
            updated_at: new Date()
          })
          await Promise.all([loadCourses(), loadDepartments()])
          return
        }
      }
      
      // Fallback to Supabase auth
      const user = await getCurrentUser()
      if (!user || !isAdmin(user)) {
        toast.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }
      setCurrentUser(user)
      await Promise.all([loadCourses(), loadDepartments()])
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const getAuthToken = async () => {
    // Get custom session token first
    const sessionData = localStorage.getItem('user_session')
    if (sessionData) {
      const session = JSON.parse(sessionData)
      if (new Date(session.expires) > new Date()) {
        return session.token
      }
    }
    
    // Fallback to Supabase token
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const loadCourses = async () => {
    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        console.error('No authentication token found')
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const coursesData = await response.json()
        setCourses(coursesData)
      } else {
        const error = await response.json()
        console.error('Failed to load courses:', error)
        toast.error(`Failed to load courses: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Load courses error:', error)
      toast.error(`Failed to load courses: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const authToken = await getAuthToken()
      if (!authToken) return

      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const departmentsData = await response.json()
        setDepartments(departmentsData)
      }
    } catch (error) {
      console.error('Load departments error:', error)
    }
  }

  const handleCreateCourse = () => {
    router.push('/courses/create')
  }

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const handleEditCourse = (courseId: string) => {
    router.push(`/courses/${courseId}/edit`)
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === 'all' || course.department_id === selectedDepartment
    return matchesSearch && matchesDepartment
  })

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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="mt-2 text-gray-600">
              Manage all courses across departments
            </p>
          </div>
          <button
            onClick={handleCreateCourse}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </button>
        </div>

        {/* Stats Cards */}
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
                      Total Courses
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
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Departments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {departments.length}
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
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Courses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {courses.filter(c => c.is_active).length}
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
                      Total Enrollments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Courses ({filteredCourses.length})
            </h3>
            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedDepartment !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first course.'
                  }
                </p>
                {!searchTerm && selectedDepartment === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={handleCreateCourse}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Create Course
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {course.code}
                        </h3>
                        <p className="text-gray-600 mt-1">{course.name}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Building2 className="w-4 h-4 mr-1" />
                          {course.departments?.code || 'No Department'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {course.semester} {course.year}
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        {course.credits} credits
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {course.enrollment_count || 0} enrolled
                        {course.max_enrollment && ` / ${course.max_enrollment}`}
                      </div>
                      {course.profiles && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {course.profiles.full_name}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditCourse(course.id)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
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