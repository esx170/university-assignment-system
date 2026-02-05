'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';

import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Key, Building2, GraduationCap, BookOpen } from 'lucide-react';

type Department = {
  id: string;
  name: string;
  code: string;
};

type Course = {
  id: string;
  name: string;
  code: string;
  instructor_id: string | null;
  semester: string;
  year: number;
};

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    student_id: '',
    department_id: '',
    assigned_courses: [] as string[]
  });

  useEffect(() => {
    checkAuth();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (formData.role === 'instructor' && formData.department_id) {
      loadAvailableCourses();
    }
  }, [formData.role, formData.department_id]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !isAdmin(user)) {
        toast.error('Access denied: Administrator privileges required');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/signin');
    }
  };

  const loadAvailableCourses = async () => {
    try {
      console.log('🔍 Loading available courses...');
      
      // Use public courses endpoint
      const response = await fetch('/api/public/courses');
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Courses loaded: ${data.courses?.length || 0} courses`);
        const courses = data.courses || [];
        setAvailableCourses(courses);
        console.log('📚 Available courses set:', courses.map(c => `${c.code} - ${c.name}`));
      } else {
        console.error('❌ Failed to load courses from API');
        setAvailableCourses([]);
      }
    } catch (error) {
      console.error('❌ Load courses error:', error);
      setAvailableCourses([]);
    }
  };

  const loadDepartments = async () => {
    try {
      // Try the public departments endpoint first
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
        toast.error('Failed to load departments');
      }
    } catch (error) {
      console.error('Load departments error:', error);
      toast.error('Failed to load departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.email || !formData.password || !formData.full_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.role === 'student' && !formData.student_id) {
        toast.error('Student ID is required for students');
        return;
      }

      if (formData.role === 'student' && !formData.department_id) {
        toast.error('Department is required for students');
        return;
      }

      if (formData.role === 'instructor' && !formData.department_id) {
        toast.error('Department is required for instructors');
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

      // Create user via API
      const requestBody: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        requestBody.student_id = formData.student_id;
        requestBody.primary_department_id = formData.department_id;
      } else if (formData.role === 'instructor') {
        // For instructors, send department as assigned_departments array
        if (formData.department_id) {
          requestBody.assigned_departments = [formData.department_id];
        } else {
          // If no department selected, we need at least one for instructors
          toast.error('Please select a department for the instructor');
          return;
        }
        requestBody.primary_department_id = formData.department_id;
        
        // Add course assignments
        if (selectedCourses.length > 0) {
          requestBody.assigned_courses = selectedCourses;
        }
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('User created successfully');
        router.push('/admin/users');
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourseSelection = (courseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCourses(prev => [...prev, courseId]);
    } else {
      setSelectedCourses(prev => prev.filter(id => id !== courseId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
              <p className="text-gray-600">Add a new user to the system</p>
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
                  placeholder="user@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
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
                placeholder="John Doe"
              />
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
                    placeholder="STU001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Department *
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required={formData.role === 'student'}
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

            {/* Department for instructors (required) */}
            {formData.role === 'instructor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Primary Department *
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required={formData.role === 'instructor'}
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

                {/* Course Assignment for instructors - ALWAYS SHOW when instructor role is selected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Assign Courses (Optional)
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-3">
                      Select courses to assign to this instructor. You can also assign courses later.
                    </p>
                    
                    {/* Show loading state or courses */}
                    {!formData.department_id ? (
                      <p className="text-sm text-gray-500 italic">
                        Please select a department first to load available courses.
                      </p>
                    ) : availableCourses.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Loading courses...</p>
                        <p className="text-xs text-gray-400 mt-1">
                          If courses don't load, there may be a connection issue.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableCourses.map(course => {
                          const isCurrentlyAssigned = course.instructor_id && course.instructor_id !== '';
                          const isSelected = selectedCourses.includes(course.id);
                          
                          return (
                            <div key={course.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`course-${course.id}`}
                                checked={isSelected}
                                onChange={(e) => handleCourseSelection(course.id, e.target.checked)}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label 
                                htmlFor={`course-${course.id}`}
                                className="flex-1 text-sm text-gray-700"
                              >
                                <span className="font-medium">{course.code}</span> - {course.name}
                                <span className="text-gray-500 ml-2">({course.semester} {course.year})</span>
                                {isCurrentlyAssigned && !isSelected && (
                                  <span className="text-amber-600 ml-2">(Currently assigned to another instructor)</span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            💡 <strong>Note:</strong> You can assign courses that are already assigned to other instructors. 
                            This will reassign them to the new instructor.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCourses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Selected courses: {selectedCourses.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}