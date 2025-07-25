import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import { listDatasets, getDatasetFile } from "../../utils/storageUtils";
import { getProject } from "../../services/projectService";

// ---------- UTILITY FUNCTIONS ----------
const parseCSV = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  const result = [];
  
  for (const line of lines) {
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    
    if (row.length > 1) {
      result.push(row);
    }
  }
  
  return result;
};

const detectColumnTypes = (data) => {
  if (!data || data.length < 2) return {};
  
  const headers = data[0];
  const types = {};
  
  headers.forEach((header, index) => {
    const samples = data.slice(1, Math.min(101, data.length)).map(row => row[index]);
    const nonEmpty = samples.filter(val => val !== '' && val != null);
    
    if (nonEmpty.length === 0) {
      types[header] = 'text';
      return;
    }
    
    const numericCount = nonEmpty.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
    const numericRatio = numericCount / nonEmpty.length;
    
    if (numericRatio > 0.8) {
      const hasDecimals = nonEmpty.some(val => String(val).includes('.'));
      types[header] = hasDecimals ? 'number' : 'integer';
    } else {
      const uniqueValues = new Set(nonEmpty).size;
      const uniqueRatio = uniqueValues / nonEmpty.length;
      
      if (uniqueRatio < 0.1 && uniqueValues < 20) {
        types[header] = 'category';
      } else {
        types[header] = 'text';
      }
    }
  });
  
  return types;
};

// Check if dataset is suitable for visualization (size and structure)
const analyzeDatasetSuitability = async (datasetId) => {
  try {
    console.log(`🔍 Analyzing dataset: ${datasetId}`);
    const response = await getDatasetFile(datasetId);
    const csvText = await response.Body.text();
    const rows = parseCSV(csvText);
    
    const fileSize = new Blob([csvText]).size;
    const rowCount = rows.length - 1; // Exclude header
    const columnCount = rows[0]?.length || 0;
    
    // Define suitability criteria
    const isSmall = rowCount <= 1000 && fileSize <= 100 * 1024; // <= 1K rows, <= 100KB
    const isMedium = rowCount <= 5000 && fileSize <= 500 * 1024; // <= 5K rows, <= 500KB
    const isLarge = rowCount <= 20000 && fileSize <= 2 * 1024 * 1024; // <= 20K rows, <= 2MB
    
    let suitability = 'unsuitable';
    if (isSmall) suitability = 'excellent';
    else if (isMedium) suitability = 'good';
    else if (isLarge) suitability = 'fair';
    
    const columnTypes = detectColumnTypes(rows);
    const numericColumns = Object.entries(columnTypes)
      .filter(([, type]) => ['number', 'integer'].includes(type))
      .map(([name]) => name);
    const categoryColumns = Object.entries(columnTypes)
      .filter(([, type]) => ['category', 'text'].includes(type))
      .map(([name]) => name);
    
    return {
      suitable: suitability !== 'unsuitable',
      suitability,
      rowCount,
      columnCount,
      fileSize,
      columns: rows[0] || [],
      columnTypes,
      numericColumns,
      categoryColumns,
      sampleData: rows.slice(0, 6) // First 5 data rows + header
    };
  } catch (error) {
    console.error(`❌ Error analyzing dataset ${datasetId}:`, error);
    return { suitable: false, error: error.message };
  }
};

// Generate smart suggestions for variable combinations and chart types
const generateSmartSuggestions = (analysis) => {
  const suggestions = [];
  const { numericColumns, categoryColumns } = analysis;
  
  // Scatter plot suggestions (numeric vs numeric)
  if (numericColumns.length >= 2) {
    for (let i = 0; i < Math.min(3, numericColumns.length - 1); i++) {
      for (let j = i + 1; j < Math.min(3, numericColumns.length); j++) {
        suggestions.push({
          type: 'scatter',
          xVar: numericColumns[i],
          yVar: numericColumns[j],
          title: `${numericColumns[j]} vs ${numericColumns[i]}`,
          description: `Explore correlation between ${numericColumns[i]} and ${numericColumns[j]}`,
          icon: '🔵',
          priority: 'high'
        });
      }
    }
  }
  
  // Bar chart suggestions (category vs numeric)
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    for (let i = 0; i < Math.min(2, categoryColumns.length); i++) {
      for (let j = 0; j < Math.min(2, numericColumns.length); j++) {
        suggestions.push({
          type: 'bar',
          xVar: categoryColumns[i],
          yVar: numericColumns[j],
          title: `${numericColumns[j]} by ${categoryColumns[i]}`,
          description: `Compare ${numericColumns[j]} across different ${categoryColumns[i]} categories`,
          icon: '📊',
          priority: 'high'
        });
      }
    }
  }
  
  // Line chart suggestions (for time series or ordered data)
  if (numericColumns.length >= 2) {
    suggestions.push({
      type: 'line',
      xVar: numericColumns[0],
      yVar: numericColumns[1],
      title: `${numericColumns[1]} Trend`,
      description: `Show trend of ${numericColumns[1]} over ${numericColumns[0]}`,
      icon: '📈',
      priority: 'medium'
    });
  }
  
  // Pie chart suggestions (category distribution)
  if (categoryColumns.length > 0) {
    suggestions.push({
      type: 'pie',
      xVar: categoryColumns[0],
      yVar: 'count',
      title: `${categoryColumns[0]} Distribution`,
      description: `Show distribution of ${categoryColumns[0]} categories`,
      icon: '🥧',
      priority: 'medium'
    });
  }
  
  // Sort by priority and return top suggestions
  return suggestions
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 6);
};

