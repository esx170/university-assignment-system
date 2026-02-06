'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditAssignmentPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxPoints, setMaxPoints] = useState('100')
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  useEffect(() => {
    loadAssignment()
  }, [assignmentId])

  const loadAssignment = async () => {
    try {
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        toast.error('Authentication required')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const assignment = await response.json()
        setTitle(assignment.title)
        setDescription(assignment.description || '')
        setDueDate(assignment.due_date.substring(0, 16)) // Format for datetime-local input
        setMaxPoints(assignment.max_points.toString())
      } else {
        toast.error('Failed to load assignment')
        router.push('/assignments')
      }
    } catch (error) {
      console.error('Error loading assignment:', error)
      toast.error('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !dueDate || !maxPoints) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        toast.error('Authentication required')
        return
      }

      const session = JSON.parse(sessionData)

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          due_date: new Date(dueDate).toISOString(),
          max_points: parseInt(maxPoints)
        })
      })

      if (response.ok) {
        toast.success('Assignment updated successfully!')
        router.push(`/assignments/${assignmentId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/assignments/${assignmentId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignment
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide instructions and details for this assignment..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Points *
                  </label>
                  <input
                    type="number"
                    id="maxPoints"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/assignments/${assignmentId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
