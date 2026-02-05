'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { getCurrentUser, Profile } from '@/lib/auth'

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
  userSubmission?: {
    id: string
    grade?: number
    submitted_at: string
  }
  isSubmitted?: boolean
  isLate?: boolean
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')

  useEffect(() => {
    checkAuthAndLoadAssignments()
  }, [])

  const checkAuthAndLoadAssignments = async () => {
    try {
      // Check custom session first
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData)
        const user = JSON.parse(userData)
        
        // Check if session is still valid
        if (new Date(session.expires) > new Date()) {
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            student_id: user.student_id || null,
            created_at: new Date(),
            updated_at: new Date()
          })
          await loadAssignments(session.token)
          return
        }
      }
      
      // If no valid custom session, redirect to signin
      console.error('No valid session found, redirecting to signin')
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/auth/signin'
    }
  }

  const loadAssignments = async (authToken: string) => {
    try {
      const response = await fetch('/api/assignments', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      } else {
        const error = await response.json()
        console.error('Failed to fetch assignments:', error)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (profile?.role === 'student') {
      if (assignment.userSubmission?.grade !== undefined) {
        return (
          <span className="badge-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Graded ({assignment.userSubmission.grade}/{assignment.max_points})
          </span>
        )
      }
      
      if (assignment.isSubmitted) {
        return (
          <span className="badge-info">
            <Clock className="w-3 h-3 mr-1" />
            Submitted
          </span>
        )
      }

      const now = new Date()
      const dueDate = new Date(assignment.due_date)
      
      if (now > dueDate) {
        return (
          <span className="badge-danger">
            <XCircle className="w-3 h-3 mr-1" />
            Overdue
          </span>
        )
      }

      return (
        <span className="badge-warning">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </span>
      )
    }

    return null
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (profile?.role !== 'student') return true
    
    switch (filter) {
      case 'pending':
        return !assignment.isSubmitted && new Date() <= new Date(assignment.due_date)
      case 'submitted':
        return assignment.isSubmitted && assignment.userSubmission?.grade === undefined
      case 'graded':
        return assignment.userSubmission?.grade !== undefined
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">
            {profile?.role === 'student' ? 'View and submit your assignments' : 'Manage course assignments'}
          </p>
        </div>
        
        {(profile?.role === 'instructor' || profile?.role === 'admin') && (
          <Link href="/assignments/create" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Link>
        )}
      </div>

      {profile?.role === 'student' && (
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'graded', label: 'Graded' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {profile?.role === 'student' 
                ? 'No assignments match your current filter.'
                : 'Create your first assignment to get started.'
              }
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    {getStatusBadge(assignment)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {assignment.courses.code} - {assignment.courses.name}
                  </p>
                  
                  {assignment.description && (
                    <p className="text-gray-700 mb-3">{assignment.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {assignment.max_points} points
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {profile?.role === 'student' && !assignment.isSubmitted && (
                    <Link
                      href={`/assignments/${assignment.id}/submit`}
                      className="btn-primary"
                    >
                      Submit
                    </Link>
                  )}
                  
                  {profile?.role === 'student' && assignment.isSubmitted && (
                    <Link
                      href={`/submissions/${assignment.userSubmission?.id}`}
                      className="btn-secondary"
                    >
                      View Submission
                    </Link>
                  )}
                  
                  {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                    <>
                      <Link
                        href={`/assignments/${assignment.id}`}
                        className="btn-secondary"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/assignments/${assignment.id}/submissions`}
                        className="btn-primary"
                      >
                        View Submissions
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}