'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function SystemDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system-diagnostic');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      setDiagnostics({
        overall: 'CRITICAL - API Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      );
    }
    
    if (typeof status === 'string') {
      if (status.includes('HEALTHY')) {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      } else if (status.includes('PARTIAL')) {
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      } else {
        return <XCircle className="w-5 h-5 text-red-500" />;
      }
    }
    
    return <AlertTriangle className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-600' : 'text-red-600';
    }
    
    if (typeof status === 'string') {
      if (status.includes('HEALTHY')) return 'text-green-600';
      if (status.includes('PARTIAL')) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Running system diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
              <p className="text-gray-600 mt-2">Comprehensive backend health check</p>
            </div>
            <button
              onClick={runDiagnostics}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {diagnostics && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                {getStatusIcon(diagnostics.overall)}
                <h2 className="text-xl font-semibold ml-3">Overall System Status</h2>
              </div>
              <div className={`text-lg font-medium ${getStatusColor(diagnostics.overall)}`}>
                {diagnostics.overall}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Last checked: {new Date(diagnostics.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Environment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  {getStatusIcon(diagnostics.environment?.supabaseUrl)}
                  <span className="ml-2">Supabase URL</span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(diagnostics.environment?.supabaseAnonKey)}
                  <span className="ml-2">Anon Key</span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(diagnostics.environment?.supabaseServiceKey)}
                  <span className="ml-2">Service Key</span>
                </div>
                <div className="flex items-center">
                  <span className="ml-7">Environment: {diagnostics.environment?.nodeEnv}</span>
                </div>
              </div>
              
              {diagnostics.environment?.urls && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                  <p><strong>Supabase URL:</strong> {diagnostics.environment.urls.supabaseUrl}</p>
                  <p><strong>Anon Key:</strong> {diagnostics.environment.urls.anonKey}</p>
                  <p><strong>Service Key:</strong> {diagnostics.environment.urls.serviceKey}</p>
                </div>
              )}
            </div>

            {/* Database */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Database Status</h2>
              
              {/* Connection */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  {getStatusIcon(diagnostics.database?.connection?.success)}
                  <span className="ml-2 font-medium">Database Connection</span>
                </div>
                {diagnostics.database?.connection?.error && (
                  <p className="text-red-600 text-sm ml-7">
                    Error: {diagnostics.database.connection.error}
                  </p>
                )}
              </div>

              {/* Write Test */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  {getStatusIcon(diagnostics.database?.writeTest?.success)}
                  <span className="ml-2 font-medium">Write Operations</span>
                </div>
                {diagnostics.database?.writeTest?.error && (
                  <p className="text-red-600 text-sm ml-7">
                    Error: {diagnostics.database.writeTest.error}
                  </p>
                )}
              </div>

              {/* Tables */}
              {diagnostics.database?.tables && (
                <div>
                  <h3 className="font-medium mb-2">Database Tables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(diagnostics.database.tables).map(([table, status]: [string, any]) => (
                      <div key={table} className="flex items-center">
                        {getStatusIcon(status.exists)}
                        <span className="ml-2 text-sm">
                          {table} {status.hasData && '(has data)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Authentication */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
              <div className="flex items-center mb-2">
                {getStatusIcon(diagnostics.auth?.connection)}
                <span className="ml-2 font-medium">Auth Connection</span>
              </div>
              {diagnostics.auth?.userCount !== undefined && (
                <p className="text-sm text-gray-600 ml-7">
                  Users in system: {diagnostics.auth.userCount}
                </p>
              )}
              {diagnostics.auth?.error && (
                <p className="text-red-600 text-sm ml-7">
                  Error: {diagnostics.auth.error}
                </p>
              )}
            </div>

            {/* API Endpoints */}
            {diagnostics.apis && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
                <div className="space-y-2">
                  {Object.entries(diagnostics.apis).map(([endpoint, status]: [string, any]) => (
                    <div key={endpoint} className="flex items-center">
                      {getStatusIcon(status.accessible && status.ok)}
                      <span className="ml-2 text-sm">
                        {endpoint} 
                        {status.status && ` (${status.status})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Error */}
            {diagnostics.systemError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">System Error</h2>
                <p className="text-red-700 mb-2">{diagnostics.systemError.message}</p>
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-600">Stack Trace</summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {diagnostics.systemError.stack}
                  </pre>
                </details>
              </div>
            )}

            {/* Raw Data */}
            <details className="bg-white rounded-lg shadow p-6">
              <summary className="text-lg font-semibold cursor-pointer">Raw Diagnostic Data</summary>
              <pre className="mt-4 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}