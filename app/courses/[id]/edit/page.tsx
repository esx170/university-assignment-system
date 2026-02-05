'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Department = {
  id: string
  name: string
  code: string
  description: string
}

type Course = {
  id: string
  name: string
  code: string
  description: string
  semester: string
  year: number
  credits: number
  department_id: string
  instructor_id: string
}

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadCourse()
    loadDepartments()
  }, [params.id])

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

  const loadCourse = async () => {
    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch(`/api/courses/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourse({
          id: data.id,
          name: data.name,
          code: data.code,
          description: data.description || '',
          semester: data.semester,
          year: data.year,
          credits: data.credits || 3,
          department_id: data.department_id || '',
          instructor_id: data.instructor_id
        })
        console.log('Course loaded:', data)
      } else {
        const error = await response.json()
        console.error('Failed to load course:', error)
        toast.error('Failed to load course')
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Error loading course:', error)
      toast.error('Error loading course')
      router.push('/admin/courses')
    } finally {
      setLoadingCourse(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        console.error('No authentication token found')
        return
      }

      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
        console.log('Departments loaded:', data.length)
      } else {
        const error = await response.json()
        console.error('Failed to load departments:', error)
        toast.error('Failed to load departments')
      }
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.error('Error loading departments')
    } finally {
      setLoadingDepartments(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course || !course.name || !course.code) {
      toast.error('Course name and code are required')
      return
    }
    
    setLoading(true)

    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/courses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: course.name,
          code: course.code,
          description: course.description,
          semester: course.semester,
          year: course.year,
          credits: course.credits,
          department_id: course.department_id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update course')
      }

      const result = await response.json()
      toast.success('Course updated successfully!')
      router.push('/admin/courses')
    } catch (error: any) {
      console.error('Update course error:', error)
      toast.error(error.message || 'Failed to update course')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!course) return
    
    setCourse({
      ...course,
      [e.target.name]: e.target.value
    })
  }

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
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
            onClick={() => router.push('/admin/courses')}
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </button>
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
              <p className="mt-2 text-gray-600">Update course information</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={course.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Introduction to Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Course Code</label>
                <input
                  type="text"
                  name="code"
                  required
                  value={course.code}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Credits</label>
                <input
                  type="number"
                  name="credits"
                  required
                  min="1"
                  max="6"
                  value={course.credits}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                {loadingDepartments ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded-md mt-1"></div>
                ) : (
                  <select
                    name="department_id"
                    value={course.department_id}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select department (optional)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  name="semester"
                  value={course.semester}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  name="year"
                  required
                  min="2020"
                  max="2030"
                  value={course.year}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={course.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Course description and objectives..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/admin/courses')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDepartments}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}