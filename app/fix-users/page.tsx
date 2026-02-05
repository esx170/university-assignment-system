'use client';

import { useState } from 'react';

export default function FixUsersPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simpleSyncProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simple-sync', { method: 'POST' });
      const data = await response.json();
      setResult(data);
      
      if (response.ok && data.summary?.created > 0) {
        // After fixing, try to test the admin users API
        setTimeout(async () => {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: 'admin@university.edu',
              password: 'admin123'
            });

            if (signInData.session?.access_token) {
              const usersResponse = await fetch('/api/admin/users', {
                headers: {
                  'Authorization': `Bearer ${signInData.session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const usersData = await usersResponse.json();
              setResult(prev => ({
                ...prev,
                adminApiTest: {
                  status: usersResponse.status,
                  userCount: Array.isArray(usersData) ? usersData.length : 0,
                  success: usersResponse.ok
                }
              }));
            }
          } catch (error) {
            console.error('Admin API test failed:', error);
          }
        }, 2000);
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Fix User Management System</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will sync all auth users to the profiles table and reset the admin password.
            </p>
            
            <button 
              onClick={simpleSyncProfiles}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fixing Users...' : 'Fix User System'}
            </button>
          </div>

          {result && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Result:</h2>
              
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 mt-1">{result.error}</p>
                  {result.details && (
                    <p className="text-red-600 text-sm mt-2">{result.details}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-green-800 font-medium">Success!</h3>
                    <div className="text-green-700 mt-2 space-y-1">
                      <p>• Total users: {result.summary?.total}</p>
                      <p>• Created profiles: {result.summary?.created}</p>
                      <p>• Already existed: {result.summary?.existing}</p>
                      <p>• Errors: {result.summary?.errors}</p>
                      <p>• Admin password reset: {result.summary?.adminPasswordReset ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {result.adminApiTest && (
                    <div className={`border rounded-md p-4 ${
                      result.adminApiTest.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <h3 className={`font-medium ${
                        result.adminApiTest.success ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        Admin API Test
                      </h3>
                      <div className={`mt-2 ${
                        result.adminApiTest.success ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        <p>• Status: {result.adminApiTest.status}</p>
                        <p>• Users loaded: {result.adminApiTest.userCount}</p>
                        <p>• Success: {result.adminApiTest.success ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-blue-800 font-medium">Next Steps</h3>
                    <div className="text-blue-700 mt-2">
                      <p>1. Go to <a href="/auth/signin" className="underline">Sign In</a></p>
                      <p>2. Login with: admin@university.edu / admin123</p>
                      <p>3. Visit <a href="/admin/users" className="underline">Admin Users</a></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}