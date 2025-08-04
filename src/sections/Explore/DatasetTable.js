import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiExternalLink,
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

// Generate consistent color for a tag based on its text
const getTagColor = (tagText) => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    const char = tagText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Array of highly distinct colors with good contrast
  const colors = [
    // Vibrant and distinct colors
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
    
    // Deeper shades for more variety
    { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400' },
    { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400' },
    { bg: 'bg-violet-200', text: 'text-violet-900', border: 'border-violet-400' },
    { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-400' },
    { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-400' },
    { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-400' },
    { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-400' },
    { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-400' },
    { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', border: 'border-fuchsia-400' },
    { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-400' },
    
    // More vibrant alternatives
    { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' },
    { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
    { bg: 'bg-zinc-200', text: 'text-zinc-800', border: 'border-zinc-400' },
    { bg: 'bg-stone-200', text: 'text-stone-800', border: 'border-stone-400' },
    { bg: 'bg-neutral-200', text: 'text-neutral-800', border: 'border-neutral-400' },
    
    // Additional distinct colors
    { bg: 'bg-blue-300', text: 'text-blue-800', border: 'border-blue-500' },
    { bg: 'bg-green-300', text: 'text-green-800', border: 'border-green-500' },
    { bg: 'bg-purple-300', text: 'text-purple-800', border: 'border-purple-500' },
    { bg: 'bg-pink-300', text: 'text-pink-800', border: 'border-pink-500' },
    { bg: 'bg-yellow-300', text: 'text-yellow-800', border: 'border-yellow-500' },
    
    // Lighter pastels for variety
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    
    // Even more distinct options
    { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' },
    { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' },
    { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400' },
    { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'border-cyan-400' },
    
    // Final batch of distinct colors
    { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-400' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
    { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' }
  ];
  
  // Use absolute value of hash to get consistent positive index
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Dark mode variants for tags
const getTagColorDark = (tagText) => {
  // Same hash function
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    const char = tagText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Distinct dark mode colors with good contrast
  const darkColors = [
    { bg: 'dark:bg-blue-900', text: 'dark:text-blue-100', border: 'dark:border-blue-700' },
    { bg: 'dark:bg-emerald-900', text: 'dark:text-emerald-100', border: 'dark:border-emerald-700' },
    { bg: 'dark:bg-purple-900', text: 'dark:text-purple-100', border: 'dark:border-purple-700' },
    { bg: 'dark:bg-pink-900', text: 'dark:text-pink-100', border: 'dark:border-pink-700' },
    { bg: 'dark:bg-amber-900', text: 'dark:text-amber-100', border: 'dark:border-amber-700' },
    { bg: 'dark:bg-red-900', text: 'dark:text-red-100', border: 'dark:border-red-700' },
    { bg: 'dark:bg-indigo-900', text: 'dark:text-indigo-100', border: 'dark:border-indigo-700' },
    { bg: 'dark:bg-orange-900', text: 'dark:text-orange-100', border: 'dark:border-orange-700' },
    { bg: 'dark:bg-teal-900', text: 'dark:text-teal-100', border: 'dark:border-teal-700' },
    { bg: 'dark:bg-cyan-900', text: 'dark:text-cyan-100', border: 'dark:border-cyan-700' },
    
    { bg: 'dark:bg-blue-800', text: 'dark:text-blue-200', border: 'dark:border-blue-600' },
    { bg: 'dark:bg-green-800', text: 'dark:text-green-200', border: 'dark:border-green-600' },
    { bg: 'dark:bg-violet-800', text: 'dark:text-violet-200', border: 'dark:border-violet-600' },
    { bg: 'dark:bg-rose-800', text: 'dark:text-rose-200', border: 'dark:border-rose-600' },
    { bg: 'dark:bg-yellow-800', text: 'dark:text-yellow-200', border: 'dark:border-yellow-600' },
    { bg: 'dark:bg-sky-800', text: 'dark:text-sky-200', border: 'dark:border-sky-600' },
    { bg: 'dark:bg-lime-800', text: 'dark:text-lime-200', border: 'dark:border-lime-600' },
    { bg: 'dark:bg-fuchsia-800', text: 'dark:text-fuchsia-200', border: 'dark:border-fuchsia-600' },
    { bg: 'dark:bg-emerald-800', text: 'dark:text-emerald-200', border: 'dark:border-emerald-600' },
    { bg: 'dark:bg-orange-800', text: 'dark:text-orange-200', border: 'dark:border-orange-600' },
    
    { bg: 'dark:bg-slate-800', text: 'dark:text-slate-200', border: 'dark:border-slate-600' },
    { bg: 'dark:bg-gray-800', text: 'dark:text-gray-200', border: 'dark:border-gray-600' },
    { bg: 'dark:bg-zinc-800', text: 'dark:text-zinc-200', border: 'dark:border-zinc-600' },
    { bg: 'dark:bg-stone-800', text: 'dark:text-stone-200', border: 'dark:border-stone-600' },
    { bg: 'dark:bg-neutral-800', text: 'dark:text-neutral-200', border: 'dark:border-neutral-600' },
    
    { bg: 'dark:bg-blue-950', text: 'dark:text-blue-100', border: 'dark:border-blue-800' },
    { bg: 'dark:bg-green-950', text: 'dark:text-green-100', border: 'dark:border-green-800' },
    { bg: 'dark:bg-purple-950', text: 'dark:text-purple-100', border: 'dark:border-purple-800' },
    { bg: 'dark:bg-pink-950', text: 'dark:text-pink-100', border: 'dark:border-pink-800' },
    { bg: 'dark:bg-yellow-950', text: 'dark:text-yellow-100', border: 'dark:border-yellow-800' },
    
    { bg: 'dark:bg-sky-950', text: 'dark:text-sky-100', border: 'dark:border-sky-800' },
    { bg: 'dark:bg-lime-950', text: 'dark:text-lime-100', border: 'dark:border-lime-800' },
    { bg: 'dark:bg-violet-950', text: 'dark:text-violet-100', border: 'dark:border-violet-800' },
    { bg: 'dark:bg-fuchsia-950', text: 'dark:text-fuchsia-100', border: 'dark:border-fuchsia-800' },
    { bg: 'dark:bg-rose-950', text: 'dark:text-rose-100', border: 'dark:border-rose-800' },
    
    { bg: 'dark:bg-red-800', text: 'dark:text-red-200', border: 'dark:border-red-600' },
    { bg: 'dark:bg-teal-800', text: 'dark:text-teal-200', border: 'dark:border-teal-600' },
    { bg: 'dark:bg-cyan-800', text: 'dark:text-cyan-200', border: 'dark:border-cyan-600' },
    { bg: 'dark:bg-indigo-800', text: 'dark:text-indigo-200', border: 'dark:border-indigo-600' },
    { bg: 'dark:bg-amber-800', text: 'dark:text-amber-200', border: 'dark:border-amber-600' },
    
    { bg: 'dark:bg-blue-700', text: 'dark:text-blue-300', border: 'dark:border-blue-500' },
    { bg: 'dark:bg-green-700', text: 'dark:text-green-300', border: 'dark:border-green-500' },
    { bg: 'dark:bg-purple-700', text: 'dark:text-purple-300', border: 'dark:border-purple-500' },
    { bg: 'dark:bg-pink-700', text: 'dark:text-pink-300', border: 'dark:border-pink-500' },
    { bg: 'dark:bg-yellow-700', text: 'dark:text-yellow-300', border: 'dark:border-yellow-500' },
    
    { bg: 'dark:bg-slate-900', text: 'dark:text-slate-100', border: 'dark:border-slate-700' },
    { bg: 'dark:bg-gray-900', text: 'dark:text-gray-100', border: 'dark:border-gray-700' },
    { bg: 'dark:bg-zinc-900', text: 'dark:text-zinc-100', border: 'dark:border-zinc-700' },
    { bg: 'dark:bg-stone-900', text: 'dark:text-stone-100', border: 'dark:border-stone-700' },
    { bg: 'dark:bg-neutral-900', text: 'dark:text-neutral-100', border: 'dark:border-neutral-700' },
    
    { bg: 'dark:bg-red-950', text: 'dark:text-red-100', border: 'dark:border-red-800' },
    { bg: 'dark:bg-orange-950', text: 'dark:text-orange-100', border: 'dark:border-orange-800' },
    { bg: 'dark:bg-amber-950', text: 'dark:text-amber-100', border: 'dark:border-amber-800' },
    { bg: 'dark:bg-teal-950', text: 'dark:text-teal-100', border: 'dark:border-teal-800' },
    { bg: 'dark:bg-cyan-950', text: 'dark:text-cyan-100', border: 'dark:border-cyan-800' },
    
    { bg: 'dark:bg-emerald-950', text: 'dark:text-emerald-100', border: 'dark:border-emerald-800' },
    { bg: 'dark:bg-indigo-950', text: 'dark:text-indigo-100', border: 'dark:border-indigo-800' },
    { bg: 'dark:bg-sky-900', text: 'dark:text-sky-100', border: 'dark:border-sky-700' },
    { bg: 'dark:bg-lime-900', text: 'dark:text-lime-100', border: 'dark:border-lime-700' },
    { bg: 'dark:bg-violet-900', text: 'dark:text-violet-100', border: 'dark:border-violet-700' },
    
    { bg: 'dark:bg-fuchsia-900', text: 'dark:text-fuchsia-100', border: 'dark:border-fuchsia-700' },
    { bg: 'dark:bg-rose-900', text: 'dark:text-rose-100', border: 'dark:border-rose-700' },
    { bg: 'dark:bg-slate-700', text: 'dark:text-slate-200', border: 'dark:border-slate-500' },
    { bg: 'dark:bg-gray-700', text: 'dark:text-gray-200', border: 'dark:border-gray-500' },
    { bg: 'dark:bg-zinc-700', text: 'dark:text-zinc-200', border: 'dark:border-zinc-500' }
  ];
  
  const colorIndex = Math.abs(hash) % darkColors.length;
  return darkColors[colorIndex];
};

// Combined tag color classes
const getTagClasses = (tagText) => {
  const lightColors = getTagColor(tagText);
  const darkColors = getTagColorDark(tagText);
  
  return `${lightColors.bg} ${lightColors.text} ${lightColors.border} ${darkColors.bg} ${darkColors.text} ${darkColors.border}`;
};

export default function DatasetTable({ datasets, sortConfig, onSort }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(datasets.length / itemsPerPage);

  // Helper function to truncate description
  const truncateDescription = (description, maxLength = 120) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  // ✅ Reset to first page when dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [datasets.length]);

  // ✅ Ensure current page is valid when datasets shrink
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getCurrentPageData = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return datasets.slice(start, start + itemsPerPage);
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc'
      ? <FiChevronUp className="inline" />
      : <FiChevronDown className="inline" />;
  };

  const handleSort = (field) => {
    onSort(field);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
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
                  Files {getSortIcon('records')}
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
                        {dataset.source === 'Kaggle' && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-100">
                            Kaggle
                          </span>
                        )}
                      </Link>
                      <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">
                        {truncateDescription(dataset.description)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {dataset.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full border ${getTagClasses(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {/* Show a subtle indicator for datasets without tags */}
                        {(!dataset.tags || dataset.tags.length === 0) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 italic">
                            No tags
                          </span>
                        )}
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
                      {dataset.source === 'Kaggle' ? (
                        <button
                          onClick={() => window.open(dataset.kaggleUrl, '_blank')}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          <FiExternalLink />
                          View on Kaggle
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/explore/${dataset.id}`)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <FiExternalLink />
                          Open
                        </button>
                      )}
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
        <div className="flex gap-2">{renderPaginationButtons()}</div>
      </div>
    </div>
  );
}