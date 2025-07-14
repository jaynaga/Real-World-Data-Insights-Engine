import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { HiOutlineSortAscending } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import DatasetTable from './DatasetTable';
import ExploreSidebar from './ExploreSidebar';
import SingleDatasetOverview from './SingleDatasetOverview';
import '../../styles/tokens.css';

const mockDatasets = [
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
    name: 'Pediatric Health Records 2024',
    type: 'Clinical Trials',
    size: '2.1GB',
    records: '28,932',
    lastUpdated: '1 day ago',
    description: 'Clinical trials data focusing on pediatric healthcare innovations',
    tags: ['pediatric', 'clinical', 'healthcare'],
    geography: 'Europe',
    demographics: ['Children (0-12)'],
    date: '2024-01-05'
  },
  {
    id: 3,
    name: 'Education Achievement Study',
    type: 'Longitudinal Studies',
    size: '950MB',
    records: '12,450',
    lastUpdated: '5 days ago',
    description: '10-year study tracking educational outcomes across different demographics',
    tags: ['education', 'longitudinal', 'achievement'],
    geography: 'North America',
    demographics: ['Children (0-12)', 'Adolescents (13-17)'],
    date: '2023-12-20'
  },
  {
    id: 4,
    name: 'Global Demographics 2024',
    type: 'Census Data',
    size: '5.1GB',
    records: '150,000',
    lastUpdated: '3 days ago',
    description: 'Worldwide population statistics and demographic trends',
    tags: ['census', 'global', 'demographics'],
    geography: 'Asia',
    demographics: ['All Age Groups'],
    date: '2024-02-01'
  },
  {
    id: 5,
    name: 'Healthcare Systems Analysis',
    type: 'Administrative Data',
    size: '3.8GB',
    records: '45,890',
    lastUpdated: '1 week ago',
    description: 'Comprehensive analysis of healthcare systems and patient care metrics',
    tags: ['healthcare', 'administrative', 'analysis'],
    geography: 'Europe',
    demographics: ['All Age Groups'],
    date: '2023-11-30'
  },
  {
    id: 6,
    name: 'Early Childhood Development',
    type: 'Survey Data',
    size: '950MB',
    records: '8,750',
    lastUpdated: '4 days ago',
    description: 'Research on developmental patterns in early childhood',
    tags: ['children', 'development', 'psychology'],
    geography: 'South America',
    demographics: ['Children (0-12)'],
    date: '2023-09-15'
  },
  {
    id: 7,
    name: 'Urban Mobility Patterns',
    type: 'Survey Data',
    size: '1.5GB',
    records: '22,150',
    lastUpdated: '6 days ago',
    description: 'Analysis of urban transportation and commuting patterns',
    tags: ['urban', 'transportation', 'mobility'],
    geography: 'Europe',
    demographics: ['Adults (26-64)'],
    date: '2024-01-10'
  },
  {
    id: 8,
    name: 'Senior Healthcare Study',
    type: 'Clinical Trials',
    size: '2.8GB',
    records: '35,000',
    lastUpdated: '8 days ago',
    description: 'Healthcare research focusing on elderly population',
    tags: ['elderly', 'healthcare', 'clinical'],
    geography: 'North America',
    demographics: ['Seniors (65+)'],
    date: '2023-12-05'
  },
  {
    id: 9,
    name: 'Youth Sports Participation',
    type: 'Longitudinal Studies',
    size: '750MB',
    records: '18,500',
    lastUpdated: '10 days ago',
    description: 'Long-term study on youth sports engagement and health outcomes',
    tags: ['sports', 'youth', 'health'],
    geography: 'Australia/Oceania',
    demographics: ['Children (0-12)', 'Adolescents (13-17)'],
    date: '2023-11-15'
  },
  {
    id: 10,
    name: 'Rural Healthcare Access',
    type: 'Administrative Data',
    size: '1.7GB',
    records: '28,900',
    lastUpdated: '2 weeks ago',
    description: 'Analysis of healthcare accessibility in rural areas',
    tags: ['rural', 'healthcare', 'access'],
    geography: 'Africa',
    demographics: ['All Age Groups'],
    date: '2023-10-20'
  },
  {
    id: 11,
    name: 'Digital Literacy Survey',
    type: 'Survey Data',
    size: '890MB',
    records: '42,000',
    lastUpdated: '12 days ago',
    description: 'Assessment of digital literacy across different age groups',
    tags: ['digital', 'education', 'literacy'],
    geography: 'Asia',
    demographics: ['All Age Groups'],
    date: '2024-01-15'
  },
  {
    id: 12,
    name: 'Mental Health in Adolescents',
    type: 'Clinical Trials',
    size: '1.9GB',
    records: '15,750',
    lastUpdated: '9 days ago',
    description: 'Study on mental health interventions for teenagers',
    tags: ['mental health', 'adolescents', 'clinical'],
    geography: 'Europe',
    demographics: ['Adolescents (13-17)'],
    date: '2023-12-28'
  },
  {
    id: 13,
    name: 'Remote Work Patterns 2023',
    type: 'Survey Data',
    size: '1.1GB',
    records: '31,200',
    lastUpdated: '15 days ago',
    description: 'Analysis of remote work trends and productivity',
    tags: ['work', 'remote', 'productivity'],
    geography: 'North America',
    demographics: ['Adults (26-64)'],
    date: '2023-11-01'
  },
  {
    id: 14,
    name: 'Public Health Initiatives',
    type: 'Administrative Data',
    size: '2.3GB',
    records: '52,800',
    lastUpdated: '11 days ago',
    description: 'Evaluation of public health programs and outcomes',
    tags: ['public health', 'initiatives', 'programs'],
    geography: 'South America',
    demographics: ['All Age Groups'],
    date: '2024-01-08'
  },
  {
    id: 15,
    name: 'Student Performance Metrics',
    type: 'Longitudinal Studies',
    size: '1.4GB',
    records: '25,600',
    lastUpdated: '7 days ago',
    description: 'Long-term tracking of student academic performance',
    tags: ['education', 'performance', 'academic'],
    geography: 'Asia',
    demographics: ['Children (0-12)', 'Adolescents (13-17)'],
    date: '2023-12-15'
  },
  {
    id: 16,
    name: 'Vaccination Coverage 2024',
    type: 'Census Data',
    size: '4.2GB',
    records: '128,000',
    lastUpdated: '4 days ago',
    description: 'National vaccination rates and coverage statistics',
    tags: ['healthcare', 'vaccination', 'public health'],
    geography: 'Europe',
    demographics: ['All Age Groups'],
    date: '2024-02-05'
  },
  {
    id: 17,
    name: 'Working Parents Study',
    type: 'Survey Data',
    size: '980MB',
    records: '19,500',
    lastUpdated: '13 days ago',
    description: 'Research on work-life balance for parents',
    tags: ['work', 'family', 'balance'],
    geography: 'Australia/Oceania',
    demographics: ['Adults (26-64)'],
    date: '2023-11-20'
  },
  {
    id: 18,
    name: 'Elder Care Quality Assessment',
    type: 'Administrative Data',
    size: '2.6GB',
    records: '41,200',
    lastUpdated: '16 days ago',
    description: 'Evaluation of elder care facilities and services',
    tags: ['elder care', 'healthcare', 'quality'],
    geography: 'North America',
    demographics: ['Seniors (65+)'],
    date: '2023-10-25'
  },
  {
    id: 19,
    name: 'Youth Mental Wellness',
    type: 'Clinical Trials',
    size: '1.8GB',
    records: '23,400',
    lastUpdated: '8 days ago',
    description: 'Mental health interventions for young adults',
    tags: ['mental health', 'youth', 'wellness'],
    geography: 'Europe',
    demographics: ['Young Adults (18-25)'],
    date: '2024-01-12'
  },
  {
    id: 20,
    name: 'Global Education Access',
    type: 'Census Data',
    size: '3.5GB',
    records: '95,000',
    lastUpdated: '5 days ago',
    description: 'Worldwide analysis of education accessibility',
    tags: ['education', 'global', 'access'],
    geography: 'Africa',
    demographics: ['Children (0-12)', 'Adolescents (13-17)'],
    date: '2024-01-25'
  },
  {
    id: 2,
    name: 'Clinical Trials Database 2024',
    type: 'Clinical Trials',
    size: '2.5GB',
    records: '25,632',
    lastUpdated: '1 day ago',
    description: 'Collection of clinical trial data from various medical research centers',
    tags: ['clinical', 'medical', 'research'],
    geography: 'Europe',
    demographics: ['Adults (26-64)', 'Seniors (65+)'],
    date: '2024-01-10'
  },
  {
    id: 3,
    name: 'Youth Education Longitudinal Study',
    type: 'Longitudinal Studies',
    size: '800MB',
    records: '12,450',
    lastUpdated: '5 days ago',
    description: 'Multi-year study tracking educational outcomes in youth',
    tags: ['education', 'youth', 'longitudinal'],
    geography: 'North America',
    demographics: ['Children (0-12)', 'Adolescents (13-17)'],
    date: '2023-12-20'
  },
  {
    id: 4,
    name: 'Global Population Census 2024',
    type: 'Census Data',
    size: '5.1GB',
    records: '150,000',
    lastUpdated: '3 days ago',
    description: 'Comprehensive global population statistics and demographics',
    tags: ['census', 'population', 'global'],
    geography: 'Asia',
    demographics: ['All Age Groups'],
    date: '2024-02-01'
  },
  {
    id: 5,
    name: 'Healthcare Administrative Records',
    type: 'Administrative Data',
    size: '3.8GB',
    records: '45,890',
    lastUpdated: '1 week ago',
    description: 'Healthcare system administrative data and patient records',
    tags: ['healthcare', 'administrative', 'medical'],
    geography: 'Europe',
    demographics: ['Adults (26-64)', 'Seniors (65+)'],
    date: '2023-11-30'
  },
  {
    id: 6,
    name: 'Child Development Study 2023',
    type: 'Survey Data',
    size: '950MB',
    records: '8,750',
    lastUpdated: '4 days ago',
    description: 'Research on early childhood development patterns',
    tags: ['children', 'development', 'psychology'],
    geography: 'South America',
    demographics: ['Children (0-12)'],
    date: '2023-09-15'
  }
];

export default function DatasetExplorerPage() {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: 'lastUpdated',
    direction: 'desc'
  });

  // Shared dataset state that will be available to all child routes
  const [datasets] = useState(mockDatasets);

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
      <Navbar />
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              Dataset Explorer
            </h1>
            <p className="text-textSecondary-light dark:text-textSecondary-dark">
              Browse and explore available datasets
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary-light dark:text-textSecondary-dark" />
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark"
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
                className="flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-card-hover-dark"
              >
                <HiOutlineSortAscending />
                Sort
              </button>
            </div>
          </div>

          {/* Dataset Table */}
          <DatasetTable
            datasets={filteredAndSortedDatasets}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
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
        element={<SingleDatasetOverview datasets={datasets} />} 
      />
    </Routes>
  );
}
