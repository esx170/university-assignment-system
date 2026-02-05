'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Building2, GraduationCap, Save } from 'lucide-react';

type Department = {
  id: string;
  name: string;
  code: string;
};

type UserDetails = {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'instructor' | 'admin';
  student_id?: string;
  is_active: boolean;
  created_at: string;
  primary_department?: {
    id: string;
    name: string;
    code: string;
  };
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    student_id: '',
    department_id: ''
  });

  useEffect(() => {
    checkAuth();
    loadDepartments();
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !isAdmin(currentUser)) {
        toast.error('Access denied: Administrator privileges required');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/signin');
    }
  };

  const loadDepartments = async () => {
    try {
      // First try the public departments endpoint
      let response = await fetch('/api/public/departments');
      
      if (!response.ok) {
        // Fallback to authenticated endpoint with custom session
        const sessionData = localStorage.getItem('user_session')
        
        if (sessionData) {
          const session = JSON.parse(sessionData)
          response = await fetch('/api/departments', {
            headers: {
              'Authorization': `Bearer ${session.token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        setDepartments(data || []);
      } else {
        const error = await response.json();
        console.error('Failed to load departments:', error);
      }
    } catch (error) {
      console.error('Load departments error:', error);
    }
  };

  const loadUser = async () => {
    try {
      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
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

      // Get all users and find the specific one
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find((u: any) => u.id === userId);
        
        if (foundUser) {
          setUser(foundUser);
          setFormData({
            email: foundUser.email,
            full_name: foundUser.full_name,
            role: foundUser.role,
            student_id: foundUser.student_id || '',
            department_id: foundUser.primary_department?.id || ''
          });
        } else {
          toast.error('User not found');
          router.push('/admin/users');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load user');
        router.push('/admin/users');
      }
    } catch (error: any) {
      console.error('Load user error:', error);
      toast.error('Failed to load user');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate form
      if (!formData.email || !formData.full_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.role === 'student' && !formData.student_id) {
        toast.error('Student ID is required for students');
        return;
      }

      // Get custom session token
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (!sessionData || !userData) {
        toast.error('Authentication required - please sign in')
        router.push('/auth/signin')
        return
      }

      const session = JSON.parse(sessionData)
      const user = JSON.parse(userData)

      // Check if session is still valid
      if (new Date(session.expires) <= new Date()) {
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

      // Update user via API
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          primary_department_id: formData.department_id || null
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('User updated successfully');
        router.push('/admin/users'); // Redirect to users list instead of user detail page
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User Not Found</h2>
          <p className="mt-2 text-gray-600">The requested user could not be found.</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push(`/admin/users/${userId}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information and settings</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    required={formData.role === 'student'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Department
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Department for instructors */}
            {formData.role === 'instructor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Primary Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push(`/admin/users/${userId}`)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}