'use client';

import { useState, useEffect } from 'react';

interface DepartmentCheckResult {
  tableExists: boolean;
  tableInfo: any[];
  columnInfo: any[];
  sampleData: any[];
  departmentCount: number;
  errors: {
    tableError: any;
    columnError: any;
    dataError: any;
    countError: any;
  };
}

export default function CheckDepartmentsPage() {
  const [result, setResult] = useState<DepartmentCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDepartments();
  }, []);

  const checkDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/check-departments');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to check departments');
        return;
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Checking Departments Table...</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Departments Table Check</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={checkDepartments}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Departments Table Check</h1>
      
      {result && (
        <div className="space-y-6">
          {/* Table Existence */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Table Status</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              result.tableExists 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {result.tableExists ? '✅ Table EXISTS' : '❌ Table NOT FOUND'}
            </div>
            {result.departmentCount !== null && (
              <p className="mt-2 text-gray-600">
                Total departments: <strong>{result.departmentCount}</strong>
              </p>
            )}
          </div>

          {/* Column Structure */}
          {result.columnInfo && result.columnInfo.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Table Structure</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Column</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Nullable</th>
                      <th className="px-4 py-2 text-left">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.columnInfo.map((col, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 font-mono">{col.column_name}</td>
                        <td className="px-4 py-2">{col.data_type}</td>
                        <td className="px-4 py-2">{col.is_nullable}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {col.column_default || 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sample Data */}
          {result.sampleData && result.sampleData.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Sample Data</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sampleData.map((dept, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 font-mono text-sm">{dept.id}</td>
                        <td className="px-4 py-2">{dept.name}</td>
                        <td className="px-4 py-2 font-mono">{dept.code}</td>
                        <td className="px-4 py-2 text-sm">{dept.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {(result.errors.tableError || result.errors.columnError || result.errors.dataError) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Errors/Warnings</h2>
              {result.errors.tableError && (
                <div className="mb-2">
                  <strong>Table Error:</strong> {JSON.stringify(result.errors.tableError)}
                </div>
              )}
              {result.errors.columnError && (
                <div className="mb-2">
                  <strong>Column Error:</strong> {JSON.stringify(result.errors.columnError)}
                </div>
              )}
              {result.errors.dataError && (
                <div className="mb-2">
                  <strong>Data Error:</strong> {JSON.stringify(result.errors.dataError)}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={checkDepartments}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Check
          </button>
        </div>
      )}
    </div>
  );
}