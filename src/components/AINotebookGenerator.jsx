import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiSend,
  FiDownload,
  FiFileText,
  FiZap,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiDatabase,
  FiRefreshCw
} from 'react-icons/fi';
import NotebookGeneratorService from '../services/notebookGeneratorService';

const AINotebookGenerator = ({
  isOpen,
  onClose,
  projectId,
  availableFiles = [],
  onNotebookGenerated,
  refreshTrigger = null // Add refresh trigger prop
}) => {
  const [step, setStep] = useState('input'); // 'input', 'generating', 'complete', 'error'
  const [researchGoal, setResearchGoal] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generatedNotebook, setGeneratedNotebook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate');
  const [analysisDepth, setAnalysisDepth] = useState('standard');
  const [suggestionsKey, setSuggestionsKey] = useState(0); // Key to force re-generation

  // Initialize suggestions based on available files
  useEffect(() => {
    if (availableFiles.length > 0) {
      const formattedFiles = NotebookGeneratorService.formatFilesForAPI(availableFiles);
      setSelectedFiles(formattedFiles);

      const researchSuggestions = NotebookGeneratorService.getSuggestedResearchIdeas(formattedFiles);
      setSuggestions(researchSuggestions);
    }
  }, [availableFiles, suggestionsKey]); // Add suggestionsKey as dependency

  // Refresh suggestions when modal opens
  useEffect(() => {
    if (isOpen && availableFiles.length > 0) {
      // Force refresh of suggestions when modal opens
      setSuggestionsKey(prev => prev + 1);
    }
  }, [isOpen, availableFiles.length]);

  // Refresh suggestions when external refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && availableFiles.length > 0) {
      console.log('🔄 AI Notebook Generator: Refreshing suggestions due to project refresh');
      setSuggestionsKey(prev => prev + 1);
    }
  }, [refreshTrigger, availableFiles.length]);

  const handleSuggestionClick = (suggestion) => {
    setResearchGoal(suggestion.goal);
    setShowSuggestions(false);
  };

  const handleGenerateNotebook = async () => {
    // Validate input
    const validation = NotebookGeneratorService.validateResearchGoal(researchGoal);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setStep('generating');
      setError(null);

      const result = await NotebookGeneratorService.generateNotebook(
        projectId,
        researchGoal,
        selectedFiles,
        expertiseLevel,
        analysisDepth
      );

      setGeneratedNotebook(result);
      setStep('complete');
      if (onNotebookGenerated) {
        const notebookJson = result.notebook || result;
        onNotebookGenerated(notebookJson);
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    console.log('Download triggered. generatedNotebook:', generatedNotebook);
    // If the API response is { success: true, notebook: {...} }, extract notebook
    let notebookObj = generatedNotebook;
    if (generatedNotebook && generatedNotebook.notebook) {
      notebookObj = generatedNotebook.notebook;
    }
    // Validate notebook structure
    if (
      notebookObj &&
      typeof notebookObj === 'object' &&
      Array.isArray(notebookObj.cells) &&
      typeof notebookObj.nbformat === 'number'
    ) {
      const notebookJson = JSON.stringify(notebookObj, null, 2);
      const blob = new Blob([notebookJson], { type: 'application/x-ipynb+json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'notebook.ipynb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('Notebook is missing required fields or is not valid. Please try again.');
    }
  };

  const handleReset = () => {
    setStep('input');
    setResearchGoal('');
    setError(null);
    setGeneratedNotebook(null);
    setShowSuggestions(true);
  };

  const handleRefreshSuggestions = () => {
    setSuggestionsKey(Date.now());
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
          <FiZap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">
          AI Notebook Generator
        </h3>
        <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2">
          Generate a comprehensive Jupyter notebook for your research analysis
        </p>
      </div>

      {/* Available Datasets */}
      <div className="bg-gray-50 dark:bg-surface-dark rounded-lg p-4">
        <h4 className="font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3 flex items-center">
          <FiDatabase className="w-4 h-4 mr-2" />
          Available Dataset Folders ({selectedFiles.length})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {selectedFiles.map((dataset, index) => (
            <div key={index} className="flex items-center text-sm">
              <FiDatabase className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                {dataset.name}
              </span>
              <span className="text-textSecondary-light dark:text-textSecondary-dark ml-2">
                - {dataset.description}
              </span>
              {dataset.fileCount && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded ml-2">
                  {dataset.fileCount} files
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Research Goal Input */}
      <div>
        <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
          Research Goal or Question
        </label>
        <textarea
          value={researchGoal}
          onChange={(e) => setResearchGoal(e.target.value)}
          placeholder="Describe what you want to analyze or research with your data. Be specific about your objectives, methodology, and expected outcomes..."
          className="w-full h-32 p-3 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">
            {researchGoal.length}/2000 characters
          </span>
          {showSuggestions && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <FiStar className="w-3 h-3 mr-1" />
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          )}
        </div>
      </div>

      {/* Expertise Level Input */}
      <div>
        <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
          Audience Expertise Level
        </label>
        <select
          value={expertiseLevel}
          onChange={e => setExpertiseLevel(e.target.value)}
          className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark"
        >
          <option value="nontechnical">Nontechnical</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Analysis Depth Input */}
      <div>
        <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
          Analysis Depth
        </label>
        <select
          value={analysisDepth}
          onChange={e => setAnalysisDepth(e.target.value)}
          className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark"
        >
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="comprehensive">Comprehensive</option>
        </select>
      </div>

      {/* Research Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-textPrimary-light dark:text-textPrimary-dark flex items-center">
              <FiStar className="w-4 h-4 mr-2 text-blue-500" />
              Suggested Research Ideas
            </h4>
            <button
              onClick={handleRefreshSuggestions}
              className="p-1.5 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors rounded-lg hover:bg-white dark:hover:bg-card-dark"
              title="Refresh suggestions"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-3 bg-white dark:bg-card-dark rounded-lg hover:bg-gray-50 dark:hover:bg-card-hover-dark transition-colors border border-border-light dark:border-border-dark"
              >
                <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark text-sm">
                  {suggestion.title}
                </div>
                <div className="text-textSecondary-light dark:text-textSecondary-dark text-xs mt-1">
                  {suggestion.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerateNotebook}
          disabled={!researchGoal.trim() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <FiLoader className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FiSend className="w-4 h-4 mr-2" />
              Generate Notebook
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
        <FiLoader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
        Generating Your Notebook
      </h3>
      <p className="text-textSecondary-light dark:text-textSecondary-dark mb-4">
        Our AI is analyzing your research goal and creating a comprehensive notebook...
      </p>
      <div className="space-y-2 text-sm text-textSecondary-light dark:text-textSecondary-dark">
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Processing research objectives
        </div>
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Analyzing available datasets
        </div>
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Generating analysis code
        </div>
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Creating notebook structure
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full">
        <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
        Notebook Generated Successfully!
      </h3>
      <p className="text-textSecondary-light dark:text-textSecondary-dark mb-6">
        Your AI-generated Jupyter notebook is ready for download and analysis.
      </p>

      {generatedNotebook && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark space-y-1">
            <div>
              <strong>Notebook ID:</strong> {generatedNotebook.notebookKey?.split('/').pop()}
            </div>
            <div>
              <strong>Project:</strong> {projectId}
            </div>
            <div>
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
        >
          Generate Another
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <FiDownload className="w-4 h-4 mr-2" />
          Download Notebook
        </button>
        <button
          onClick={() => {
            if (generatedNotebook && (generatedNotebook.notebook || generatedNotebook)) {
              const notebookJson = generatedNotebook.notebook || generatedNotebook;
              if (onNotebookGenerated) onNotebookGenerated(notebookJson);
              window.location.href = `/projects/${projectId}/notebook-ide`;
              onClose();
            } else {
              alert('Notebook JSON not found. Please try again.');
            }
          }}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
        >
          <FiFileText className="w-4 h-4 mr-2" />
          Open in JupyterLite
        </button>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
        <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
        Generation Failed
      </h3>
      <p className="text-textSecondary-light dark:text-textSecondary-dark mb-4">
        We encountered an error while generating your notebook.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      <div className="flex justify-center space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
        >
          Close
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            AI Notebook Generator
          </h2>
          <button
            onClick={onClose}
            className="text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && renderInputStep()}
          {step === 'generating' && renderGeneratingStep()}
          {step === 'complete' && renderCompleteStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </div>
    </div>
  );
};

export default AINotebookGenerator;
