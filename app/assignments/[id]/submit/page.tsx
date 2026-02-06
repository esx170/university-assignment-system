'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, FileText, AlertCircle, Clock } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import { getCurrentUser, Profile } from '@/lib/auth'
import toast from 'react-hot-toast'

interface Assignment {
  id: string
  title: string
  description?: string
  due_date: string
  max_points: number
  file_types: string[]
  max_file_size: number
  allow_late: boolean
  courses: {
    name: string
    code: string
  }
}

interface SubmitAssignmentPageProps {
  params: {
    id: string
  }
}

export default function SubmitAssignmentPage({ params }: SubmitAssignmentPageProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'student') {
          router.push('/dashboard')
          return
        }

        setProfile(user)

        // Get session token for API call
        const sessionData = localStorage.getItem('user_session')
        if (!sessionData) {
          toast.error('Authentication required')
          router.push('/auth/signin')
          return
        }

        const session = JSON.parse(sessionData)

        const response = await fetch(`/api/assignments/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setAssignment(data)
        } else {
          toast.error('Assignment not found')
          router.push('/assignments')
        }
      } catch (error) {
        console.error('Error loading assignment:', error)
        toast.error('Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, router])

  const handleSubmit = async () => {
    if (!selectedFile || !assignment) return

    setSubmitting(true)
    try {
      // Get session token
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        toast.error('Authentication required')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)

      const formData = new FormData()
      formData.append('assignment_id', assignment.id)
      formData.append('file', selectedFile)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`
        },
        body: formData,
      })

      if (response.ok) {
        toast.success('Assignment submitted successfully!')
        router.push('/assignments')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit assignment')
      }
    } catch (error) {
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment not found</h3>
        <p className="text-gray-600">The assignment you're looking for doesn't exist.</p>
      </div>
    )
  }

  const now = new Date()
  const dueDate = new Date(assignment.due_date)
  const isOverdue = now > dueDate
  const timeUntilDue = dueDate.getTime() - now.getTime()
  const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60))

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Assignment</h1>
        <p className="text-gray-600">Upload your assignment file</p>
      </div>

      <div className="max-w-3xl">
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {assignment.title}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                {assignment.courses.code} - {assignment.courses.name}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                Due: {format(dueDate, 'MMM d, yyyy h:mm a')}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="w-4 h-4 mr-1" />
                {assignment.max_points} points
              </div>
            </div>
          </div>

          {assignment.description && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {isOverdue && !assignment.allow_late && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Assignment Overdue
                  </h3>
                  <p className="text-sm text-red-700">
                    This assignment is past due and late submissions are not allowed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOverdue && assignment.allow_late && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Late Submission
                  </h3>
                  <p className="text-sm text-yellow-700">
                    This assignment is past due. Late submissions may be penalized.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isOverdue && hoursUntilDue <= 24 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Due Soon
                  </h3>
                  <p className="text-sm text-yellow-700">
                    This assignment is due in {hoursUntilDue} hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File</h3>
          
          <FileUpload
            onFileSelect={setSelectedFile}
            acceptedTypes={assignment.file_types}
            maxSize={assignment.max_file_size}
            currentFile={selectedFile}
            onRemoveFile={() => setSelectedFile(null)}
          />

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Accepted formats:</strong> {assignment.file_types.join(', ').toUpperCase()}
            </p>
            <p>
              <strong>Maximum file size:</strong> {assignment.max_file_size}MB
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || submitting || (isOverdue && !assignment.allow_late)}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}