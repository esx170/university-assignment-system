'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, Profile, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Department = {
  id: string
  name: string
  code: string
  description: string
  created_at: string
  updated_at: string
}

export default function DepartmentManagementPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: ''
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
      await loadDepartments()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      
      if (response.ok) {
        const departmentsData = await response.json()
        setDepartments(departmentsData)
      } else {
        console.error('Failed to load departments:', response.statusText)
        toast.error('Failed to load departments')
      }
    } catch (error: any) {
      console.error('Load departments error:', error)
      toast.error(`Failed to load departments: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code) {
      toast.error('Name and code are required')
      return
    }

    setCreating(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newDepartment),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create department')
      }

      const result = await response.json()
      toast.success('Department created successfully')
      setShowCreateModal(false)
      setNewDepartment({ name: '', code: '', description: '' })
      await loadDepartments() // Reload departments to show new one
    } catch (error: any) {
      console.error('Create department error:', error)
      toast.error(error.message || 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  const editDepartment = (department: Department) => {
    setEditingDepartment(department)
    setNewDepartment({
      name: department.name,
      code: department.code,
      description: department.description
    })
    setShowEditModal(true)
  }

  const updateDepartment = async () => {
    if (!editingDepartment || !newDepartment.name || !newDepartment.code) {
      toast.error('Name and code are required')
      return
    }

    setUpdating(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: editingDepartment.id,
          ...newDepartment
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update department')
      }

      const result = await response.json()
      toast.success('Department updated successfully')
      setShowEditModal(false)
      setEditingDepartment(null)
      setNewDepartment({ name: '', code: '', description: '' })
      await loadDepartments() // Reload departments to show changes
    } catch (error: any) {
      console.error('Update department error:', error)
      toast.error(error.message || 'Failed to update department')
    } finally {
      setUpdating(false)
    }
  }

  const deleteDepartmentConfirm = async (department: Department) => {
    if (!confirm(`Are you sure you want to delete the ${department.name} department? This action cannot be undone.`)) {
      return
    }

    setDeleting(department.id)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/departments?id=${department.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete department')
      }

      toast.success('Department deleted successfully')
      await loadDepartments() // Reload departments to remove deleted one
    } catch (error: any) {
      console.error('Delete department error:', error)
      toast.error(error.message || 'Failed to delete department')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
                <p className="mt-2 text-gray-600">Manage academic departments and their structure</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </button>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <div key={department.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                      <p className="text-sm text-gray-500">{department.code}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {department.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>0 students</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      <span>0 courses</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-2">
                  <button 
                    onClick={() => editDepartment(department)}
                    className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                    title="Edit Department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteDepartmentConfirm(department)}
                    disabled={deleting === department.id}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Delete Department"
                  >
                    {deleting === department.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first department.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </button>
            </div>
          </div>
        )}

        {/* Create Department Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center mb-4">
                  <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Create New Department</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department Name</label>
                    <input
                      type="text"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department Code</label>
                    <input
                      type="text"
                      value={newDepartment.code}
                      onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value.toUpperCase()})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="CS"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Department description..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewDepartment({ name: '', code: '', description: '' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createDepartment}
                    disabled={creating || !newDepartment.name || !newDepartment.code}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditModal && editingDepartment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center mb-4">
                  <Edit className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Edit Department</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department Name</label>
                    <input
                      type="text"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department Code</label>
                    <input
                      type="text"
                      value={newDepartment.code}
                      onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value.toUpperCase()})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="CS"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Department description..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingDepartment(null)
                      setNewDepartment({ name: '', code: '', description: '' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateDepartment}
                    disabled={updating || !newDepartment.name || !newDepartment.code}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Department'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}