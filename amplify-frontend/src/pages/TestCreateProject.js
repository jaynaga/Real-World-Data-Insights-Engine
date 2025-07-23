import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { createProject } from '../services/projectService';

export default function TestCreateProject() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('=== TEST PROJECT CREATION START ===');

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('1. Starting project creation...');

            const projectData = {
                title: formData.title,
                description: formData.description,
                category: 'test',
                priority: 'medium',
                selectedDatasets: [],
                researchGoals: '',
                expectedOutcomes: '',
                timeline: 'short-term',
                collaborators: '',
                createdAt: new Date().toISOString(),
                status: 'draft',
                id: `test_proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            console.log('2. Project data prepared:', projectData);

            console.log('3. Calling createProject service...');
            const result = await createProject(projectData);

            console.log('4. Project created successfully:', result);

            console.log('5. Navigating to projects page...');
            navigate('/projects', {
                state: {
                    message: `Test project "${projectData.title}" created successfully!`,
                    type: 'success',
                    projectId: result.id
                }
            });

            console.log('=== TEST PROJECT CREATION SUCCESS ===');

        } catch (error) {
            console.error('=== TEST PROJECT CREATION FAILED ===');
            console.error('Error details:', error);
            setError(`Failed to create project: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen page-bg text-textPrimary-light dark:text-textPrimary-dark">
            <div className="px-8 py-6">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-sm text-accent-light dark:text-accent-dark flex items-center gap-2 hover:underline"
                    >
                        <FaArrowLeft /> Back to Projects
                    </button>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Test Project Creation</h1>
                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                        Minimal test form to debug project creation
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Simple Form */}
                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white dark:bg-card-dark p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Basic Test Form</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Project Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter test project title..."
                                        className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter test description..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-default rounded-lg bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/projects')}
                                className="px-6 py-2 border border-default rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creating Test Project...
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        Create Test Project
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Debug Info */}
                <div className="mt-8 max-w-2xl">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-sm font-medium mb-2">Debug Instructions:</h3>
                        <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <li>1. Open browser developer tools (F12)</li>
                            <li>2. Go to Console tab</li>
                            <li>3. Fill in the title and click "Create Test Project"</li>
                            <li>4. Watch the console for detailed logging</li>
                            <li>5. Look for where the process stops or fails</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
