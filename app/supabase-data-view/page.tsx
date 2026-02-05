'use client'

import { useEffect, useState } from 'react'
import { Database, Users, BookOpen, FileText, Calendar } from 'lucide-react'

export default function SupabaseDataViewPage() {
  const [data, setData] = useState<any>({
    profiles: [],
    departments: [],
    courses: [],
    assignments: [],
    submissions: [],
    enrollments: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load all data from Supabase
      const [profilesRes, departmentsRes, coursesRes, assignmentsRes, submissionsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/public/departments'),
        fetch('/api/courses'),
        fetch('/api/assignments'),
        fetch('/api/submissions'),
        fetch('/api/admin/enrollments')
      ])

      const profiles = profilesRes.ok ? await profilesRes.json() : []
      const departments = departmentsRes.ok ? await departmentsRes.json() : []
      const courses = coursesRes.ok ? await coursesRes.json() : []
      const assignments = assignmentsRes.ok ? await assignmentsRes.json() : []
      const submissions = submissionsRes.ok ? await submissionsRes.json() : []
      const enrollments = enrollmentsRes.ok ? await enrollmentsRes.json() : []

      setData({
        profiles: Array.isArray(profiles) ? profiles : [],
        departments: Array.isArray(departments) ? departments : [],
        courses: Array.isArray(courses) ? courses : [],
        assignments: Array.isArray(assignments) ? assignments : [],
        submissions: Array.isArray(submissions) ? submissions : [],
        enrollments: Array.isArray(enrollments) ? enrollments : []
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-8">
            <Database className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supabase Data View</h1>
              <p className="text-gray-600">All data stored in your Supabase database</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{data.profiles.length}</div>
              <div className="text-sm text-blue-700">Users</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <Database className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{data.departments.length}</div>
              <div className="text-sm text-green-700">Departments</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{data.courses.length}</div>
              <div className="text-sm text-purple-700">Courses</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <FileText className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{data.assignments.length}</div>
              <div className="text-sm text-yellow-700">Assignments</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <Calendar className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{data.submissions.length}</div>
              <div className="text-sm text-red-700">Submissions</div>
            </div>
            <div className="bg-indigo-100 p-4 rounded-lg text-center">
              <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-900">{data.enrollments.length}</div>
              <div className="text-sm text-indigo-700">Enrollments</div>
            </div>
          </div>

          {/* Users/Profiles Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Users (Profiles Table)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.profiles.map((user: any, index: number) => (
                    <tr key={user.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-900">{user.id?.substring(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.full_name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{user.student_id || 'N/A'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departments Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 Departments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.departments.map((dept: any, index: number) => (
                    <tr key={dept.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{dept.code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{dept.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{dept.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={loadAllData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Database className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>

          {/* Database Info */}
          <div className="mt-8 bg-blue-100 border border-blue-300 rounded-lg p-6">
            <h3 className="font-bold text-blue-800 mb-3">📊 Database Information</h3>
            <div className="text-blue-700 text-sm space-y-2">
              <p>✅ <strong>All user data is stored in Supabase</strong></p>
              <p>✅ <strong>Real-time updates</strong> - Changes are immediately saved</p>
              <p>✅ <strong>Persistent storage</strong> - Data survives app restarts</p>
              <p>✅ <strong>Backup & recovery</strong> - Supabase handles data protection</p>
              <p>✅ <strong>Scalable</strong> - Can handle thousands of users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}