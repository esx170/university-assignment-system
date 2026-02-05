'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Copy, CheckCircle, ArrowRight } from 'lucide-react'

export default function SetupEnrollmentsPage() {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const sql = `CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  grade NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON course_enrollments FOR ALL USING (true);`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Setup Enrollment System
            </h1>
            <p className="text-gray-600">
              Create the course_enrollments table to enable student enrollment functionality
            </p>
          </div>

          {/* Problem Description */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Current Issue
            </h2>
            <p className="text-red-700">
              When trying to enroll students, you see: <strong>"Enrollment failed: Course enrollments feature not available"</strong>
            </p>
            <p className="text-red-600 mt-2">
              This happens because the <code>course_enrollments</code> table doesn't exist yet.
            </p>
          </div>

          {/* Solution Steps */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Solution: Create the Table
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Go to Supabase Dashboard</h3>
                  <p className="text-gray-600">Open your Supabase project dashboard in a new tab</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Navigate to SQL Editor</h3>
                  <p className="text-gray-600">Find "SQL Editor" in the left sidebar and click it</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Copy and Paste the SQL</h3>
                  <p className="text-gray-600">Copy the SQL below and paste it into the SQL Editor</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Run the SQL</h3>
                  <p className="text-gray-600">Click the "Run" button to execute the SQL and create the table</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  5
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Test Enrollment</h3>
                  <p className="text-gray-600">Return to the enrollment page and try enrolling a student</p>
                </div>
              </div>
            </div>
          </div>

          {/* SQL Code */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                SQL Code to Run
              </h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{sql}</pre>
            </div>
          </div>

          {/* What This Creates */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              What This Creates
            </h2>
            <ul className="space-y-2 text-blue-700">
              <li>• <strong>course_enrollments table</strong> - Stores student-course relationships</li>
              <li>• <strong>Indexes</strong> - For fast queries on students, courses, and status</li>
              <li>• <strong>Security policies</strong> - Proper access control</li>
              <li>• <strong>Constraints</strong> - Prevents duplicate enrollments</li>
              <li>• <strong>Foreign keys</strong> - Links to students and courses</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/admin/enrollments')}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Enrollments
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Admin
            </button>
          </div>

          {/* Success Message */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              After Running the SQL
            </h2>
            <p className="text-green-700">
              The enrollment system will be fully functional! You'll be able to:
            </p>
            <ul className="mt-2 space-y-1 text-green-700">
              <li>• Enroll students in courses</li>
              <li>• View all enrollments</li>
              <li>• Track enrollment status</li>
              <li>• Manage course capacity</li>
              <li>• Assign grades to enrolled students</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}