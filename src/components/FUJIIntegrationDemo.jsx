/**
 * Test F-UJI Integration with Frontend
 * This demonstrates the working F-UJI connection for the demo
 */

import React, { useState } from 'react';
import { FiPlay, FiCheck, FiAward, FiBarChart2 } from 'react-icons/fi';

const FUJIIntegrationDemo = () => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Call F-UJI directly from frontend for demo purposes
  const callFUJIForDemo = async (url) => {
    // Use the proxy to avoid CORS issues
    const response = await fetch('/fuji/api/v1/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + btoa('marvel:wonderwoman')
      },
      body: JSON.stringify({
        object_identifier: url,
        test_debug: false,
        use_datacite: true,
        datacite_endpoint: "https://api.datacite.org/application/vnd.datacite.datacite+json/",
        re3data_endpoint: "https://www.re3data.org/api/beta/repositories"
      })
    });

    if (!response.ok) {
      throw new Error(`F-UJI returned status ${response.status}`);
    }

    return await response.json();
  };

  const demonstrateFUJI = async () => {
    setIsAssessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Demo: Calling F-UJI API directly...');
      
      // Test with a well-known dataset
      const testUrl = 'https://doi.org/10.5281/zenodo.3778056';
      const fujiResult = await callFUJIForDemo(testUrl);
      
      if (fujiResult && fujiResult.summary) {
        setResult({
          overall: Math.round(fujiResult.summary.score_percent.FAIR),
          findable: fujiResult.summary.score_percent.F,
          accessible: fujiResult.summary.score_percent.A,
          interoperable: fujiResult.summary.score_percent.I,
          reusable: fujiResult.summary.score_percent.R,
          testUrl,
          assessmentTime: new Date().toLocaleString()
        });
      } else {
        throw new Error('Invalid F-UJI response format');
      }
    } catch (err) {
      console.error('F-UJI Demo Error:', err);
      setError(err.message);
    } finally {
      setIsAssessing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    if (score >= 40) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiAward className="w-5 h-5 text-blue-600" />
          F-UJI Integration Demo
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          F-UJI Running on localhost:1071
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          This demonstrates real F-UJI FAIR assessment integration. 
          Click below to assess a published dataset using the actual F-UJI API.
        </p>
      </div>

      <button
        onClick={demonstrateFUJI}
        disabled={isAssessing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {isAssessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Assessing with F-UJI...
          </>
        ) : (
          <>
            <FiPlay className="w-4 h-4" />
            Demonstrate F-UJI Assessment
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <span className="font-medium">Error:</span>
            <span className="text-sm">{error}</span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            Make sure F-UJI Docker container is running: docker ps | grep fuji
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Real F-UJI Assessment Result
              </h4>
              <FiCheck className="w-5 h-5 text-green-600" />
            </div>
            
            {/* Overall Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: getScoreColor(result.overall) }}
                  >
                    {result.overall}%
                  </div>
                  <span className="text-sm text-gray-600">FAIR Score</span>
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Professional Assessment
                </div>
              </div>
              
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${result.overall}%`,
                      backgroundColor: getScoreColor(result.overall)
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* FAIR Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Findable</span>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(result.findable) }}>
                    {result.findable}%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Accessible</span>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(result.accessible) }}>
                    {result.accessible}%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Interoperable</span>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(result.interoperable) }}>
                    {result.interoperable}%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Reusable</span>
                  <span className="text-sm font-bold" style={{ color: getScoreColor(result.reusable) }}>
                    {result.reusable}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Dataset: {result.testUrl}</div>
                <div>Assessed: {result.assessmentTime}</div>
                <div>Tool: F-UJI v2.2.0 (Docker)</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <FiBarChart2 className="w-4 h-4" />
              <span className="font-medium">Integration Success!</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Your RWDE platform can now provide professional FAIR assessments using real F-UJI integration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FUJIIntegrationDemo;
