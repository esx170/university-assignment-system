'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, Profile, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  BookOpen,
  GraduationCap,
  UserCheck,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

type User = {
  id: string
  email: string
  full_name: string
  role: 'student' | 'instructor' | 'admin'
  student_id?: string
  is_active: boolean
  created_at: string
  primary_department?: {
    id: string
    name: string
    code: string
  }
  assigned_departments: {
    id: string
    name: string
    code: string
    is_primary: boolean
  }[]
  assigned_courses: {
    id: string
    name: string
    code: string
    is_primary: boolean
    department: {
      name: string
      code: string
    }
  }[]
  enrolled_courses: {
    id: string
    name: string
    code: string
    enrollment_status: string
    department: {
      name: string
      code: string
    }
  }[]
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'all' | 'student' | 'instructor' | 'admin'>('all')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      if (!user || !isAdmin(user)) {
        toast.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }
      setCurrentUser(user)
      await loadUsers()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadUsers = async () => {
    try {
      // Use our custom session system instead of Supabase session
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        console.error('No authentication session found')
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
        console.error('Session expired')
        toast.error('Session expired - please sign in again')
        localStorage.removeItem('user_session')
        localStorage.removeItem('user_data')
        router.push('/auth/signin')
        return
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        toast.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      } else {
        const error = await response.json()
        console.error('Failed to load users:', error)
        toast.error(`Failed to load users: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Load users error:', error)
      toast.error(`Failed to load users: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    router.push('/admin/users/create')
  }

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/${userId}/edit`)
  }

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      instructor: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  const filteredUsers = users.filter(user => 
    selectedRole === 'all' || user.role === selectedRole
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Manage users, roles, and department assignments
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.length}
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
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === 'student').length}
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
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Instructors
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === 'instructor').length}
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
                  <UserCheck className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Admins
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === 'admin').length}
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
            <div className="flex space-x-4">
              {['all', 'student', 'instructor', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {role === 'all' ? 'All Users' : `${role.charAt(0).toUpperCase() + role.slice(1)}s`}
                  {role !== 'all' && ` (${users.filter(u => u.role === role).length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Users ({filteredUsers.length})
            </h3>
            
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedRole === 'all' 
                    ? 'No users have been created yet.'
                    : `No ${selectedRole}s found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.full_name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              {user.student_id && (
                                <div className="text-xs text-gray-400">
                                  ID: {user.student_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.primary_department ? (
                            <div>
                              <div className="font-medium">{user.primary_department.code}</div>
                              <div className="text-gray-500">{user.primary_department.name}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No department</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role === 'instructor' && (
                            <div>
                              <div>{user.assigned_departments.length} departments</div>
                              <div>{user.assigned_courses.length} courses</div>
                            </div>
                          )}
                          {user.role === 'student' && (
                            <div>{user.enrolled_courses.length} courses</div>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-blue-600">Full access</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}