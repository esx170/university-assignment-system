'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, Profile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalAssignments: number
  pendingSubmissions: number
  completedSubmissions: number
  upcomingDeadlines: number
  recentGrades: number
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
    upcomingDeadlines: 0,
    recentGrades: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const user = await getCurrentUser()
        if (!user) return

        setProfile(user)

        // Load role-specific stats
        if (user.role === 'student') {
          await loadStudentStats(user.id)
        } else if (user.role === 'instructor') {
          await loadInstructorStats(user.id)
        } else if (user.role === 'admin') {
          await loadAdminStats()
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const loadStudentStats = async (studentId: string) => {
    // Get enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)

    const courseIds = enrollments?.map(e => e.course_id) || []

    // Get assignments for enrolled courses
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, due_date')
      .in('course_id', courseIds)

    // Get submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, grade, graded_at')
      .eq('student_id', studentId)

    const now = new Date()
    const upcomingDeadlines = assignments?.filter(a => 
      new Date(a.due_date) > now && 
      new Date(a.due_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    ).length || 0

    const recentGrades = submissions?.filter(s => 
      s.grade !== null && s.graded_at && 
      new Date(s.graded_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length || 0

    setStats({
      totalCourses: courseIds.length,
      totalAssignments: assignments?.length || 0,
      pendingSubmissions: (assignments?.length || 0) - (submissions?.length || 0),
      completedSubmissions: submissions?.length || 0,
      upcomingDeadlines,
      recentGrades
    })
  }

  const loadInstructorStats = async (instructorId: string) => {
    // Get instructor's courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId)

    const courseIds = courses?.map(c => c.id) || []

    // Get assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .in('course_id', courseIds)

    // Get submissions needing grading
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, grade')
      .in('assignment_id', assignments?.map(a => a.id) || [])

    const pendingGrading = submissions?.filter(s => s.grade === null).length || 0
    const completedGrading = submissions?.filter(s => s.grade !== null).length || 0

    setStats({
      totalCourses: courseIds.length,
      totalAssignments: assignments?.length || 0,
      pendingSubmissions: pendingGrading,
      completedSubmissions: completedGrading,
      upcomingDeadlines: 0,
      recentGrades: 0
    })
  }

  const loadAdminStats = async () => {
    // Get total counts for admin dashboard
    const [coursesResult, assignmentsResult, usersResult] = await Promise.all([
      supabase.from('courses').select('id', { count: 'exact' }),
      supabase.from('assignments').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' })
    ])

    setStats({
      totalCourses: coursesResult.count || 0,
      totalAssignments: assignmentsResult.count || 0,
      pendingSubmissions: 0,
      completedSubmissions: 0,
      upcomingDeadlines: 0,
      recentGrades: usersResult.count || 0
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const getStatsCards = () => {
    if (profile?.role === 'student') {
      return [
        {
          title: 'Enrolled Courses',
          value: stats.totalCourses,
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Total Assignments',
          value: stats.totalAssignments,
          icon: FileText,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Pending Submissions',
          value: stats.pendingSubmissions,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        },
        {
          title: 'Completed',
          value: stats.completedSubmissions,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Upcoming Deadlines',
          value: stats.upcomingDeadlines,
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        },
        {
          title: 'Recent Grades',
          value: stats.recentGrades,
          icon: TrendingUp,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        }
      ]
    }

    if (profile?.role === 'instructor') {
      return [
        {
          title: 'My Courses',
          value: stats.totalCourses,
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Assignments Created',
          value: stats.totalAssignments,
          icon: FileText,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Pending Grading',
          value: stats.pendingSubmissions,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        },
        {
          title: 'Graded',
          value: stats.completedSubmissions,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      ]
    }

    if (profile?.role === 'admin') {
      return [
        {
          title: 'Total Courses',
          value: stats.totalCourses,
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Total Assignments',
          value: stats.totalAssignments,
          icon: FileText,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Total Users',
          value: stats.recentGrades,
          icon: TrendingUp,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        }
      ]
    }

    return []
  }

  const statsCards = getStatsCards()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}
        </h1>
        <p className="text-gray-600 capitalize">
          {profile?.role} Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No recent activity to display</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {profile?.role === 'student' && (
              <>
                <a href="/assignments" className="block text-primary-600 hover:text-primary-700">
                  View Assignments
                </a>
                <a href="/submissions" className="block text-primary-600 hover:text-primary-700">
                  My Submissions
                </a>
              </>
            )}
            {profile?.role === 'instructor' && (
              <>
                <a href="/assignments/create" className="block text-primary-600 hover:text-primary-700">
                  Create Assignment
                </a>
                <a href="/grading" className="block text-primary-600 hover:text-primary-700">
                  Grade Submissions
                </a>
              </>
            )}
            {profile?.role === 'admin' && (
              <>
                <a href="/admin/users" className="block text-primary-600 hover:text-primary-700">
                  Manage Users
                </a>
                <a href="/admin/reports" className="block text-primary-600 hover:text-primary-700">
                  View Reports
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}