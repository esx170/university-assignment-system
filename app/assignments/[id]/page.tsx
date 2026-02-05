'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  FileText, 
  BookOpen, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description?: string
  due_date: string
  max_points: number
  courses: {
    name: string
    code: string
  }
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function AssignmentDetailPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  useEffect(() => {
    checkAuthAndLoadAssignment()
  }, [assignmentId])

  const checkAuthAndLoadAssignment = async () => {
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

      setCurrentUser({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      })

      await loadAssignment(session.token)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadAssignment = async (authToken: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const assignmentData = await response.json()
        setAssignment(assignmentData)
      } else if (response.status === 404) {
        setError('Assignment not found')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to load assignment')
      }
    } catch (error: any) {
      console.error('Load assignment error:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!assignment) return null

    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    
    if (now > dueDate) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Overdue
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-4 h-4 mr-1" />
        Active
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assignment Not Found</h2>
          <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </button>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {assignment.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {assignment.courses.code} - {assignment.courses.name}
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {assignment.max_points} points
                </div>
              </div>
            </div>
            <div className="ml-4">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Assignment Details</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {formatDate(assignment.due_date)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Points</h3>
                <div className="flex items-center text-gray-900">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" />
                  {assignment.max_points} points
                </div>
              </div>
            </div>

            {assignment.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Actions</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-4">
              {currentUser?.role === 'student' && (
                <>
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/submit`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Assignment
                  </button>
                  <button
                    onClick={() => router.push(`/submissions?assignment=${assignmentId}`)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View My Submissions
                  </button>
                </>
              )}
              
              {(currentUser?.role === 'instructor' || currentUser?.role === 'admin') && (
                <>
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/submissions`)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View All Submissions
                  </button>
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/edit`)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Assignment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Created: {formatDate(assignment.created_at)}</p>
          <p>Last updated: {formatDate(assignment.updated_at)}</p>
        </div>
      </div>
    </div>
  )
}