'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserWithAuth, Profile, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Settings, Shield, Database, Mail, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    allowPublicRegistration: true,
    requireEmailConfirmation: false,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,zip,txt',
    systemName: 'University Assignment System',
    adminEmail: 'admin@university.edu'
  })
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadSettings()
  }, [])

  const checkAuthAndLoadSettings = async () => {
    try {
      const user = await getCurrentUserWithAuth()
      if (!user || !isAdmin(user)) {
        toast.error('Access denied: Administrator privileges required')
        router.push('/dashboard')
        return
      }
      setCurrentUser(user)
      await loadSettings()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Load settings error:', error)
      toast.error('Failed to load settings')
    }
  }

  const checkAuth = async () => {
    // This method is now replaced by checkAuthAndLoadSettings
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          allowPublicRegistration: settings.allowPublicRegistration,
          requireEmailConfirmation: settings.requireEmailConfirmation,
          maxFileSize: settings.maxFileSize,
          allowedFileTypes: settings.allowedFileTypes,
          systemName: settings.systemName
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      toast.success('Settings saved successfully')
    } catch (error: any) {
      console.error('Save settings error:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Authentication Settings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Authentication Settings</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Allow Public Registration</label>
                    <p className="text-sm text-gray-500">Allow students to register through the public signup page</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowPublicRegistration}
                    onChange={(e) => handleSettingChange('allowPublicRegistration', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Require Email Confirmation</label>
                    <p className="text-sm text-gray-500">Users must confirm their email before accessing the system</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireEmailConfirmation}
                    onChange={(e) => handleSettingChange('requireEmailConfirmation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Settings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">File Upload Settings</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={settings.allowedFileTypes}
                    onChange={(e) => handleSettingChange('allowedFileTypes', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="pdf,doc,docx,zip,txt"
                  />
                  <p className="mt-1 text-sm text-gray-500">Comma-separated list of allowed file extensions</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Database className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">System Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    System Name
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => handleSettingChange('systemName', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    System Administrator Email
                  </label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">This is the hardcoded system administrator email</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Statistics */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">System Statistics</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-500">Active Courses</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-500">Total Submissions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}