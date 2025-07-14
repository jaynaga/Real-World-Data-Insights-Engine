import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiEye, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function DatasetTable({ datasets, sortConfig, onSort }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(datasets.length / itemsPerPage);

  // Reset to first page when dataset changes (due to filtering or search)
  useEffect(() => {
    setCurrentPage(1);
  }, [datasets.length]);

  // If current page is greater than total pages, reset to last available page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getCurrentPageData = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return datasets.slice(start, end);
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="inline" /> : <FiChevronDown className="inline" />;
  };

  const handleSort = (field) => {
    onSort(field);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5; // Show max 5 page buttons at a time
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md text-textSecondary-light dark:text-textSecondary-dark disabled:opacity-50"
      >
        <FiChevronLeft />
      </button>
    );

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded-md text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-100 dark:hover:bg-surface-dark"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? 'bg-accent-light dark:bg-accent-dark text-white'
              : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-100 dark:hover:bg-surface-dark'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded-md text-textSecondary-light dark:text-textSecondary-dark hover:bg-gray-100 dark:hover:bg-surface-dark"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md text-textSecondary-light dark:text-textSecondary-dark disabled:opacity-50"
      >
        <FiChevronRight />
      </button>
    );

    return buttons;
  };

  if (!datasets.length) {
    return (
      <div className="text-center py-12 bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
        <p className="text-textSecondary-light dark:text-textSecondary-dark">
          No datasets found matching your search criteria
        </p>
      </div>
    );
  }

  const currentData = getCurrentPageData();

  return (
    <div className="flex flex-col">
      <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-surface-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider sticky top-0 bg-gray-50 dark:bg-surface-dark z-10">
                  Dataset
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider cursor-pointer hover:text-accent-light dark:hover:text-accent-dark sticky top-0 bg-gray-50 dark:bg-surface-dark z-10"
                  onClick={() => handleSort('type')}
                >
                  Type {getSortIcon('type')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider cursor-pointer hover:text-accent-light dark:hover:text-accent-dark sticky top-0 bg-gray-50 dark:bg-surface-dark z-10"
                  onClick={() => handleSort('size')}
                >
                  Size {getSortIcon('size')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider cursor-pointer hover:text-accent-light dark:hover:text-accent-dark sticky top-0 bg-gray-50 dark:bg-surface-dark z-10"
                  onClick={() => handleSort('records')}
                >
                  Records {getSortIcon('records')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider cursor-pointer hover:text-accent-light dark:hover:text-accent-dark sticky top-0 bg-gray-50 dark:bg-surface-dark z-10"
                  onClick={() => handleSort('lastUpdated')}
                >
                  Last Updated {getSortIcon('lastUpdated')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider sticky top-0 bg-gray-50 dark:bg-surface-dark z-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {currentData.map((dataset) => (
                <tr
                  key={dataset.id}
                  className="hover:bg-gray-50 dark:hover:bg-card-hover-dark transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        to={`${dataset.id}`}
                        className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark hover:text-accent-light dark:hover:text-accent-dark"
                      >
                        {dataset.name}
                      </Link>
                      <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">
                        {dataset.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {dataset.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                    {dataset.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                    {dataset.size}
                  </td>
                  <td className="px-6 py-4 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                    {dataset.records}
                  </td>
                  <td className="px-6 py-4 text-sm text-textPrimary-light dark:text-textPrimary-dark">
                    {dataset.lastUpdated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-accent-light dark:hover:text-accent-dark rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark"
                        title="Preview Dataset"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="p-2 text-textSecondary-light dark:text-textSecondary-dark hover:text-accent-light dark:hover:text-accent-dark rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark"
                        title="Download Dataset"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark p-4">
        <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, datasets.length)} to {Math.min(currentPage * itemsPerPage, datasets.length)} of {datasets.length} entries
        </div>
        <div className="flex gap-2">
          {renderPaginationButtons()}
        </div>
      </div>
    </div>
  );
}