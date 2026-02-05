'use client';

import { useState } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

export default function RestoreWorkingStatePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const restoreOriginalSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restore-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testOriginalSignup = async () => {
    setLoading(true);
    try {
      // Test the original signup method
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.signUp({
        email: `restore.test.${Date.now()}@example.com`,
        password: 'password123',
        options: {
          data: {
            full_name: 'Restore Test User',
            role: 'student',
            student_id: `RESTORE${Date.now()}`,
            department_id: '1'
          }
        }
      });

      setResult({
        success: !error,
        data: data,
        error: error?.message,
        method: 'Original Supabase signup'
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'Original Supabase signup'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <RotateCcw className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Restore Working State</h1>
              <p className="text-blue-700">Get back to the original working signup</p>
            </div>
          </div>

          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">What happened:</h3>
            <p className="text-blue-700 text-sm">
              The signup worked before, but our changes made it complex. Let's restore the simple, 
              working version that was functioning earlier.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={restoreOriginalSignup}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {loading ? 'Restoring...' : 'RESTORE ORIGINAL SIGNUP'}
            </button>

            <button
              onClick={testOriginalSignup}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {loading ? 'Testing...' : 'TEST ORIGINAL METHOD'}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-medium mb-2">Restoration plan:</h4>
            <ul className="space-y-1">
              <li>• Revert signup page to use simple Supabase auth</li>
              <li>• Restore the original working trigger function</li>
              <li>• Remove complex API endpoints that caused issues</li>
              <li>• Test with the exact same method that worked before</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}