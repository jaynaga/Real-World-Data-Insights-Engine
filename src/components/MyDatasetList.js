import React, { useState, useEffect } from 'react';
import { listUserDatasets, getDatasetContent } from '../utils/storageUtils';

export default function MyDatasetList() {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        loadUserDatasets();
    }, []);

    const loadUserDatasets = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Starting to load user datasets...');
            const data = await listUserDatasets();

            if (!data || data.length === 0) {
                console.log('No user datasets found');
                setDatasets([]);
                return;
            }

            console.log('User datasets loaded successfully:', data);
            setDatasets(data);
        } catch (err) {
            console.error('Detailed error loading user datasets:', {
                message: err.message,
                name: err.name,
                stack: err.stack
            });
            setError(`Failed to load your datasets: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async (dataset) => {
        try {
            setSelectedDataset(dataset);

            // For multi-file datasets, try to preview the first CSV file
            let fileToPreview = dataset.key;
            if (dataset.files && dataset.files.length > 0) {
                const csvFile = dataset.files.find(f => f.name.toLowerCase().endsWith('.csv'));
                fileToPreview = csvFile ? csvFile.key : dataset.files[0].key;
            }

            const content = await getDatasetContent(fileToPreview);

            // Parse CSV and get first few rows
            const rows = content.split('\\n');
            const headers = rows[0].split(',');
            const previewRows = rows.slice(1, 6).map(row => {
                const values = row.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            });

            setPreviewData({
                headers,
                rows: previewRows
            });
        } catch (err) {
            console.error('Error loading preview:', err);
            setError('Failed to load dataset preview');
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error Loading Your Datasets</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                                <p className="mt-2 text-xs">Please check your network connection and try refreshing the page.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={loadUserDatasets}
                                    className="text-sm font-medium text-red-800 hover:text-red-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (datasets.length === 0) {
        return (
            <div className="p-6">
                <h3 className="section-heading mb-4">My Datasets</h3>
                <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No datasets uploaded yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by uploading your first dataset.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => window.location.href = '/upload'}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Upload Dataset
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="section-heading">My Datasets ({datasets.length})</h3>
                <button
                    onClick={() => window.location.href = '/upload'}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                    Upload New
                </button>
            </div>

            <div className="space-y-3">
                {datasets.map((dataset, index) => (
                    <div key={dataset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        Your Dataset
                                    </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-500">
                                    {dataset.fileCount} file{dataset.fileCount !== 1 ? 's' : ''} • {(dataset.size / 1024 / 1024).toFixed(1)} MB
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Uploaded {dataset.lastModified.toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadPreview(dataset)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Preview
                                </button>
                                <button
                                    onClick={() => window.location.href = `/explore/${dataset.id}`}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Explore
                                </button>
                            </div>
                        </div>

                        {/* Show file list for multi-file datasets */}
                        {dataset.fileCount > 1 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Files in this dataset:</p>
                                <div className="flex flex-wrap gap-1">
                                    {dataset.files.slice(0, 5).map((file, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {file.name}
                                        </span>
                                    ))}
                                    {dataset.files.length > 5 && (
                                        <span className="text-xs text-gray-400">
                                            +{dataset.files.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {selectedDataset && previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-96 overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Preview: {selectedDataset.name}</h3>
                            <button
                                onClick={() => {
                                    setSelectedDataset(null);
                                    setPreviewData(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {previewData.headers.map((header, index) => (
                                            <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.rows.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {previewData.headers.map((header, colIndex) => (
                                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {row[header]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
