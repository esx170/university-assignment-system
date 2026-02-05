'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { FileText, Calendar, CheckCircle, Clock, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

type Submission = {
  id: string
  submitted_at: string
  grade: number | null
  grade_percentage: number | null
  feedback: string | null
  graded_at: string | null
  status: string
  file_name: string | null
  file_path: string | null
  assignments: {
    id: string
    title: string
    max_points: number
    due_date: string
    courses: {
      id: string
      name: string
      code: string
    }
  }
}

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    loadUserAndSubmissions()
  }, [])

  const loadUserAndSubmissions = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please sign in to view submissions')
        return
      }
      setProfile(user)
      await loadSubmissions()
    } catch (error) {
      console.error('Error loading user:', error)
      toast.error('Failed to load user information')
    }
  }

  const loadSubmissions = async () => {
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

      const response = await fetch('/api/student/submissions', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load submissions')
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionStatus = (submission: Submission) => {
    if (submission.grade !== null) {
      return { status: 'graded', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
    return { status: 'submitted', color: 'text-blue-600', bgColor: 'bg-blue-100' }
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

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Submissions</h1>
          <p className="text-gray-600">Track your assignment submissions and grades</p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-500">You haven't submitted any assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const statusInfo = getSubmissionStatus(submission)

              return (
                <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {submission.assignments.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {submission.assignments.courses.name} ({submission.assignments.courses.code})
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.status === 'graded' ? 'Graded' : 'Submitted'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Submitted: {formatDate(submission.submitted_at)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Due: {formatDate(submission.assignments.due_date)}</span>
                      </div>
                    </div>

                    {submission.file_name && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900">
                              {submission.file_name}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {submission.grade !== null && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Grade</h4>
                          <div className={`text-lg font-bold ${getGradeColor(submission.grade, submission.assignments.max_points)}`}>
                            {submission.grade}/{submission.assignments.max_points}
                            {submission.grade_percentage && (
                              <span className="text-sm ml-2">
                                ({submission.grade_percentage.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        {submission.graded_at && (
                          <p className="text-sm text-gray-600 mb-2">
                            Graded on: {formatDate(submission.graded_at)}
                          </p>
                        )}
                        {submission.feedback && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-1">Feedback</h5>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => window.location.href = `/assignments/${submission.assignments.id}/submit`}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Assignment
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