import React, { useState } from 'react';
import { verifyUploadedFile, listAllUploads, debugS3Upload } from '../debug-s3';

const S3DebugPanel = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const runTest = async (testType) => {
        setLoading(true);
        try {
            let result;
            switch (testType) {
                case 'verify':
                    result = await verifyUploadedFile('test-1752512576057.json');
                    break;
                case 'listAll':
                    result = await listAllUploads();
                    break;
                case 'debug':
                    result = await debugS3Upload();
                    break;
            }
            setResults({ type: testType, data: result });
        } catch (error) {
            setResults({ type: testType, error: error.message });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
            <h3>S3 Debug Panel</h3>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => runTest('verify')} disabled={loading}>
                    Verify Recent Upload (test-1752512576057.json)
                </button>
                <button onClick={() => runTest('listAll')} disabled={loading} style={{ marginLeft: '10px' }}>
                    List All Uploads
                </button>
                <button onClick={() => runTest('debug')} disabled={loading} style={{ marginLeft: '10px' }}>
                    Full Debug Info
                </button>
            </div>

            {loading && <p>Running test...</p>}

            {results && (
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    <h4>Results for: {results.type}</h4>
                    {results.error ? (
                        <p style={{ color: 'red' }}>Error: {results.error}</p>
                    ) : (
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                            {JSON.stringify(results.data, null, 2)}
                        </pre>
                    )}
                </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <p><strong>Expected S3 Location:</strong></p>
                <p>s3://rwde-dev-datasets1d45f-dev/protected/[your-cognito-id]/user-uploads/</p>
                <p><strong>Recent Upload Key:</strong> user-uploads/test-1752512576057.json</p>
            </div>
        </div>
    );
};

export default S3DebugPanel;
