import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { HiOutlineSortAscending } from 'react-icons/hi';

import DatasetTable from './DatasetTable';
import ExploreSidebar from './ExploreSidebar';
import SingleDatasetOverview from './SingleDatasetOverview';
import { listDatasets } from '../../utils/storageUtils';
import '../../styles/tokens.css';

export default function DatasetExplorerPage() {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: 'lastUpdated',
    direction: 'desc'
  });

  // Real dataset state that loads from S3
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load datasets on component mount
  useEffect(() => {
    loadDatasets();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading datasets from S3...');

      const rawDatasets = await listDatasets();
      console.log('Loaded datasets:', rawDatasets);

      if (rawDatasets.length === 0) {
        console.warn('No dataset folders found in S3');
        setDatasets([]);
        return;
      }

      // Transform the data to match the expected format for the explore page
      const transformedDatasets = rawDatasets.map((dataset, index) => ({
        id: `dataset-${index + 1}`, // Start from 1 now that we removed the test dataset
        name: dataset.name,
        type: 'Healthcare Dataset',
        size: formatFileSize(dataset.size),
        records: `${dataset.fileCount} files`, // Show file count instead of record count
        lastUpdated: dataset.lastModified.toLocaleDateString(),
        description: `Healthcare dataset folder containing ${dataset.fileCount} files: ${dataset.name}`,
        tags: ['healthcare', 'folder', 'dataset'],
        geography: 'Healthcare Data',
        demographics: ['All Age Groups'],
        date: dataset.lastModified.toISOString().split('T')[0],
        key: dataset.key, // Store the S3 folder path for accessing the dataset
        accessLevel: dataset.accessLevel,
        fileCount: dataset.fileCount,
        files: dataset.files // Store the list of files in this dataset folder
      }));

      setDatasets(transformedDatasets);
      console.log('=== Final Datasets Array ===');
      console.log('Total datasets:', transformedDatasets.length);
      console.log('Dataset IDs:', transformedDatasets.map(d => d.id));
    } catch (err) {
      console.error('Failed to load datasets:', err);
      setError(err.message);

      // Set empty datasets on error instead of using mock data
      if (err.message.includes('not authorized')) {
        console.warn('S3 permissions issue - unable to load datasets');
      }
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for sorting datasets
  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filter and sort datasets
  const filteredAndSortedDatasets = useMemo(() => {
    let result = [...datasets];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      result = result.filter(dataset => {
        return Object.entries(filters).every(([category, selectedValues]) => {
          // If no values are selected for this category, don't filter
          if (!selectedValues || Object.keys(selectedValues).length === 0) return true;

          // Get the dataset value for this category
          const datasetValue = dataset[category];

          // Handle array values (like tags, demographics)
          if (Array.isArray(datasetValue)) {
            // Check if any of the dataset's values for this category are selected in the filters
            return datasetValue.some(value => selectedValues[value]);
          }

          // Handle single values (like type, geography)
          return selectedValues[datasetValue] === true;
        });
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(dataset =>
        dataset.name.toLowerCase().includes(query) ||
        dataset.description.toLowerCase().includes(query) ||
        dataset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sort
    if (sortConfig.field) {
      result.sort((a, b) => {
        // Special handling for lastUpdated field
        if (sortConfig.field === 'lastUpdated') {
          const getTimeValue = (str) => {
            const num = parseInt(str);
            if (str.includes('day')) return num * 24 * 60;
            if (str.includes('week')) return num * 7 * 24 * 60;
            return num;
          };
          const timeA = getTimeValue(a[sortConfig.field]);
          const timeB = getTimeValue(b[sortConfig.field]);
          return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
        // Special handling for size field
        else if (sortConfig.field === 'size') {
          const getSizeInMB = (str) => {
            const num = parseFloat(str);
            return str.includes('GB') ? num * 1024 : num;
          };
          const sizeA = getSizeInMB(a[sortConfig.field]);
          const sizeB = getSizeInMB(b[sortConfig.field]);
          return sortConfig.direction === 'asc' ? sizeA - sizeB : sizeB - sizeA;
        }
        // Special handling for records field
        else if (sortConfig.field === 'records') {
          const getRecordCount = (str) => parseInt(str.replace(/,/g, ''));
          const recordsA = getRecordCount(a[sortConfig.field]);
          const recordsB = getRecordCount(b[sortConfig.field]);
          return sortConfig.direction === 'asc' ? recordsA - recordsB : recordsB - recordsA;
        }
        // Default sorting for other fields
        else {
          if (a[sortConfig.field] < b[sortConfig.field]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[sortConfig.field] > b[sortConfig.field]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
      });
    }

    return result;
  }, [datasets, filters, searchQuery, sortConfig]);

  const MainExplorer = () => (
    <>

      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              Dataset Explorer
            </h1>
            <p className="text-textSecondary-light dark:text-textSecondary-dark text-sm sm:text-base">
              Browse and explore available datasets
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-full sm:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark text-sm sm:text-base"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary-light dark:text-textSecondary-dark" />
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark text-sm"
              >
                <FiFilter />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-accent-light dark:bg-accent-dark text-white rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
              <button
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark text-sm"
              >
                <HiOutlineSortAscending />
                Sort
              </button>
            </div>
          </div>

          {/* Dataset Table */}
          <div className="w-full overflow-x-auto">
            <DatasetTable
              datasets={filteredAndSortedDatasets}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      <ExploreSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        filters={filters}
        setFilters={setFilters}
        datasets={datasets}
      />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={<MainExplorer />} />
      <Route
        path=":datasetId"
        element={<SingleDatasetOverview datasets={datasets} loading={loading} />}
      />
    </Routes>
  );
}
