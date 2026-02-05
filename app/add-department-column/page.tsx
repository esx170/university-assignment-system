'use client';

import { useState } from 'react';
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function AddDepartmentColumnPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const addDepartmentColumn = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/add-department-column', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to add department column');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Database className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Department Column</h1>
              <p className="text-gray-600">Add department_id column to profiles table</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This will add a <code className="bg-gray-100 px-2 py-1 rounded">department_id</code> column 
              to the profiles table and automatically assign departments to existing users.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">What this does:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Adds department_id UUID column to profiles table</li>
                <li>Creates foreign key relationship to departments table</li>
                <li>Assigns departments to existing users automatically</li>
                <li>Enables department filtering in admin user management</li>
              </ul>
            </div>
          </div>

          <button
            onClick={addDepartmentColumn}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Adding Department Column...
              </>
            ) : (
              <>
                <Database className="w-5 h-5 mr-2" />
                Add Department Column
              </>
            )}
          </button>

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">{result.message}</h3>
                  {result.details && (
                    <div className="text-green-800 text-sm space-y-1">
                      <p>✅ Column Added: {result.details.columnAdded ? 'Yes' : 'No'}</p>
                      <p>✅ Foreign Key Added: {result.details.foreignKeyAdded ? 'Yes' : 'No'}</p>
                      <p>✅ Department Assignments: {result.details.departmentAssignments}</p>
                      
                      {result.details.assignments && result.details.assignments.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold">Sample Assignments:</p>
                          <ul className="list-disc list-inside ml-4">
                            {result.details.assignments.map((assignment: any, index: number) => (
                              <li key={index}>
                                {assignment.email} → {assignment.department}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800 text-sm">{error}</p>
                  
                  <div className="mt-4 bg-white rounded p-3 text-sm">
                    <p className="font-semibold text-gray-900 mb-2">Manual SQL (if needed):</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      ALTER TABLE profiles ADD COLUMN department_id UUID REFERENCES departments(id);
                    </code>
                    <p className="text-gray-600 mt-2">
                      Run this SQL in your Supabase SQL Editor if the automatic method fails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/admin/users"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to User Management
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}