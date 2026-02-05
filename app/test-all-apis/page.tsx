'use client';

import { useState, useEffect } from 'react';
import { TestTube, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TestAllAPIsPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-all-apis');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: { total: 0, passed: 0, failed: 0 },
        tests: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Running comprehensive API tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TestTube className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">API Test Suite</h1>
                <p className="text-gray-600">Comprehensive backend API testing</p>
              </div>
            </div>
            <button
              onClick={runTests}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Tests
            </button>
          </div>
        </div>

        {testResults && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {testResults.summary?.total || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.summary?.passed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.summary?.failed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.summary?.total ? 
                      Math.round((testResults.summary.passed / testResults.summary.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
              
              {testResults.summary?.failed > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium">
                      {testResults.summary.failed} test(s) failed - Critical backend issues detected
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Test Results</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {testResults.tests?.map((test: any, index: number) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        {getStatusIcon(test.passed)}
                        <div className="ml-3">
                          <h3 className="font-medium text-gray-900">{test.name}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            {test.method && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                                {test.method}
                              </span>
                            )}
                            {test.url && (
                              <span className="font-mono text-xs">{test.url}</span>
                            )}
                            {test.type && (
                              <span className="inline-block bg-blue-100 px-2 py-1 rounded text-xs">
                                {test.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {test.expectedStatus && test.actualStatus && (
                          <div className="text-sm">
                            <span className="text-gray-600">Expected: </span>
                            <span className="font-mono">{test.expectedStatus}</span>
                            <br />
                            <span className="text-gray-600">Actual: </span>
                            <span className={`font-mono ${getStatusColor(test.passed)}`}>
                              {test.actualStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error */}
                    {test.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-red-800 text-sm">
                          <strong>Error:</strong> {test.error}
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    {test.response && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          View Response
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                          {typeof test.response === 'string' 
                            ? test.response 
                            : JSON.stringify(test.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* System Error */}
            {testResults.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">System Error</h2>
                <p className="text-red-700">{testResults.error}</p>
              </div>
            )}

            {/* Recommendations */}
            {testResults.summary?.failed > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-800 mb-3">Recommended Actions</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>1. <strong>Check System Diagnostics:</strong> Visit /system-diagnostic for detailed health check</p>
                  <p>2. <strong>Run Database Repair:</strong> Visit /repair-system to fix database issues</p>
                  <p>3. <strong>Verify Environment:</strong> Ensure all Supabase environment variables are set correctly</p>
                  <p>4. <strong>Check Supabase Dashboard:</strong> Verify tables exist and have proper permissions</p>
                </div>
              </div>
            )}

            {/* Raw Results */}
            <details className="bg-white rounded-lg shadow p-6">
              <summary className="text-lg font-semibold cursor-pointer">Raw Test Results</summary>
              <pre className="mt-4 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}