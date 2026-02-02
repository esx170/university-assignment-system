'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { FileText, Clock, User, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type SubmissionForGrading = {
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
  student: {
    full_name: string
    email: string
    student_id: string
  }
}

export default function GradingPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionForGrading[]>([])
  const [loading, setLoading] = useState(true)
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null)
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
      
      if (user.role !== 'instructor' && user.role !== 'admin') {
        toast.error('Access denied: Instructor privileges required')
        router.push('/dashboard')
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
      // Mock data for now - in real app, this would fetch from API
      const mockSubmissions: SubmissionForGrading[] = [
        {
          id: '1',
          assignment_id: '1',
          student_id: 'student1',
          file_url: '/uploads/assignment1.pdf',
          file_name: 'assignment1.pdf',
          submitted_at: '2024-01-15T10:30:00Z',
          is_late: false,
          assignment: {
            title: 'Introduction to Programming',
            course: {
              name: 'Computer Science 101',
              code: 'CS101'
            },
            due_date: '2024-01-15T23:59:00Z',
            max_points: 100
          },
          student: {
            full_name: 'John Doe',
            email: 'john.doe@student.edu',
            student_id: 'STU001'
          }
        },
        {
          id: '2',
          assignment_id: '2',
          student_id: 'student2',
          file_url: '/uploads/assignment2.pdf',
          file_name: 'data_structures_hw.pdf',
          submitted_at: '2024-01-20T14:45:00Z',
          is_late: true,
          grade: 85,
          feedback: 'Good implementation, but could use better comments.',
          assignment: {
            title: 'Data Structures Implementation',
            course: {
              name: 'Data Structures',
              code: 'CS201'
            },
            due_date: '2024-01-19T23:59:00Z',
            max_points: 100
          },
          student: {
            full_name: 'Jane Smith',
            email: 'jane.smith@student.edu',
            student_id: 'STU002'
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

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    setGradingSubmission(submissionId)
    try {
      // In real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, grade, feedback }
          : sub
      ))
      
      toast.success('Grade submitted successfully')
    } catch (error) {
      toast.error('Failed to submit grade')
    } finally {
      setGradingSubmission(null)
    }
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

  const pendingSubmissions = submissions.filter(sub => sub.grade === undefined)
  const gradedSubmissions = submissions.filter(sub => sub.grade !== undefined)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grading Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Review and grade student submissions
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Review
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingSubmissions.length}
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
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Graded
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {gradedSubmissions.length}
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
                  <User className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {submissions.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        {pendingSubmissions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Review</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {pendingSubmissions.map((submission) => (
                  <SubmissionItem
                    key={submission.id}
                    submission={submission}
                    onGrade={handleGradeSubmission}
                    isGrading={gradingSubmission === submission.id}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Graded Submissions */}
        {gradedSubmissions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Graded</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {gradedSubmissions.map((submission) => (
                  <SubmissionItem
                    key={submission.id}
                    submission={submission}
                    onGrade={handleGradeSubmission}
                    isGrading={gradingSubmission === submission.id}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {submissions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No student submissions are available for grading.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionItem({ 
  submission, 
  onGrade, 
  isGrading 
}: { 
  submission: SubmissionForGrading
  onGrade: (id: string, grade: number, feedback: string) => void
  isGrading: boolean
}) {
  const [showGrading, setShowGrading] = useState(false)
  const [grade, setGrade] = useState(submission.grade?.toString() || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')

  const handleSubmitGrade = () => {
    const gradeNum = parseInt(grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > submission.assignment.max_points) {
      toast.error(`Grade must be between 0 and ${submission.assignment.max_points}`)
      return
    }
    onGrade(submission.id, gradeNum, feedback)
    setShowGrading(false)
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

  return (
    <li className="px-4 py-4 sm:px-6">
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
            <p className="text-sm text-gray-500">
              Student: {submission.student.full_name} ({submission.student.student_id})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {submission.grade !== undefined ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {submission.grade}/{submission.assignment.max_points}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending
            </span>
          )}
          {submission.is_late && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Late
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        <p>Submitted: {formatDate(submission.submitted_at)}</p>
        <p>File: {submission.file_name}</p>
      </div>

      {submission.feedback && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-900">Feedback:</p>
          <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
        </div>
      )}

      <div className="mt-4 flex space-x-3">
        <button className="text-sm text-blue-600 hover:text-blue-500">
          Download File
        </button>
        <button
          onClick={() => setShowGrading(!showGrading)}
          className="text-sm text-green-600 hover:text-green-500"
        >
          {submission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}
        </button>
      </div>

      {showGrading && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade (out of {submission.assignment.max_points})
              </label>
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                min="0"
                max={submission.assignment.max_points}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provide feedback to the student..."
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleSubmitGrade}
              disabled={isGrading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isGrading ? 'Submitting...' : 'Submit Grade'}
            </button>
            <button
              onClick={() => setShowGrading(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  )
}