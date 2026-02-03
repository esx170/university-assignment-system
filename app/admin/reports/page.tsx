'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, Profile, isAdmin } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReportsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Mock data for reports
  const userStats = [
    { name: 'Students', count: 45, color: '#3B82F6' },
    { name: 'Instructors', count: 8, color: '#10B981' },
    { name: 'Admins', count: 1, color: '#F59E0B' }
  ]

  const submissionStats = [
    { month: 'Jan', submissions: 12 },
    { month: 'Feb', submissions: 19 },
    { month: 'Mar', submissions: 25 },
    { month: 'Apr', submissions: 31 },
    { month: 'May', submissions: 28 },
    { month: 'Jun', submissions: 35 }
  ]

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
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="mt-2 text-gray-600">Analytics and insights for the university assignment system</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">54</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Courses</dt>
                    <dd className="text-lg font-medium text-gray-900">12</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                    <dd className="text-lg font-medium text-gray-900">150</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">35</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* User Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {userStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Submission Trends */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={submissionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">New student registration</p>
                  <p className="text-sm text-gray-500">john.doe@student.edu joined the system</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignment submitted</p>
                  <p className="text-sm text-gray-500">CS101 - Introduction to Programming</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">New course created</p>
                  <p className="text-sm text-gray-500">Data Structures and Algorithms</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}