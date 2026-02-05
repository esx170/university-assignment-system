'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCreateUserPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCreateStudent = async () => {
    setLoading(true);
    try {
      // Get a valid department ID first
      const deptResponse = await fetch('/api/public/departments');
      const departments = await deptResponse.json();
      const firstDept = departments[0];

      if (!firstDept) {
        setResult({ error: 'No departments available' });
        return;
      }

      const response = await fetch('/api/debug-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test.student.${Date.now()}@university.edu`,
          password: 'password123',
          full_name: 'Test Student',
          role: 'student',
          student_id: `TEST${Date.now()}`,
          primary_department_id: firstDept.id
        })
      });

      const data = await response.json();
      setResult({ status: response.status, data, department: firstDept });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testCreateInstructor = async () => {
    setLoading(true);
    try {
      // Get a valid department ID first
      const deptResponse = await fetch('/api/public/departments');
      const departments = await deptResponse.json();
      const firstDept = departments[0];

      if (!firstDept) {
        setResult({ error: 'No departments available' });
        return;
      }

      const response = await fetch('/api/debug-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test.instructor.${Date.now()}@university.edu`,
          password: 'password123',
          full_name: 'Test Instructor',
          role: 'instructor',
          primary_department_id: firstDept.id
        })
      });

      const data = await response.json();
      setResult({ status: response.status, data, department: firstDept });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test User Creation</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testCreateStudent}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Create Student'}
        </button>
        
        <button 
          onClick={testCreateInstructor}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Create Instructor'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}