'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  FileText, 
  ArrowLeft,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Submission {
  id: string
  submitted_at: string
  grade: number | null
  grade_percentage: number | null
  feedback: string | null
  graded_at: string | null
  status: string
  file_name: string | null
  file_url: string | null
  is_late: boolean
  student: {
    full_name: string
    student_id: string
  }
}

interface Assignment {
  id: string
  title: string
  max_points: number
  courses: {
    name: string
    code: string
  }
}

export default function AssignmentSubmissionsPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeValue, setGradeValue] = useState<string>('')
  const [feedbackValue, setFeedbackValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  useEffect(() => {
    loadData()
  }, [assignmentId])

  const loadData = async () => {
    try {
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        toast.error('Authentication required')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)

      // Load assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (assignmentResponse.ok) {
        const assignmentData = await assignmentResponse.json()
        setAssignment(assignmentData)
      }

      // Load submissions
      const submissionsResponse = await fetch(`/api/submissions?assignmentId=${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData)
      } else {
        const error = await submissionsResponse.json()
        toast.error(error.error || 'Failed to load submissions')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !assignment) return

    const grade = parseFloat(gradeValue)
    if (isNaN(grade) || grade < 0 || grade > assignment.max_points) {
      toast.error(`Grade must be between 0 and ${assignment.max_points}`)
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

      const response = await fetch('/api/submissions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          grade: grade,
          feedback: feedbackValue
        })
      })

      if (response.ok) {
        toast.success('Grade saved successfully!')
        setSelectedSubmission(null)
        setGradeValue('')
        setFeedbackValue('')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save grade')
      }
    } catch (error) {
      console.error('Error saving grade:', error)
      toast.error('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeValue(submission.grade?.toString() || '')
    setFeedbackValue(submission.feedback || '')
  }

  const closeGradingModal = () => {
    setSelectedSubmission(null)
    setGradeValue('')
    setFeedbackValue('')
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
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/assignments/${assignmentId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignment
          </button>
          
          {assignment && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Submissions: {assignment.title}
              </h1>
              <p className="text-gray-600">
                {assignment.courses.code} • {assignment.max_points} points
              </p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
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

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {submissions.filter(s => s.grade === null).length}
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
                      Graded
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {submissions.filter(s => s.grade !== null).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-gray-500">Students haven't submitted this assignment yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.student.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.student.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.submitted_at)}
                      {submission.is_late && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Late
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.grade !== null ? (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {submission.grade}/{assignment?.max_points}
                          </span>
                          <span className="text-gray-500 ml-1">
                            ({((submission.grade / (assignment?.max_points || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.grade !== null ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Graded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openGradingModal(submission)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {submission.grade !== null ? 'Edit Grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grading Modal */}
        {selectedSubmission && assignment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Grade Submission
                </h3>
                <button
                  onClick={closeGradingModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 py-4">
                {/* Student Info */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Student Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm"><strong>Name:</strong> {selectedSubmission.student.full_name}</p>
                    <p className="text-sm"><strong>ID:</strong> {selectedSubmission.student.student_id}</p>
                    <p className="text-sm"><strong>Submitted:</strong> {formatDate(selectedSubmission.submitted_at)}</p>
                    {selectedSubmission.is_late && (
                      <p className="text-sm text-red-600"><strong>Status:</strong> Late Submission</p>
                    )}
                  </div>
                </div>

                {/* Submitted File */}
                {selectedSubmission.file_name && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Submitted File</h4>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {selectedSubmission.file_name}
                        </span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-900 text-sm flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Grade Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Grade (out of {assignment.max_points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.max_points}
                    step="0.5"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter grade"
                  />
                </div>

                {/* Feedback Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedbackValue}
                    onChange={(e) => setFeedbackValue(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                {/* Previous Grade Info */}
                {selectedSubmission.grade !== null && (
                  <div className="mb-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Previous Grade</h4>
                    <p className="text-sm text-blue-800">
                      <strong>Grade:</strong> {selectedSubmission.grade}/{assignment.max_points}
                    </p>
                    {selectedSubmission.feedback && (
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>Feedback:</strong> {selectedSubmission.feedback}
                      </p>
                    )}
                    {selectedSubmission.graded_at && (
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>Graded:</strong> {formatDate(selectedSubmission.graded_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeGradingModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGradeSubmission}
                  disabled={saving || !gradeValue}
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
                      Save Grade
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
