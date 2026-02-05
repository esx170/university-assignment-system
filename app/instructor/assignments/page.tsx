'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Eye, 
  BookOpen, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

type Assignment = {
  id: string
  title: string
  description: string
  due_date: string
  max_points: number
  status: string
  course_id: string
  courses?: {
    id: string
    name: string
    code: string
  }
  submissions?: any[]
}

export default function InstructorAssignmentsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      if (user.role !== 'instructor' && user.role !== 'admin') {
        toast.error('Access denied: Instructor privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser(user)
      await loadAssignments()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadAssignments = async () => {
    try {
      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      
      if (!sessionData) {
        console.error('No custom session found')
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        console.error('Session expired')
        toast.error('Session expired - please sign in again')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_data')
        router.push('/auth/signin')
        return
      }

      const response = await fetch('/api/assignments', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const assignmentsData = await response.json()
        setAssignments(assignmentsData)
      } else {
        const error = await response.json()
        console.error('Failed to load assignments:', error)
        toast.error(`Failed to load assignments: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Load assignments error:', error)
      toast.error(`Failed to load assignments: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = () => {
    router.push('/assignments/create')
  }

  const handleViewAssignment = (assignmentId: string) => {
    router.push(`/assignments/${assignmentId}`)
  }

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    
    if (assignment.status === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </span>
      )
    }
    
    if (assignment.status === 'published') {
      if (now > dueDate) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Closed
          </span>
        )
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {assignment.status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
            <p className="mt-2 text-gray-600">
              Assignments you've created for your courses
            </p>
          </div>
          <button
            onClick={handleCreateAssignment}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Assignments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.length}
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
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.status === 'published' && new Date(a.due_date) > new Date()).length}
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
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Draft
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.status === 'draft').length}
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
                      Total Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.reduce((sum, a) => sum + (a.submissions?.length || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Assignments ({assignments.length})
            </h3>
            
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments created</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first assignment.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateAssignment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {assignment.title}
                          </h3>
                          {getStatusBadge(assignment)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {assignment.courses?.code} - {assignment.courses?.name}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()} at {new Date(assignment.due_date).toLocaleTimeString()}
                          <span className="mx-2">•</span>
                          <FileText className="w-4 h-4 mr-1" />
                          {assignment.max_points} points
                          <span className="mx-2">•</span>
                          <Users className="w-4 h-4 mr-1" />
                          {assignment.submissions?.length || 0} submissions
                        </div>
                        
                        {assignment.description && (
                          <p className="text-gray-700 text-sm line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleViewAssignment(assignment.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        {assignment.submissions && assignment.submissions.length > 0 && (
                          <button
                            onClick={() => router.push(`/instructor/grading?assignment=${assignment.id}`)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                          >
                            Grade
                          </button>
                        )}
                      </div>
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