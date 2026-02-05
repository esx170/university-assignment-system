'use client';

import { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function RepairSystemPage() {
  const [repairLog, setRepairLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runRepair = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/repair-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      setRepairLog(data);
    } catch (error) {
      setRepairLog({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        steps: []
      });
    } finally {
      setLoading(false);
    }
  };

  const repairActions = [
    {
      id: 'test-write',
      title: 'Test Write Operations',
      description: 'Test if database write operations are working',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'fix-departments',
      title: 'Fix Departments',
      description: 'Ensure departments table has data and write access works',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'fix-profiles',
      title: 'Fix User Profiles',
      description: 'Create missing profiles for existing auth users',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      id: 'fix-permissions',
      title: 'Check Permissions',
      description: 'Verify database permissions and RLS settings',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'full-repair',
      title: 'Full System Repair',
      description: 'Run all repair operations in sequence',
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Wrench className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Repair Tool</h1>
              <p className="text-gray-600">Fix critical backend database issues</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-yellow-800 font-medium">Critical Issues Detected</h3>
                <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                  <li>• Database write operations failing</li>
                  <li>• User signup not working</li>
                  <li>• Data not persisting</li>
                  <li>• API endpoints returning errors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Repair Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {repairActions.map((action) => (
            <div key={action.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {action.description}
              </p>
              <button
                onClick={() => runRepair(action.id)}
                disabled={loading}
                className={`w-full text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Running...
                  </div>
                ) : (
                  action.title
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Repair Results */}
        {repairLog && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              {repairLog.success ? (
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 mr-3" />
              )}
              <h2 className="text-xl font-semibold">
                Repair {repairLog.success ? 'Completed' : 'Failed'}
              </h2>
            </div>

            {/* Steps */}
            {repairLog.steps && repairLog.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Repair Steps:</h3>
                <div className="space-y-1">
                  {repairLog.steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {repairLog.errors && repairLog.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-800 mb-2">Errors:</h3>
                <div className="space-y-1">
                  {repairLog.errors.map((error: string, index: number) => (
                    <div key={index} className="flex items-start text-sm">
                      <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-red-700">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Log */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                View Raw Repair Log
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(repairLog, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-3">Quick Actions</h3>
          <div className="space-y-2 text-sm">
            <p className="text-blue-700">
              1. <strong>Start with "Test Write Operations"</strong> to identify the core issue
            </p>
            <p className="text-blue-700">
              2. <strong>Run "Fix Departments"</strong> to ensure basic data exists
            </p>
            <p className="text-blue-700">
              3. <strong>Run "Fix User Profiles"</strong> to sync auth users with profiles
            </p>
            <p className="text-blue-700">
              4. <strong>Use "Full System Repair"</strong> for comprehensive fix
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}