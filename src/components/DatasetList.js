import React, { useState, useEffect } from 'react';
import { listDatasets, getDatasetContent } from '../utils/storageUtils';
import { Storage } from 'aws-amplify';
import FairScoreDisplay from './FairScoreDisplay';

export default function DatasetList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Storage config:', Storage.configure());
      console.log('Starting to load datasets...');

      const data = await listDatasets();
      if (!data || data.length === 0) {
        console.log('No datasets found');
        setDatasets([]);
        setError('No datasets found in the specified location');
        return;
      }

      console.log('Datasets loaded successfully:', data);
      setDatasets(data);
    } catch (err) {
      console.error('Detailed error loading datasets:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
      });
      setError(`Failed to load datasets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (dataset) => {
    try {
      setSelectedDataset(dataset);

      const content = await getDatasetContent(dataset.key);
      const rows = content.split('\n');
      const headers = rows[0].split(',');
      const previewRows = rows.slice(1, 6).map((row) => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });

      setPreviewData({ headers, rows: previewRows });
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load dataset preview');
    }
  };

  if (loading) {
    return <div className="p-4">Loading datasets...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Datasets
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2 text-xs">
                  Please check your network connection and try refreshing the
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available Datasets</h2>
      <div className="space-y-3">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => loadPreview(dataset)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-lg mb-1">{dataset.name}</h4>
                <p className="text-sm text-gray-500 mb-1">
                  Size: {(dataset.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-500">
                  Last modified: {new Date(dataset.lastModified).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <FairScoreDisplay datasetKey={dataset.key} compact={true} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedDataset && previewData && (
        <div className="border rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Preview: {selectedDataset.name}
          </h3>
          
          {/* FAIR Score Section */}
          <div className="mb-6">
            <FairScoreDisplay datasetKey={selectedDataset.key} compact={false} />
          </div>

          {/* Data Preview Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {previewData.headers.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.rows.map((row, idx) => (
                  <tr key={idx}>
                    {previewData.headers.map((header) => (
                      <td
                        key={header}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}