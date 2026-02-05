'use client';

import { useState, useEffect } from 'react';

export default function TestDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testDepartments();
  }, []);

  const testDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing public departments endpoint...');
      const response = await fetch('/api/public/departments');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments loaded:', data);
        setDepartments(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to load departments:', errorData);
        setError(`Failed to load departments: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Departments Loading</h1>
      
      <button 
        onClick={testDepartments}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Reload Departments
      </button>

      {loading && (
        <div className="text-blue-600">Loading departments...</div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Departments ({departments.length})
          </h2>
          
          {departments.length === 0 ? (
            <p className="text-gray-600">No departments found.</p>
          ) : (
            <div className="grid gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-600">Code: {dept.code}</p>
                      {dept.description && (
                        <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {dept.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}