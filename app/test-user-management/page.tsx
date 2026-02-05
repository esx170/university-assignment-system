'use client';

import { useState } from 'react';

export default function TestUserManagementPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCreateTrigger = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-users');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const syncProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sync-profiles', { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testUsersAPI = async () => {
    setLoading(true);
    try {
      // First get a session token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Try to sign in as admin
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@university.edu',
        password: 'admin123'
      });

      if (signInError) {
        setResult({ error: 'Failed to sign in as admin', details: signInError.message });
        return;
      }

      const token = signInData.session?.access_token;
      if (!token) {
        setResult({ error: 'No access token received' });
        return;
      }

      // Now test the users API
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult({ 
        status: response.status, 
        data: data,
        message: response.ok ? 'Users API working!' : 'Users API failed'
      });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test User Management</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testCreateTrigger}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Check Database Status'}
        </button>
        
        <button 
          onClick={syncProfiles}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sync All User Profiles'}
        </button>
        
        <button 
          onClick={testUsersAPI}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Users API'}
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