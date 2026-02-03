'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateCoursePage() {
  const [course, setCourse] = useState({
    name: '',
    code: '',
    description: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    credits: 3
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: course.name,
          code: course.code,
          description: course.description,
          semester: course.semester,
          year: course.year,
          credits: course.credits,
          department_id: null // Will be set based on user's department
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create course')
      }

      const result = await response.json()
      toast.success('Course created successfully!')
      router.push('/courses')
    } catch (error: any) {
      console.error('Create course error:', error)
      toast.error(error.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </button>
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="mt-2 text-gray-600">Add a new course to the system</p>
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
                  required
                  value={course.name}
                  onChange={(e) => setCourse({...course, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Introduction to Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Course Code</label>
                <input
                  type="text"
                  required
                  value={course.code}
                  onChange={(e) => setCourse({...course, code: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Credits</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="6"
                  value={course.credits}
                  onChange={(e) => setCourse({...course, credits: parseInt(e.target.value)})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  value={course.semester}
                  onChange={(e) => setCourse({...course, semester: e.target.value})}
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
                  required
                  min="2020"
                  max="2030"
                  value={course.year}
                  onChange={(e) => setCourse({...course, year: parseInt(e.target.value)})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  value={course.description}
                  onChange={(e) => setCourse({...course, description: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Course description and objectives..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}