import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import FairScoreDisplay from './FairScoreDisplay';
import { listDatasets } from '../utils/storageUtils';

export default function MyDatasetList() {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadUserDatasets();
    }, []);

    const loadUserDatasets = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Starting to load user datasets...');
            const data = await listDatasets();

            if (!data || data.length === 0) {
                console.log('No datasets found');
                setDatasets([]);
                return;
            }

            console.log('Datasets loaded successfully:', data);
            console.log('Dataset IDs:', data.map(d => d.id));
            
            // Use datasets directly without transformation - just like explore page
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

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow animate-pulse border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">My Datasets</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4 h-20"></div>
                    ))}
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4 h-16"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">My Datasets</h3>
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Your Datasets</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>{error}</p>
                                <p className="mt-2 text-xs">Please check your network connection and try refreshing the page.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={loadUserDatasets}
                                    className="text-sm font-medium text-red-700 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 px-3 py-1 rounded"
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
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">My Datasets</h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">No datasets uploaded yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by uploading your first dataset.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => window.location.href = '/upload'}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            Upload Dataset
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">My Datasets</h3>
            
            {/* Dataset Cards */}
            <div className="space-y-4">
                {datasets.slice(0, 5).map((dataset, idx) => (
                    <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
                    >
                        <div className="flex-1">
                            <h3 className="text-gray-900 dark:text-white font-medium">{dataset.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {dataset.fileCount} file{dataset.fileCount > 1 ? "s" : ""} •{" "}
                                {(dataset.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 text-xs">
                                Uploaded {format(new Date(dataset.lastModified), "MM/dd/yyyy")}
                            </p>
                            {/* FAIR Score */}
                            <div className="mt-2">
                                <FairScoreDisplay datasetKey={dataset.key} compact={true} />
                            </div>
                        </div>
                        <div className="flex justify-end ml-4">
                            <button 
                                onClick={() => navigate(`/explore/${dataset.id}`)}
                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition font-medium"
                            >
                                Open
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All Link */}
            {datasets.length > 5 && (
                <div className="text-right mt-4">
                    <button 
                        onClick={() => window.location.href = '/explore'}
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                        View all {datasets.length} datasets →
                    </button>
                </div>
            )}
        </div>
    );
}
