'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assignmentSchema, AssignmentInput } from '@/lib/validations'

interface Course {
  id: string
  name: string
  code: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function CreateAssignmentPage() {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      allow_late: false,
      late_penalty: 0,
      file_types: ['pdf', 'doc', 'docx', 'zip'],
      max_file_size: 10
    }
  })

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

      // Check if user is instructor or admin
      if (user.role !== 'instructor' && user.role !== 'admin' && user.email !== 'admin@university.edu') {
        console.error('Access denied: Only instructors and administrators can create assignments')
        router.push('/dashboard')
        return
      }

      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      })

      await loadInstructorCourses(session.token, user)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadInstructorCourses = async (authToken: string, user: any) => {
    try {
      setLoadingCourses(true)
      
      // For instructors, load only their assigned courses
      // For admins, load all courses
      let apiUrl = '/api/courses'
      
      if (user.role === 'instructor') {
        // Use a specific endpoint for instructor courses
        apiUrl = '/api/instructor/courses'
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
        
        if (data.length === 0 && user.role === 'instructor') {
          console.log('No courses assigned to this instructor')
        }
      } else {
        const error = await response.json()
        console.error('Failed to fetch courses:', error)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const onSubmit = async (data: AssignmentInput) => {
    setLoading(true)
    try {
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        alert('Authentication required')
        return
      }

      const session = JSON.parse(sessionData)

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        alert('Assignment created successfully!')
        router.push('/assignments')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create assignment')
      }
    } catch (error) {
      alert('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
        <p className="text-gray-600">Create a new assignment for your course</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="course_id" className="block text-sm font-medium text-gray-700">
                Course
              </label>
              {loadingCourses ? (
                <div className="mt-1 animate-pulse bg-gray-200 h-10 rounded-md"></div>
              ) : (
                <select {...register('course_id')} className="mt-1 input">
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.course_id && (
                <p className="mt-1 text-sm text-red-600">{errors.course_id.message}</p>
              )}
              {!loadingCourses && courses.length === 0 && profile?.role === 'instructor' && (
                <p className="mt-1 text-sm text-yellow-600">
                  No courses assigned to you. Please contact an administrator to assign courses to your account.
                </p>
              )}
            </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Assignment Title
            </label>
            <input
              {...register('title')}
              type="text"
              className="mt-1 input"
              placeholder="e.g., Midterm Project"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="mt-1 input"
              placeholder="Provide detailed instructions for the assignment..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                {...register('due_date')}
                type="datetime-local"
                className="mt-1 input"
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="max_points" className="block text-sm font-medium text-gray-700">
                Maximum Points
              </label>
              <input
                {...register('max_points', { valueAsNumber: true })}
                type="number"
                min="1"
                className="mt-1 input"
                placeholder="100"
              />
              {errors.max_points && (
                <p className="mt-1 text-sm text-red-600">{errors.max_points.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="max_file_size" className="block text-sm font-medium text-gray-700">
                Max File Size (MB)
              </label>
              <input
                {...register('max_file_size', { valueAsNumber: true })}
                type="number"
                min="1"
                max="100"
                className="mt-1 input"
                placeholder="10"
              />
              {errors.max_file_size && (
                <p className="mt-1 text-sm text-red-600">{errors.max_file_size.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed File Types
              </label>
              <div className="space-y-2">
                {['pdf', 'doc', 'docx', 'zip', 'txt'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      {...register('file_types')}
                      type="checkbox"
                      value={type}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 uppercase">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                {...register('allow_late')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Allow late submissions</span>
            </label>

            <div>
              <label htmlFor="late_penalty" className="block text-sm font-medium text-gray-700">
                Late Penalty (%)
              </label>
              <input
                {...register('late_penalty', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                className="mt-1 input w-20"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}