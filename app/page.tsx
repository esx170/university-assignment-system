import Link from 'next/link'
import { BookOpen, Users, FileText, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            University Assignment System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline assignment submission, grading, and feedback for modern education
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signin" className="btn-primary">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-secondary">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="card p-6 text-center">
            <BookOpen className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Course Management</h3>
            <p className="text-gray-600">Create and manage courses with ease</p>
          </div>
          
          <div className="card p-6 text-center">
            <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Assignment Submission</h3>
            <p className="text-gray-600">Submit assignments digitally with file validation</p>
          </div>
          
          <div className="card p-6 text-center">
            <Award className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Automated Grading</h3>
            <p className="text-gray-600">Efficient grading with detailed feedback</p>
          </div>
          
          <div className="card p-6 text-center">
            <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
            <p className="text-gray-600">Secure access for students, instructors, and admins</p>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">For Students</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• View enrolled courses and assignments</li>
                <li>• Upload files with format validation</li>
                <li>• Track submission status and deadlines</li>
                <li>• Request deadline extensions</li>
                <li>• Receive grades and feedback</li>
                <li>• Get notifications for important updates</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">For Instructors</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Create and manage courses</li>
                <li>• Design assignments with rubrics</li>
                <li>• Review and grade submissions</li>
                <li>• Provide detailed feedback</li>
                <li>• Track student progress</li>
                <li>• Export grades and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}