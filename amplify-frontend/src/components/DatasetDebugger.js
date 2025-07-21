import React, { useState } from 'react';
import { listDatasets } from '../utils/storageUtils';
import { exploreS3Structure, uploadSampleDatasets } from '../debug-s3';

const DatasetDebugger = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const testListDatasets = async () => {
    setLoading(true);
    try {
      console.log('Testing listDatasets function...');
      const datasets = await listDatasets();
      setResults({ type: 'datasets', data: datasets });
    } catch (error) {
      setResults({ type: 'datasets', error: error.message });
    }
    setLoading(false);
  };

  const exploreStructure = async () => {
    setLoading(true);
    try {
      console.log('Exploring S3 structure...');
      const structure = await exploreS3Structure();
      setResults({ type: 'structure', data: structure });
    } catch (error) {
      setResults({ type: 'structure', error: error.message });
    }
    setLoading(false);
  };

  const uploadSamples = async () => {
    setLoading(true);
    try {
      console.log('Uploading sample datasets...');
      const uploadResults = await uploadSampleDatasets();
      setResults({ type: 'upload', data: uploadResults });
    } catch (error) {
      setResults({ type: 'upload', error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007acc', margin: '20px', background: '#f9f9f9' }}>
      <h3 style={{ color: '#007acc' }}>Dataset Explorer Debug Panel</h3>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testListDatasets} disabled={loading} style={{
          background: '#007acc', color: 'white', padding: '10px 15px',
          border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer'
        }}>
          Test List Datasets
        </button>

        <button onClick={exploreStructure} disabled={loading} style={{
          background: '#28a745', color: 'white', padding: '10px 15px',
          border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer'
        }}>
          Explore S3 Structure
        </button>

        <button onClick={uploadSamples} disabled={loading} style={{
          background: '#ff6b35', color: 'white', padding: '10px 15px',
          border: 'none', borderRadius: '5px', cursor: 'pointer'
        }}>
          Upload Sample Datasets
        </button>
      </div>

      {loading && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>Loading...</p>
      )}

      {results && (
        <div style={{
          background: 'white', padding: '15px', borderRadius: '5px',
          border: '1px solid #ddd', maxHeight: '400px', overflow: 'auto'
        }}>
          <h4 style={{ color: '#333', marginTop: 0 }}>
            Results for: {results.type}
          </h4>
          {results.error ? (
            <div style={{ color: 'red', background: '#ffebee', padding: '10px', borderRadius: '3px' }}>
              <strong>Error:</strong> {results.error}
            </div>
          ) : (
            <pre style={{
              whiteSpace: 'pre-wrap', fontSize: '12px', background: '#f5f5f5',
              padding: '10px', borderRadius: '3px', overflow: 'auto'
            }}>
              {JSON.stringify(results.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', background: '#fff3cd', padding: '10px', borderRadius: '3px' }}>
        <strong>Troubleshooting Steps:</strong><br />
        1. <strong>Upload Sample Datasets</strong> - Creates test data in public/raw/Synthea/merged_csv/<br />
        2. <strong>Explore S3 Structure</strong> - Shows what's actually in your bucket<br />
        3. <strong>Test List Datasets</strong> - Tests the dataset listing function<br />
        <strong>Note:</strong> Check the browser console for detailed logs!
      </div>
    </div>
  );
};

export default DatasetDebugger;
