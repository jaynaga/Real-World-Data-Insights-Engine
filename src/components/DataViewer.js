import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiMaximize2,
  FiMinimize2,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiBarChart
} from 'react-icons/fi';

const DataViewer = ({ csvData, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'json', 'stats'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Initialize selected columns when data loads
  React.useEffect(() => {
    if (csvData?.columns && selectedColumns.size === 0) {
      setSelectedColumns(new Set(csvData.columns.slice(0, 6))); // Show first 6 columns by default
    }
  }, [csvData?.columns, selectedColumns.size]);

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!csvData?.data) return [];

    let filtered = csvData.data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [csvData?.data, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // Column statistics
  const columnStats = useMemo(() => {
    if (!csvData?.data || !csvData?.columns) return {};

    const stats = {};
    csvData.columns.forEach(col => {
      const values = csvData.data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
      const uniqueValues = new Set(values);

      stats[col] = {
        total: csvData.data.length,
        filled: values.length,
        unique: uniqueValues.size,
        fillRate: ((values.length / csvData.data.length) * 100).toFixed(1),
        sampleValues: Array.from(uniqueValues).slice(0, 3)
      };
    });

    return stats;
  }, [csvData]);

  const handleSort = (columnKey) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumnSelection = (column) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setSelectedColumns(newSelected);
  };

  const visibleColumns = csvData?.columns?.filter(col => selectedColumns.has(col)) || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-light dark:border-accent-dark"></div>
            <span className="text-textSecondary-light dark:text-textSecondary-dark">Loading data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️ Error Loading Data</div>
            <p className="text-textSecondary-light dark:text-textSecondary-dark text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!csvData?.data?.length) {
    return (
      <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-6">
        <div className="flex items-center justify-center h-64">
          <span className="text-textSecondary-light dark:text-textSecondary-dark">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark ${isExpanded ? 'fixed inset-2 z-50 w-auto' : 'w-full'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-border-light dark:border-border-dark gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h3 className="text-base sm:text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            Data Viewer
          </h3>
          <span className="text-xs sm:text-sm text-textSecondary-light dark:text-textSecondary-dark">
            {filteredData.length} rows × {csvData.columns.length} columns
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border-light dark:border-border-dark">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 sm:px-3 py-1 text-sm rounded-l-lg ${viewMode === 'table' ? 'bg-accent-light dark:bg-accent-dark text-white' : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark'}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-2 sm:px-3 py-1 text-sm rounded-r-lg ${viewMode === 'stats' ? 'bg-accent-light dark:bg-accent-dark text-white' : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark'}`}
            >
              <FiBarChart className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark rounded"
          >
            {isExpanded ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-4 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-surface-dark gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary-light dark:text-textSecondary-dark w-4 h-4" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
            />
          </div>

          {/* Column Filter */}
          <div className="relative group">
            <button className="flex items-center justify-center sm:justify-start space-x-2 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark w-full sm:w-auto">
              <FiFilter className="w-4 h-4" />
              <span>Columns ({selectedColumns.size})</span>
            </button>

            {/* Column Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-2 max-h-64 overflow-y-auto">
                {csvData.columns.map(column => (
                  <label key={column} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-card-hover-dark rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(column)}
                      onChange={() => toggleColumnSelection(column)}
                      className="rounded"
                    />
                    <span className="text-sm text-textPrimary-light dark:text-textPrimary-dark truncate">{column}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rows per page */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="text-sm border border-border-light dark:border-border-dark rounded bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-auto ${isExpanded ? 'max-h-[calc(100vh-200px)]' : 'max-h-[50vh] min-h-[300px]'}`}>
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="sticky top-0 bg-gray-50 dark:bg-surface-dark">
                <tr>
                  {visibleColumns.map(column => (
                    <th
                      key={column}
                      onClick={() => handleSort(column)}
                      className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-card-hover-dark"
                    >
                      <div className="flex items-center space-x-1">
                        <span className="truncate max-w-32 sm:max-w-40">{column}</span>
                        {sortConfig.key === column && (
                          <span className="text-accent-light dark:text-accent-dark">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark bg-white dark:bg-card-dark">
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-card-hover-dark">
                    {visibleColumns.map(column => (
                      <td key={column} className="px-3 sm:px-4 py-3 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                        <div className="max-w-32 sm:max-w-48 truncate" title={row[column]}>
                          {row[column] || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Statistics View */
          <div className="p-4 space-y-4">
            {csvData.columns.map(column => (
              <div key={column} className="bg-gray-50 dark:bg-surface-dark rounded-lg p-4">
                <h4 className="font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">{column}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-textSecondary-light dark:text-textSecondary-dark">Total:</span>
                    <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark">{columnStats[column]?.total}</div>
                  </div>
                  <div>
                    <span className="text-textSecondary-light dark:text-textSecondary-dark">Filled:</span>
                    <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark">{columnStats[column]?.filled}</div>
                  </div>
                  <div>
                    <span className="text-textSecondary-light dark:text-textSecondary-dark">Unique:</span>
                    <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark">{columnStats[column]?.unique}</div>
                  </div>
                  <div>
                    <span className="text-textSecondary-light dark:text-textSecondary-dark">Fill Rate:</span>
                    <div className="font-medium text-textPrimary-light dark:text-textPrimary-dark">{columnStats[column]?.fillRate}%</div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-textSecondary-light dark:text-textSecondary-dark text-xs">Sample values:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {columnStats[column]?.sampleValues.map((value, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white dark:bg-card-dark rounded text-xs text-textPrimary-light dark:text-textPrimary-dark">
                        {String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {viewMode === 'table' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-t border-border-light dark:border-border-dark gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-textSecondary-light dark:text-textSecondary-dark">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 sm:p-2 rounded border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-card-hover-dark"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm text-textPrimary-light dark:text-textPrimary-dark px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 sm:p-2 rounded border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-card-hover-dark"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataViewer;