// Main component
export default function ProjectVisualizationSmart() {
  const { id: projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [suitableDatasets, setSuitableDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetAnalysis, setDatasetAnalysis] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSampleData, setShowSampleData] = useState(false);

  // Load and filter suitable datasets
  useEffect(() => {
    async function loadSuitableDatasets() {
      setLoading(true);
      setError(null);
      
      try {
        let datasets = location.state?.projectDatasets;
        if (!datasets) {
          const [, allDatasets] = await Promise.all([
            getProject(projectId),
            listDatasets()
          ]);
          datasets = allDatasets.filter(dataset => 
            dataset.projectId === projectId
          );
        }

        console.log(`🔍 Analyzing ${datasets.length} datasets for suitability...`);
        
        // Analyze each dataset for suitability
        const suitabilityPromises = datasets.map(async (dataset) => {
          const analysis = await analyzeDatasetSuitability(dataset.id);
          return { ...dataset, analysis };
        });
        
        const analyzedDatasets = await Promise.all(suitabilityPromises);
        const suitable = analyzedDatasets.filter(d => d.analysis.suitable);
        
        console.log(`✅ Found ${suitable.length} suitable datasets out of ${datasets.length}`);
        setSuitableDatasets(suitable);
        
      } catch (err) {
        console.error("❌ Error loading datasets:", err);
        setError(`Failed to load datasets: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadSuitableDatasets();
  }, [projectId, location.state]);

  // Generate suggestions when dataset is selected
  const handleDatasetSelect = useCallback(async (dataset) => {
    setSelectedDataset(dataset);
    setDatasetAnalysis(dataset.analysis);
    setSelectedSuggestion(null);
    setChartData(null);
    
    // Generate smart suggestions
    const suggestions = generateSmartSuggestions(dataset.analysis);
    setSmartSuggestions(suggestions);
    
    console.log(`💡 Generated ${suggestions.length} smart suggestions for dataset ${dataset.id}`);
  }, []);

  // Apply a suggestion
  const applySuggestion = useCallback(async (suggestion) => {
    if (!selectedDataset || !datasetAnalysis) return;
    
    setSelectedSuggestion(suggestion);
    setChartLoading(true);
    setError(null);
    
    try {
      console.log("🎨 Applying suggestion:", suggestion);
      
      const rows = datasetAnalysis.sampleData;
      const header = rows[0];
      const dataRows = rows.slice(1);
      
      let chartOptions = {
        chart: {
          id: `smart-chart-${Date.now()}`,
          type: suggestion.type,
          toolbar: { show: true },
          zoom: { enabled: true },
          animations: { enabled: false }
        },
        title: {
          text: suggestion.title,
          align: 'center',
          style: { fontSize: '16px', fontWeight: 'bold' }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        dataLabels: { enabled: false },
        legend: { show: true },
        grid: { show: true }
      };

      let chartSeries = [];

      if (suggestion.type === 'scatter') {
        const xIndex = header.indexOf(suggestion.xVar);
        const yIndex = header.indexOf(suggestion.yVar);
        
        const scatterData = dataRows.map(row => ({
          x: parseFloat(row[xIndex]) || 0,
          y: parseFloat(row[yIndex]) || 0
        }));
        
        chartOptions.xaxis = { title: { text: suggestion.xVar } };
        chartOptions.yaxis = { title: { text: suggestion.yVar } };
        chartSeries = [{ name: suggestion.yVar, data: scatterData }];
        
      } else if (suggestion.type === 'bar') {
        const xIndex = header.indexOf(suggestion.xVar);
        const yIndex = header.indexOf(suggestion.yVar);
        
        const barData = dataRows.map(row => ({
          x: String(row[xIndex]),
          y: parseFloat(row[yIndex]) || 0
        }));
        
        chartOptions.xaxis = { type: 'category', title: { text: suggestion.xVar } };
        chartOptions.yaxis = { title: { text: suggestion.yVar } };
        chartOptions.plotOptions = { bar: { horizontal: false, columnWidth: '60%' } };
        chartSeries = [{ name: suggestion.yVar, data: barData }];
        
      } else if (suggestion.type === 'line') {
        const xIndex = header.indexOf(suggestion.xVar);
        const yIndex = header.indexOf(suggestion.yVar);
        
        const lineData = dataRows.map(row => ({
          x: parseFloat(row[xIndex]) || 0,
          y: parseFloat(row[yIndex]) || 0
        }));
        
        chartOptions.xaxis = { title: { text: suggestion.xVar } };
        chartOptions.yaxis = { title: { text: suggestion.yVar } };
        chartOptions.stroke = { curve: 'smooth', width: 2 };
        chartSeries = [{ name: suggestion.yVar, data: lineData }];
        
      } else if (suggestion.type === 'pie') {
        const xIndex = header.indexOf(suggestion.xVar);
        
        const categoryCount = {};
        dataRows.forEach(row => {
          const category = String(row[xIndex] || 'Unknown');
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        chartOptions.labels = Object.keys(categoryCount);
        chartSeries = Object.values(categoryCount);
        chartOptions.legend = { show: true, position: 'bottom' };
      }
      
      setChartData({ options: chartOptions, series: chartSeries });
      console.log("✅ Chart generated successfully from suggestion");
      
    } catch (err) {
      console.error("❌ Error applying suggestion:", err);
      setError(`Failed to generate chart: ${err.message}`);
    } finally {
      setChartLoading(false);
    }
  }, [selectedDataset, datasetAnalysis]);

  const getSuitabilityBadge = (suitability) => {
    const badges = {
      excellent: { text: "Excellent", color: "bg-green-100 text-green-800", icon: "🟢" },
      good: { text: "Good", color: "bg-blue-100 text-blue-800", icon: "🔵" },
      fair: { text: "Fair", color: "bg-yellow-100 text-yellow-800", icon: "🟡" }
    };
    return badges[suitability] || badges.fair;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium mr-4"
            title="Return to project"
          >
            ← Back to Project
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧠 Smart Data Visualization
        </h1>
        <p className="text-gray-600">
          Choose from pre-filtered suitable datasets and get intelligent suggestions for the best visualizations
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-700">
              🔍 Analyzing datasets for visualization suitability...
            </div>
            <div className="text-sm text-gray-500 mt-2">
              This may take a moment as we check file sizes and data structures
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">❌</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Dataset Selection */}
      {!loading && suitableDatasets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            📊 Choose a Suitable Dataset ({suitableDatasets.length} available)
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suitableDatasets.map((dataset) => {
              const badge = getSuitabilityBadge(dataset.analysis.suitability);
              const isSelected = selectedDataset?.id === dataset.id;
              
              return (
                <div
                  key={dataset.id}
                  onClick={() => handleDatasetSelect(dataset)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {dataset.filename}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.icon} {badge.text}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>📏 {dataset.analysis.rowCount?.toLocaleString()} rows × {dataset.analysis.columnCount} columns</div>
                    <div>💾 {(dataset.analysis.fileSize / 1024).toFixed(1)} KB</div>
                    <div>🔢 {dataset.analysis.numericColumns?.length} numeric, {dataset.analysis.categoryColumns?.length} categorical</div>
                  </div>
                  
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">
                        ✅ Selected - Suggestions available below
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No suitable datasets */}
      {!loading && suitableDatasets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Suitable Datasets Found
          </h3>
          <p className="text-gray-600 mb-4">
            All datasets in this project are too large or complex for efficient visualization.
          </p>
          <div className="text-sm text-gray-500">
            Try datasets with:
            <ul className="mt-2 space-y-1">
              <li>• Less than 5,000 rows</li>
              <li>• File size under 500KB</li>
              <li>• Clear numeric and categorical columns</li>
            </ul>
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {selectedDataset && smartSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            💡 Smart Visualization Suggestions
          </h2>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {smartSuggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestion === suggestion;
              
              return (
                <div
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{suggestion.icon}</div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      suggestion.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {suggestion.priority}
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {suggestion.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {suggestion.description}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    📊 {suggestion.type} • X: {suggestion.xVar} • Y: {suggestion.yVar}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-xs text-green-600 font-medium">
                        ✅ Applied - Chart generated below
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sample Data Preview */}
      {selectedDataset && datasetAnalysis && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              📋 Dataset Preview: {selectedDataset.filename}
            </h2>
            <button
              onClick={() => setShowSampleData(!showSampleData)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              {showSampleData ? '👁️ Hide' : '👁️ Show'} Sample Data
            </button>
          </div>
          
          {showSampleData && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {datasetAnalysis.columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div>{column}</div>
                          <div className="text-xs font-normal text-gray-400 mt-1">
                            {datasetAnalysis.columnTypes[column]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datasetAnalysis.sampleData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-sm text-gray-900"
                          >
                            {String(cell).length > 50 ? `${String(cell).substring(0, 50)}...` : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                Showing first 5 rows of {datasetAnalysis.rowCount?.toLocaleString()} total rows
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart Display */}
      {selectedSuggestion && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            📈 Generated Visualization
          </h2>
          
          {chartLoading ? (
            <div className="border border-gray-200 rounded-lg p-12 bg-white">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-lg font-medium text-gray-700 mb-2">
                  🎨 Creating your visualization...
                </div>
                <div className="text-sm text-gray-500">
                  Applying suggestion: {selectedSuggestion.title}
                </div>
              </div>
            </div>
          ) : chartData ? (
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <Chart
                options={chartData.options}
                series={chartData.series}
                type={selectedSuggestion.type}
                width="100%"
                height="500"
              />
              <div className="mt-4 text-sm text-gray-600 text-center">
                💡 Suggestion: {selectedSuggestion.description}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
