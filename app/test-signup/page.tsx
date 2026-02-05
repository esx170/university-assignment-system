'use client';

import { useState } from 'react';

export default function TestSignupPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test.${Date.now()}@example.com`,
          password: 'password123',
          full_name: 'Test User',
          student_id: `TEST${Date.now()}`,
          department_id: '1' // This should get converted to CS department UUID
        })
      });

      const data = await response.json();
      setResult({ 
        status: response.status, 
        success: response.ok,
        data 
      });
    } catch (error) {
      setResult({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithRealDepartment = async () => {
    setLoading(true);
    try {
      // First get a real department
      const deptResponse = await fetch('/api/public/departments');
      const departments = await deptResponse.json();
      const firstDept = departments[0];

      if (!firstDept) {
        setResult({ error: 'No departments available' });
        return;
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test.real.${Date.now()}@example.com`,
          password: 'password123',
          full_name: 'Test User Real Dept',
          student_id: `REAL${Date.now()}`,
          department_id: firstDept.id // Use real UUID
        })
      });

      const data = await response.json();
      setResult({ 
        status: response.status, 
        success: response.ok,
        data,
        usedDepartment: firstDept
      });
    } catch (error) {
      setResult({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Signup API</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testSignup}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Signup (Hardcoded Dept ID)'}
        </button>
        
        <button 
          onClick={testWithRealDepartment}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Signup (Real Dept UUID)'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">
            Result: {result.success ? '✅ Success' : '❌ Failed'}
          </h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}