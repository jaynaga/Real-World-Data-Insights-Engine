import React, { useState } from 'react';
import { getFairScore } from '../utils/fairScoreUtils';
import { clearOldFairScores, regenerateFairScores } from '../utils/clearOldFairScores';

const FUJIIntegrationDemo = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clearResult, setClearResult] = useState(null);

  const testFUJIIntegration = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🧪 Testing F-UJI integration...');
      
      // Test with a dummy dataset key - F-UJI will use the demo URL anyway
      const result = await getFairScore('test-dataset/dummy.csv');
      
      console.log('🧪 F-UJI test result:', result);
      setTestResult(result);
    } catch (err) {
      console.error('🧪 F-UJI test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFUJI = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🔬 Testing direct F-UJI call...');
      
      const response = await fetch('http://localhost:1071/fuji/api/v1/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa('marvel:wonderwoman')
        },
        mode: 'cors',
        body: JSON.stringify({
          object_identifier: 'https://doi.org/10.5281/zenodo.3778056',
          test_debug: false,
          use_datacite: true,
          datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
          re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
        })
      });

      if (!response.ok) {
        throw new Error(`F-UJI returned status ${response.status}`);
      }

      const fujiResult = await response.json();
      console.log('🔬 Direct F-UJI result:', fujiResult);
      
      if (fujiResult && fujiResult.summary) {
        setTestResult({
          direct_fuji: true,
          fair_percentage: Math.round(fujiResult.summary.score_percent.FAIR),
          raw_response: fujiResult
        });
      }
    } catch (err) {
      console.error('🔬 Direct F-UJI test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearOldScores = async () => {
    setLoading(true);
    setError(null);
    setClearResult(null);

    try {
      console.log('🧹 Clearing old FAIR scores...');
      const result = await clearOldFairScores();
      console.log('🧹 Clear result:', result);
      setClearResult(result);
    } catch (err) {
      console.error('🧹 Clear failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAllScores = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Regenerating all FAIR scores with F-UJI...');
      await regenerateFairScores();
    } catch (err) {
      console.error('🔄 Regeneration failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">F-UJI Integration Demo</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testFUJIIntegration}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
        >
          {loading ? 'Testing...' : 'Test F-UJI via getFairScore()'}
        </button>
        
        <button
          onClick={testDirectFUJI}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-4"
        >
          {loading ? 'Testing...' : 'Test Direct F-UJI API'}
        </button>
        
        <button
          onClick={clearOldScores}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded mr-4"
        >
          {loading ? 'Clearing...' : 'Clear Old FAIR Scores'}
        </button>
        
        <button
          onClick={regenerateAllScores}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Regenerating...' : 'Regenerate All with F-UJI'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">Test Result:</h3>
          {testResult.fair_percentage && (
            <p className="mb-2">
              <strong>FAIR Score:</strong> {testResult.fair_percentage}%
            </p>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">Raw Data</summary>
            <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {clearResult && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">Clear Results:</h3>
          <p>Total: {clearResult.total}, Deleted: {clearResult.deleted}, Errors: {clearResult.errors}</p>
          {clearResult.errors > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">Error Details</summary>
              <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto text-sm">
                {JSON.stringify(clearResult.results.filter(r => r.status === 'error'), null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-bold mb-2">Integration Status:</h3>
        <ul className="space-y-1 text-sm">
          <li>• F-UJI Container: Running on localhost:1071</li>
          <li>• CORS: Enabled with ENABLE_CORS=true</li>
          <li>• Auth: Basic marvel:wonderwoman</li>
          <li>• Frontend: React on localhost:3001</li>
        </ul>
      </div>
    </div>
  );
};

export default FUJIIntegrationDemo;
