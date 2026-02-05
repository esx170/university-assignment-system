'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Assignment = {
  id: string
  title: string
  description: string
  due_date: string
  max_points: number
  status: string
  courses: {
    id: string
    name: string
    code: string
  }
  submissions?: {
    id: string
    submitted_at: string
    grade: number | null
  }[]
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    loadUserAndAssignments()
  }, [])

  const loadUserAndAssignments = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please sign in to view assignments')
        return
      }
      setProfile(user)
      await loadAssignments()
    } catch (error) {
      console.error('Error loading user:', error)
      toast.error('Failed to load user information')
    }
  }

  const loadAssignments = async () => {
    try {
      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        toast.error('Authentication required - please sign in')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        toast.error('Session expired - please sign in again')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_data')
        return
      }

      const response = await fetch('/api/student/assignments', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load assignments')
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    const dueDate = new Date(assignment.due_date)
    const now = new Date()
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0

    if (hasSubmission) {
      const submission = assignment.submissions[0]
      if (submission.grade !== null) {
        return { status: 'graded', color: 'text-green-600', icon: CheckCircle }
      }
      return { status: 'submitted', color: 'text-blue-600', icon: CheckCircle }
    }

    if (dueDate < now) {
      return { status: 'overdue', color: 'text-red-600', icon: AlertCircle }
    }

    return { status: 'pending', color: 'text-yellow-600', icon: Clock }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
          <p className="text-gray-600">View and submit your course assignments</p>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-500">You don't have any assignments at the moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              const statusInfo = getAssignmentStatus(assignment)
              const StatusIcon = statusInfo.icon

              return (
                <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {assignment.courses.name} ({assignment.courses.code})
                        </p>
                        {assignment.description && (
                          <p className="text-gray-700 mb-4">{assignment.description}</p>
                        )}
                      </div>
                      <div className={`flex items-center ${statusInfo.color}`}>
                        <StatusIcon className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium capitalize">
                          {statusInfo.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <span>Max Points: {assignment.max_points}</span>
                      </div>
                    </div>

                    {assignment.submissions && assignment.submissions.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Your Submission</h4>
                        <div className="text-sm text-gray-600">
                          <p>Submitted: {formatDate(assignment.submissions[0].submitted_at)}</p>
                          {assignment.submissions[0].grade !== null && (
                            <p className="text-green-600 font-medium">
                              Grade: {assignment.submissions[0].grade}/{assignment.max_points}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => window.location.href = `/assignments/${assignment.id}/submit`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {assignment.submissions && assignment.submissions.length > 0 ? 'View Submission' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}