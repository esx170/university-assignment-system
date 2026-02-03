'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, Profile, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type User = {
  id: string
  email: string
  full_name: string
  role: 'student' | 'instructor' | 'admin'
  student_id: string | null
  email_confirmed: boolean
  created_at: string
  last_sign_in: string | null
  is_system_admin: boolean
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'instructor' as 'student' | 'instructor',
    student_id: ''
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUserWithAuth()
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
      console.log('Loading users from API...')
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load users`)
      }
      
      const userData = await response.json()
      console.log('Users loaded successfully:', userData.length)
      setUsers(userData)
    } catch (error: any) {
      console.error('Load users error:', error)
      toast.error(`Failed to load users: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    setCreating(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.success(`${newUser.role} account created successfully`)
      setShowCreateUser(false)
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'instructor',
        student_id: ''
      })
      await loadUsers() // Reload users to show new user
    } catch (error: any) {
      console.error('Create user error:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    if (userId === currentUser?.id) {
      toast.error('Cannot modify your own role')
      return
    }

    // Find the user to check if it's the system admin
    const targetUser = users.find(u => u.id === userId)
    if (targetUser?.is_system_admin) {
      toast.error('Cannot modify the system administrator account')
      return
    }

    setUpdating(userId)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success(`User role updated to ${newRole}`)
      await loadUsers() // Reload users to reflect changes
    } catch (error: any) {
      console.error('Update role error:', error)
      toast.error(error.message || 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'instructor': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users and their roles</p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Create Instructor
              </button>
            </div>
            
            <div className="overflow-x-auto">
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
                      Student ID
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.student_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.email_confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.is_system_admin ? (
                        <span className="text-blue-600 font-medium">System Admin</span>
                      ) : (
                        <div className="flex space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                            disabled={updating === user.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                          </select>
                          {updating === user.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@university.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Password123!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'student' | 'instructor'})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="instructor">Instructor</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  {newUser.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student ID</label>
                      <input
                        type="text"
                        value={newUser.student_id}
                        onChange={(e) => setNewUser({...newUser, student_id: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="STU001"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createUser}
                    disabled={creating || !newUser.email || !newUser.password || !newUser.full_name}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Administration Rules</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>System Administrator:</strong> admin@university.edu (hardcoded)</p>
              <p>• Only the system administrator can access this dashboard</p>
              <p>• Only the system administrator can change user roles</p>
              <p>• No additional admin accounts can be created</p>
              <p>• Public registration creates student accounts only</p>
              <p>• Instructor accounts must be created by the system administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}