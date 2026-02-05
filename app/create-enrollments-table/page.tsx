'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEnrollmentsTablePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const createTable = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Get session token
      const sessionData = localStorage.getItem('user_session')
      if (!sessionData) {
        setResult({ error: 'Please sign in first' })
        return
      }

      const session = JSON.parse(sessionData)

      const response = await fetch('/api/create-enrollments-table', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResult(data)

    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Create Enrollments Table
          </h1>
          
          <p className="text-gray-600 mb-6">
            This will create the course_enrollments table needed for student enrollment functionality.
          </p>

          <button
            onClick={createTable}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Table'}
          </button>

          {result && (
            <div className="mt-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-red-800 font-medium mb-2">Error</h3>
                  <p className="text-red-700 mb-4">{result.error}</p>
                  
                  {result.sql && (
                    <div className="mt-4">
                      <h4 className="text-red-800 font-medium mb-2">Manual SQL:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {result.sql}
                      </pre>
                      
                      {result.instructions && (
                        <div className="mt-4">
                          <h4 className="text-red-800 font-medium mb-2">Instructions:</h4>
                          <ol className="list-decimal list-inside text-red-700 space-y-1">
                            {result.instructions.map((instruction: string, index: number) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-green-800 font-medium mb-2">Success!</h3>
                  <p className="text-green-700">{result.message}</p>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/admin/enrollments')}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Go to Enrollments
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}