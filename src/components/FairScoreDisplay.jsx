import React, { useState, useEffect } from 'react';
import { getFairScore, formatFairScoreForDisplay } from '../utils/fairScoreUtils';
import { FiAward, FiBarChart2 } from 'react-icons/fi';

const FairScoreDisplay = ({ datasetKey, compact = false }) => {
  const [fairScoreData, setFairScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadFairScore();
  }, [datasetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFairScore = async () => {
    try {
      setLoading(true);
      setGenerating(false);
      
      // Use the main getFairScore function directly
      const scoreData = await getFairScore(datasetKey);
      setFairScoreData(scoreData);
    } catch (error) {
      console.error('Error loading FAIR score:', error);
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-500">Loading FAIR score...</span>
      </div>
    );
  }

  if (generating) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border border-green-200">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Generating...</span>
          </div>
          <span className="text-xs text-gray-600">Creating FAIR assessment</span>
        </div>
      );
    } else {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiAward className="w-4 h-4" />
              FAIR Score
            </h4>
          </div>
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Generating FAIR Score
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Creating automated FAIR compliance assessment for your dataset...
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-600">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <span>This will take just a moment</span>
            </div>
          </div>
        </div>
      );
    }
  }

  const displayData = formatFairScoreForDisplay(fairScoreData);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!displayData.isAvailable ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Analyzing...</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: displayData.color }}
          >
            <FiAward className="w-3 h-3" />
            {displayData.percentage}%
          </div>
        )}
        <span className="text-xs text-gray-600">{displayData.status}</span>
      </div>
    );
  }

  // Handle no score available case for full display
  if (!displayData.isAvailable) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAward className="w-4 h-4" />
            FAIR Score
          </h4>
        </div>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiBarChart2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            FAIR Score Pending
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Automated FAIR compliance analysis in progress. 
            Scores will be available shortly after upload processing.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Processing dataset...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiAward className="w-4 h-4" />
          FAIR Score
        </h4>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="text-2xl font-bold"
              style={{ color: displayData.color }}
            >
              {displayData.percentage}%
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({displayData.total})
            </span>
          </div>
          <div className="text-sm font-medium" style={{ color: displayData.color }}>
            {displayData.status}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${displayData.percentage}%`,
                backgroundColor: displayData.color
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {displayData.breakdown && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(displayData.breakdown).map(([category, score]) => (
            <div key={category} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{category}</span>
              <span className="font-medium">{score}</span>
            </div>
          ))}
        </div>
      )}

      {!fairScoreData && (
        <div className="text-center py-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            No FAIR score available
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {compact ? 'Score will be generated for new uploads' : 'FAIR scores are automatically generated for new dataset uploads. For existing datasets, contact administrator for batch processing.'}
          </div>
          {!compact && (
            <button
              onClick={() => {
                // This could trigger manual score generation
                console.log('Manual FAIR score generation requested for:', datasetKey);
                alert('FAIR score generation requested. This feature requires administrator setup.');
              }}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Request FAIR Score
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FairScoreDisplay;
