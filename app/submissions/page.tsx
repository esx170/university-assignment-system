'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { FileText, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

type Submission = {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  submitted_at: string
  is_late: boolean
  grade?: number
  feedback?: string
  assignment: {
    title: string
    course: {
      name: string
      code: string
    }
    due_date: string
    max_points: number
  }
  student?: {
    full_name: string
    email: string
  }
}

export default function SubmissionsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadSubmissions()
  }, [])

  const checkAuthAndLoadSubmissions = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setCurrentUser(user)
      await loadSubmissions(user)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/auth/signin')
    }
  }

  const loadSubmissions = async (user: Profile) => {
    try {
      // Mock data for now
      const mockSubmissions: Submission[] = [
        {
          id: '1',
          assignment_id: '1',
          student_id: user.id,
          file_url: '/uploads/assignment1.pdf',
          file_name: 'assignment1.pdf',
          submitted_at: '2024-01-15T10:30:00Z',
          is_late: false,
          grade: 85,
          feedback: 'Good work! Consider adding more examples.',
          assignment: {
            title: 'Introduction to Programming',
            course: {
              name: 'Computer Science 101',
              code: 'CS101'
            },
            due_date: '2024-01-15T23:59:00Z',
            max_points: 100
          }
        },
        {
          id: '2',
          assignment_id: '2',
          student_id: user.id,
          file_url: '/uploads/assignment2.pdf',
          file_name: 'data_structures_hw.pdf',
          submitted_at: '2024-01-20T14:45:00Z',
          is_late: true,
          assignment: {
            title: 'Data Structures Implementation',
            course: {
              name: 'Data Structures',
              code: 'CS201'
            },
            due_date: '2024-01-19T23:59:00Z',
            max_points: 100
          }
        }
      ]
      
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (submission: Submission) => {
    if (submission.grade !== undefined) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    if (submission.is_late) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <Clock className="w-5 h-5 text-yellow-500" />
  }

  const getStatusText = (submission: Submission) => {
    if (submission.grade !== undefined) {
      return `Graded (${submission.grade}/${submission.assignment.max_points})`
    }
    if (submission.is_late) {
      return 'Late Submission'
    }
    return 'Pending Review'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="mt-2 text-gray-600">
            Track your assignment submissions and grades
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't submitted any assignments yet.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <li key={submission.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            {submission.assignment.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {submission.assignment.course.code} - {submission.assignment.course.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(submission)}
                        <span className="ml-2 text-sm text-gray-500">
                          {getStatusText(submission)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Submitted: {formatDate(submission.submitted_at)}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Due: {formatDate(submission.assignment.due_date)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>File: {submission.file_name}</p>
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">Feedback:</p>
                        <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                      </div>
                    )}
                    
                    {submission.is_late && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Late Submission
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}