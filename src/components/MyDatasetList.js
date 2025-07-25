import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDatabase, FiFile, FiEye, FiExternalLink, FiCalendar, FiHardDrive } from 'react-icons/fi';
import { listUserDatasets, getDatasetContent } from '../utils/storageUtils';

export default function MyDatasetList() {
    const navigate = useNavigate();
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
            <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FiDatabase className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    No datasets yet
                </h3>
                <p className="text-textSecondary-light dark:text-textSecondary-dark mb-6 max-w-sm mx-auto">
                    Upload your first dataset to get started with data exploration and analysis.
                </p>
                <button
                    onClick={() => navigate('/upload')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <FiFile className="h-4 w-4" />
                    Upload Your First Dataset
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Dataset Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4 shadow-lg dark:shadow-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
                            <FiDatabase className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{datasets.length}</p>
                            <p className="text-sm text-blue-100 dark:text-blue-200">Datasets</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-lg p-4 shadow-lg dark:shadow-emerald-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
                            <FiFile className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {datasets.reduce((acc, d) => acc + d.fileCount, 0)}
                            </p>
                            <p className="text-sm text-emerald-100 dark:text-emerald-200">Files</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg p-4 shadow-lg dark:shadow-orange-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
                            <FiHardDrive className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {(datasets.reduce((acc, d) => acc + d.size, 0) / 1024 / 1024).toFixed(1)}
                            </p>
                            <p className="text-sm text-orange-100 dark:text-orange-200">MB Total</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dataset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datasets.slice(0, 4).map((dataset, index) => (
                    <div key={dataset.id} className="bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-700">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FiDatabase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-textPrimary-light dark:text-textPrimary-dark">{dataset.name}</h4>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-textSecondary-light dark:text-textSecondary-dark">
                                        <span className="flex items-center gap-1">
                                            <FiFile className="h-3 w-3" />
                                            {dataset.fileCount} file{dataset.fileCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiHardDrive className="h-3 w-3" />
                                            {(dataset.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-3 text-xs text-textSecondary-light dark:text-textSecondary-dark">
                            <FiCalendar className="h-3 w-3" />
                            <span>Uploaded {dataset.lastModified.toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                            {(() => {
                                const datasetSizeMB = dataset.size / 1024 / 1024;
                                const isLargeDataset = datasetSizeMB > 50; // Disable preview for datasets larger than 50MB
                                
                                return (
                                    <button
                                        onClick={isLargeDataset ? undefined : () => loadPreview(dataset)}
                                        disabled={isLargeDataset}
                                        className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                                            isLargeDataset 
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                        title={isLargeDataset ? `Preview disabled for large datasets (${datasetSizeMB.toFixed(1)}MB)` : 'Preview dataset'}
                                    >
                                        <FiEye className="h-3 w-3" />
                                        {isLargeDataset ? 'Too Large' : 'Preview'}
                                    </button>
                                );
                            })()}
                            <button
                                onClick={() => navigate(`/explore/${dataset.id}`)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <FiExternalLink className="h-3 w-3" />
                                Explore
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More Button if there are more than 4 datasets */}
            {datasets.length > 4 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/explore')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        View all {datasets.length} datasets
                        <FiExternalLink className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Preview Modal */}
            {selectedDataset && previewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FiEye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-textPrimary-light dark:text-textPrimary-dark">
                                        Dataset Preview
                                    </h3>
                                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                                        {selectedDataset.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedDataset(null);
                                    setPreviewData(null);
                                }}
                                className="p-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[60vh]">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            {previewData.headers.map((header, index) => (
                                                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-card-dark divide-y divide-border-light dark:divide-border-dark">
                                        {previewData.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                {previewData.headers.map((header, colIndex) => (
                                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary-light dark:text-textPrimary-dark">
                                                        {row[header]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                                    Showing first {previewData.rows.length} rows
                                </p>
                                <button
                                    onClick={() => navigate(`/explore/${selectedDataset.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FiExternalLink className="h-4 w-4" />
                                    Explore Full Dataset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
