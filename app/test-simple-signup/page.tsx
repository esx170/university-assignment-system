'use client';

import { useState } from 'react';
import { TestTube, CheckCircle, XCircle } from 'lucide-react';

export default function TestSimpleSignupPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSimpleSignup = async () => {
    setLoading(true);
    try {
      console.log('Testing simple signup...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const testEmail = `simple.test.${Date.now()}@example.com`;
      const testPassword = 'password123';

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Simple Test User',
            role: 'student',
            student_id: `SIMPLE${Date.now()}`,
            department_id: '1'
          }
        }
      });

      setResult({
        success: !error,
        data: {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at
          } : null,
          session: !!data.session,
          needsConfirmation: !data.session
        },
        error: error?.message,
        method: 'Simple Supabase auth.signUp()',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'Simple Supabase auth.signUp()',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreWorkingState = async () => {
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

  return (
    <div className="min-h-screen bg-green-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <TestTube className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-green-900">Test Simple Signup</h1>
              <p className="text-green-700">Test the original working signup method</p>
            </div>
          </div>

          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-800 mb-2">What this tests:</h3>
            <p className="text-green-700 text-sm">
              This uses the exact same simple Supabase auth.signUp() method that was working before.
              It relies on the trigger function to create the profile automatically.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={restoreWorkingState}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Restoring...' : '1. RESTORE WORKING TRIGGER'}
            </button>

            <button
              onClick={testSimpleSignup}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              <TestTube className="w-5 h-5 mr-2" />
              {loading ? 'Testing...' : '2. TEST SIMPLE SIGNUP'}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <h3 className="font-bold">
                  {result.success ? 'SUCCESS ✅' : 'FAILED ❌'}
                </h3>
              </div>
              <pre className="text-sm overflow-auto bg-white p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-medium mb-2">How the original method worked:</h4>
            <ul className="space-y-1">
              <li>• User calls supabase.auth.signUp() with user_metadata</li>
              <li>• Supabase creates the auth user</li>
              <li>• Trigger function automatically creates profile record</li>
              <li>• Simple, reliable, no complex API calls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}