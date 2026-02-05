'use client';

import { useState } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

export default function EmergencyFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const emergencyFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emergency-fix', {
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

  const testSignupNow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emergency-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `emergency.test.${Date.now()}@example.com`,
          password: 'password123',
          full_name: 'Emergency Test User',
          student_id: `EMRG${Date.now()}`
        })
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
    <div className="min-h-screen bg-red-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-red-900">EMERGENCY FIX</h1>
              <p className="text-red-700">Direct database repair - no complex systems</p>
            </div>
          </div>

          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-800 mb-2">Current Issue:</h3>
            <p className="text-red-700 text-sm">
              "Database error saving new user" - Users cannot sign up because the profiles table 
              is not being populated when new users are created in Supabase Auth.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={emergencyFix}
              disabled={loading}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Zap className="w-5 h-5 mr-2" />
              {loading ? 'Applying Emergency Fix...' : 'APPLY EMERGENCY FIX'}
            </button>

            <button
              onClick={testSignupNow}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'TEST SIGNUP NOW'}
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
            <h4 className="font-medium mb-2">What this does:</h4>
            <ul className="space-y-1">
              <li>• Removes all broken trigger functions</li>
              <li>• Creates a simple, working profiles table</li>
              <li>• Sets up basic user creation without triggers</li>
              <li>• Tests signup immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}