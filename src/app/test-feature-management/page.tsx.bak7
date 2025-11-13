/**
 * Simple Test Page for Feature Management
 * デバッグ用シンプルページ
 */

'use client';

import { useState, useEffect } from 'react';

export default function TestFeatureManagementPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/feature-management');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Feature Management Test Page</h1>
        
        {loading && (
          <div className="text-blue-600">Loading...</div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {data && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Success!</strong> API responded successfully.
            <details className="mt-2">
              <summary className="cursor-pointer">View Data</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If you see "Success!", the API is working</li>
            <li>If you see an error, check the database connection</li>
            <li>Check browser console (F12) for additional errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}