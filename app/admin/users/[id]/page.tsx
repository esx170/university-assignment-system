'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building2, 
  GraduationCap, 
  Calendar,
  Edit,
  Shield,
  BookOpen
} from 'lucide-react';

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

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    checkAuth();
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

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      instructor: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800'
    };
    
    const icons = {
      admin: Shield,
      instructor: BookOpen,
      student: GraduationCap
    };
    
    const Icon = icons[role as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[role as keyof typeof colors]}`}>
        <Icon className="w-4 h-4 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
                  <p className="text-gray-600">View user information and settings</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/users/${userId}/edit`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </button>
            </div>
          </div>

          {/* User Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Section */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                      <span className="text-xl font-medium text-gray-700">
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="mt-2">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name
                      </label>
                      <p className="text-gray-900">{user.full_name}</p>
                    </div>

                    {user.student_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <GraduationCap className="w-4 h-4 inline mr-1" />
                          Student ID
                        </label>
                        <p className="text-gray-900">{user.student_id}</p>
                      </div>
                    )}

                    {user.primary_department && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Building2 className="w-4 h-4 inline mr-1" />
                          Department
                        </label>
                        <p className="text-gray-900">
                          {user.primary_department.code} - {user.primary_department.name}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Created At
                      </label>
                      <p className="text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/admin/users/${userId}/edit`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </button>
                    
                    <button
                      onClick={() => router.push('/admin/users')}
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Users
                    </button>
                  </div>
                </div>

                {/* Role-specific Information */}
                <div className="bg-gray-50 rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                    {user.role === 'student' && (
                      <>
                        <p className="text-sm text-gray-600">
                          <strong>Student ID:</strong> {user.student_id || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Department:</strong> {user.primary_department?.name || 'Not assigned'}
                        </p>
                      </>
                    )}
                    {user.role === 'instructor' && (
                      <p className="text-sm text-gray-600">
                        <strong>Primary Department:</strong> {user.primary_department?.name || 'Not assigned'}
                      </p>
                    )}
                    {user.role === 'admin' && (
                      <p className="text-sm text-gray-600">
                        <strong>Access Level:</strong> Full system access
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}