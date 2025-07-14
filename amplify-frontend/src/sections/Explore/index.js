import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { HiOutlineSortAscending } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import DatasetTable from './DatasetTable';
import ExploreSidebar from './ExploreSidebar';
import SingleDatasetOverview from './SingleDatasetOverview';
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

  const [datasets, setDatasets] = useState([
    {
      id: 1,
      name: 'Mental Health Survey 2023',
      type: 'Survey Data',
      size: '1.2GB',
      records: '15,847',
      lastUpdated: '2 days ago',
      description: 'Comprehensive mental health survey data from 2023',
      tags: ['mental health', 'survey', '2023'],
      geography: 'North America',
      demographics: ['Adults (26-64)', 'Young Adults (18-25)'],
      date: '2023-06-15'
    },
    {
      id: 2,
      name: 'Treatment Centers Analysis',
      type: 'Clinical Trials',
      size: '850MB',
      records: '8,234',
      lastUpdated: '1 week ago',
      description: 'Analysis of treatment center effectiveness and patient outcomes',
      tags: ['treatment', 'analytics', 'healthcare'],
      geography: 'Europe',
      demographics: ['Adults (26-64)', 'Seniors (65+)'],
      date: '2023-05-20'
    },
    {
      id: 3,
      name: 'Demographics Study',
      type: 'Longitudinal Studies',
      size: '2.1GB',
      records: '25,691',
      lastUpdated: '3 days ago',
      description: 'Demographic correlations with mental health outcomes',
      tags: ['demographics', 'research', 'correlation'],
      geography: 'Asia',
      demographics: ['Children (0-12)', 'Adolescents (13-17)'],
      date: '2023-07-01'
    },
    {
      id: 4,
      name: 'Hospital Admissions 2023',
      type: 'Administrative Data',
      size: '1.5GB',
      records: '12,456',
      lastUpdated: '5 days ago',
      description: 'Hospital admission records and patient data',
      tags: ['hospital', 'admissions', 'medical'],
      geography: 'North America',
      demographics: ['Adults (26-64)'],
      date: '2023-06-30'
    },
    {
      id: 5,
      name: 'Youth Mental Health Initiative',
      type: 'Survey Data',
      size: '750MB',
      records: '9,876',
      lastUpdated: '1 day ago',
      description: 'Comprehensive study of youth mental health trends',
      tags: ['youth', 'mental health', 'prevention'],
      geography: 'Europe',
      demographics: ['Adolescents (13-17)', 'Young Adults (18-25)'],
      date: '2023-07-12'
    },
    {
      id: 6,
      name: 'Elderly Care Patterns',
      type: 'Longitudinal Studies',
      size: '3.2GB',
      records: '31,254',
      lastUpdated: '4 days ago',
      description: 'Long-term study of elderly care and mental health',
      tags: ['elderly', 'care', 'longitudinal'],
      geography: 'Asia',
      demographics: ['Seniors (65+)'],
      date: '2023-07-09'
    },
    {
      id: 7,
      name: 'Global Depression Index',
      type: 'Census Data',
      size: '4.5GB',
      records: '45,123',
      lastUpdated: '6 hours ago',
      description: 'Worldwide depression statistics and correlations',
      tags: ['global', 'depression', 'statistics'],
      geography: 'Australia/Oceania',
      demographics: ['Adults (26-64)', 'Seniors (65+)', 'Young Adults (18-25)'],
      date: '2023-07-13'
    },
    {
      id: 8,
      name: 'Pediatric Mental Health Records',
      type: 'Clinical Trials',
      size: '950MB',
      records: '7,845',
      lastUpdated: '2 weeks ago',
      description: 'Clinical trials data for pediatric mental health treatments',
      tags: ['pediatric', 'clinical', 'treatment'],
      geography: 'South America',
      demographics: ['Children (0-12)'],
      date: '2023-06-28'
    },
    {
      id: 9,
      name: 'School Mental Health Programs',
      type: 'Administrative Data',
      size: '1.8GB',
      records: '18,567',
      lastUpdated: '3 weeks ago',
      description: 'Analysis of school-based mental health intervention programs',
      tags: ['education', 'intervention', 'youth'],
      geography: 'Africa',
      demographics: ['Children (0-12)', 'Adolescents (13-17)'],
      date: '2023-06-21'
    },
    {
      id: 10,
      name: 'Remote Therapy Effectiveness',
      type: 'Survey Data',
      size: '675MB',
      records: '5,934',
      lastUpdated: '12 hours ago',
      description: 'Study on the effectiveness of remote therapy sessions',
      tags: ['remote', 'therapy', 'effectiveness'],
      geography: 'Europe',
      demographics: ['Young Adults (18-25)', 'Adults (26-64)'],
      date: '2023-07-12'
    },
    {
      id: 11,
      name: 'Workplace Mental Health',
      type: 'Census Data',
      size: '2.4GB',
      records: '28,965',
      lastUpdated: '8 days ago',
      description: 'Corporate mental health programs and their impact',
      tags: ['workplace', 'corporate', 'wellness'],
      geography: 'North America',
      demographics: ['Adults (26-64)'],
      date: '2023-07-05'
    },
    {
      id: 12,
      name: 'Student Stress Patterns',
      type: 'Longitudinal Studies',
      size: '1.1GB',
      records: '11,234',
      lastUpdated: '4 days ago',
      description: 'Long-term study of stress patterns in students',
      tags: ['students', 'stress', 'academic'],
      geography: 'Asia',
      demographics: ['Adolescents (13-17)', 'Young Adults (18-25)'],
      date: '2023-07-09'
    },
    {
      id: 13,
      name: 'Community Support Impact',
      type: 'Administrative Data',
      size: '925MB',
      records: '9,123',
      lastUpdated: '6 days ago',
      description: 'Impact analysis of community mental health support systems',
      tags: ['community', 'support', 'impact'],
      geography: 'Africa',
      demographics: ['Adults (26-64)', 'Seniors (65+)'],
      date: '2023-07-07'
    },
    {
      id: 14,
      name: 'Medication Efficacy Study',
      type: 'Clinical Trials',
      size: '3.8GB',
      records: '42,567',
      lastUpdated: '1 month ago',
      description: 'Clinical trials data for new mental health medications',
      tags: ['medication', 'trials', 'treatment'],
      geography: 'South America',
      demographics: ['Adults (26-64)', 'Seniors (65+)'],
      date: '2023-06-13'
    },
    {
      id: 15,
      name: 'Rural Mental Health Access',
      type: 'Census Data',
      size: '1.6GB',
      records: '16,789',
      lastUpdated: '5 days ago',
      description: 'Study of mental health care access in rural areas',
      tags: ['rural', 'access', 'healthcare'],
      geography: 'Australia/Oceania',
      demographics: ['Adults (26-64)', 'Seniors (65+)'],
      date: '2023-07-08'
    }
  ]);

  const sortOptions = [
    { field: 'type', label: 'Type' },
    { field: 'size', label: 'Size' },
    { field: 'records', label: 'Records' },
    { field: 'lastUpdated', label: 'Last Updated' }
  ];

  const handleSort = (field) => {
    setSortConfig((prevSort) => ({
      field,
      direction:
        prevSort.field === field && prevSort.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const applyFilters = (data) => {
    return data.filter(dataset => {
      // Check if any filters are actually selected
      const hasGeographyFilters = filters.geography && Object.values(filters.geography).some(value => value);
      const hasDataTypeFilters = filters.dataType && Object.values(filters.dataType).some(value => value);
      const hasDemographicFilters = filters.demographics && Object.values(filters.demographics).some(value => value);
      const hasDateFilters = filters.dateRange && (filters.dateRange.from || filters.dateRange.to);

      // If no filters are selected in a category, skip that filter check
      // Check geography filter
      if (hasGeographyFilters) {
        if (!filters.geography[dataset.geography]) {
          return false;
        }
      }

      // Check data type filter
      if (hasDataTypeFilters) {
        if (!filters.dataType[dataset.type]) {
          return false;
        }
      }

      // Check demographics filter
      if (hasDemographicFilters) {
        const hasMatchingDemographic = dataset.demographics.some(
          demo => filters.demographics[demo]
        );
        if (!hasMatchingDemographic) {
          return false;
        }
      }

      // Check date range filter
      if (hasDateFilters) {
        const datasetDate = new Date(dataset.date);
        if (filters.dateRange.from && new Date(filters.dateRange.from) > datasetDate) {
          return false;
        }
        if (filters.dateRange.to && new Date(filters.dateRange.to) < datasetDate) {
          return false;
        }
      }

      return true;
    });
  };

  const sortDatasets = (dataToSort) => {
    return [...dataToSort].sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      // Handle special cases for size and records
      if (sortConfig.field === 'size') {
        aValue = parseFloat(aValue.replace('GB', '').replace('MB', '')) * (aValue.includes('GB') ? 1000 : 1);
        bValue = parseFloat(bValue.replace('GB', '').replace('MB', '')) * (bValue.includes('GB') ? 1000 : 1);
      } else if (sortConfig.field === 'records') {
        aValue = parseInt(aValue.replace(',', ''));
        bValue = parseInt(bValue.replace(',', ''));
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Memoized search, filter, and sort function
  const filteredAndSortedDatasets = useCallback(() => {
    let filtered = datasets;

    // Apply search
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(dataset => 
        dataset.name?.toLowerCase().includes(searchTerm) ||
        dataset.description?.toLowerCase().includes(searchTerm) ||
        dataset.type?.toLowerCase().includes(searchTerm) ||
        dataset.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    filtered = applyFilters(filtered);

    // Apply sort
    return sortDatasets(filtered);
  }, [datasets, searchQuery, filters, sortConfig]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Count geography filters
    if (filters.geography) {
      count += Object.values(filters.geography).filter(Boolean).length;
    }
    
    // Count data type filters
    if (filters.dataType) {
      count += Object.values(filters.dataType).filter(Boolean).length;
    }
    
    // Count demographics filters
    if (filters.demographics) {
      count += Object.values(filters.demographics).filter(Boolean).length;
    }
    
    // Count date range as one if either from or to is set
    if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
      count += 1;
    }
    
    return count;
  }, [filters]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
              <div className={`flex-1 p-6 ${isSidebarOpen ? 'mr-64' : ''} transition-all duration-300`}>
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    Explore Datasets
                  </h1>
                  <p className="text-textSecondary-light dark:text-textSecondary-dark">
                    Browse and analyze available datasets
                  </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary-light dark:text-textSecondary-dark" />
                    <input
                      type="text"
                      placeholder="Search datasets..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                    />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
                        isSidebarOpen 
                          ? 'bg-accent-light dark:bg-accent-dark text-white' 
                          : 'bg-white dark:bg-card-dark border border-border-light dark:border-border-dark text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark'
                      }`}
                    >
                      <FiFilter /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                    {activeFilterCount > 0 && !isSidebarOpen && (
                      <span className="absolute -top-2 -right-2 bg-accent-light dark:bg-accent-dark text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setSortMenuAnchor(!sortMenuAnchor)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark"
                    >
                      <HiOutlineSortAscending /> Sort
                    </button>
                    {sortMenuAnchor && (
                      <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark z-50">
                        {sortOptions.map(option => (
                          <button
                            key={option.field}
                            onClick={() => {
                              handleSort(option.field);
                              setSortMenuAnchor(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-card-hover-dark ${
                              sortConfig.field === option.field 
                                ? 'text-accent-light dark:text-accent-dark font-medium'
                                : 'text-textPrimary-light dark:text-textPrimary-dark'
                            }`}
                          >
                            {option.label}
                            {sortConfig.field === option.field && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dataset Table */}
                <DatasetTable 
                  datasets={filteredAndSortedDatasets()} 
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </div>
              <ExploreSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                filters={filters} 
                setFilters={setFilters}
                datasets={datasets}
              />
            </div>
          }
        />
        <Route path=":datasetId" element={<SingleDatasetOverview />} />
      </Routes>
    </>
  );
}
