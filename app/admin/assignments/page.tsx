'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  BookOpen, 
  Calendar, 
  Users, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  student_id?: string | null
  created_at: Date
  updated_at: Date
}

type Assignment = {
  id: string
  title: string
  description: string
  due_date: string
  max_points: number
  status: string
  course_id: string
  instructor_id: string
  created_at: string
  courses?: {
    id: string
    name: string
    code: string
  }
  submissions?: any[]
}

export default function AdminAssignmentsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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

      // Check if user is admin
      if (user.role !== 'admin' && user.email !== 'admin@university.edu') {
        console.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }

      setCurrentUser({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        student_id: user.student_id || null,
        created_at: new Date(),
        updated_at: new Date()
      })

      await loadAssignments(session.token)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
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

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.courses?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.courses?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignment Overview</h1>
          <p className="mt-2 text-gray-600">
            View all assignments across the system (Read-only for administrators)
          </p>
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
                      Published
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.status === 'published').length}
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
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => 
                        a.status === 'published' && new Date(a.due_date) < new Date()
                      ).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assignments ({filteredAssignments.length})
            </h3>
            
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No assignments have been created yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
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
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Created: {new Date(assignment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => handleViewAssignment(assignment.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
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