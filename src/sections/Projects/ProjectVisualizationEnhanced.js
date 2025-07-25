import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
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

// Sample large datasets for better performance
const sampleData = (rows, maxRows, sampleSize) => {
  if (rows.length <= maxRows) {
    return { data: rows, isSampled: false, originalSize: rows.length };
  }
  
  const header = rows[0];
  const dataRows = rows.slice(1);
  
  // Use systematic sampling for better representation
  const step = Math.floor(dataRows.length / sampleSize);
  const sampledRows = [];
  
  for (let i = 0; i < dataRows.length; i += step) {
    sampledRows.push(dataRows[i]);
    if (sampledRows.length >= sampleSize) break;
  }
  
  return {
    data: [header, ...sampledRows],
    isSampled: true,
    originalSize: rows.length,
    sampleSize: sampledRows.length
  };
};

const detectColumnTypes = (rows) => {
  if (rows.length < 2) return {};
  
  const headers = rows[0];
  const types = {};
  
  headers.forEach((header, index) => {
    let numericCount = 0;
    let totalCount = 0;
    
    for (let i = 1; i < Math.min(rows.length, 100); i++) { // Sample first 100 rows
      const value = rows[i][index];
      if (value && value.trim() !== '') {
        totalCount++;
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          numericCount++;
        }
      }
    }
    
    types[header] = {
      isNumeric: numericCount / totalCount > 0.8, // 80% threshold
      uniqueValues: new Set(rows.slice(1, 21).map(row => row[index])).size, // First 20 rows
      sampleValues: rows.slice(1, 4).map(row => row[index]).filter(v => v)
    };
  });
  
  return types;
};

const getRecommendedChartType = (xType, yType, xUniqueValues) => {
  if (!xType || !yType) return 'bar';
  if (xType.isNumeric && yType.isNumeric) {
    return 'scatter';
  } else if (!xType.isNumeric && yType.isNumeric) {
    return xUniqueValues > 10 ? 'line' : 'bar';
  } else {
    return 'bar';
  }
};

// ---------- DRAGGABLE COMPONENT ----------
function DraggableField({ id, label, columnType }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
    cursor: "grab",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: columnType?.isNumeric ? "#e6f3ff" : "#f0f8e6",
    marginBottom: "5px",
    fontSize: "14px"
  };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ fontWeight: "500" }}>{label}</div>
      {columnType && (
        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
          {columnType.isNumeric ? "📊 Numeric" : "📝 Categorical"}
          {columnType.sampleValues && columnType.sampleValues.length > 0 && (
            <div style={{ marginTop: "2px" }}>
              Sample: {columnType.sampleValues.slice(0, 2).join(", ")}
              {columnType.sampleValues.length > 2 && "..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- DROPPABLE COMPONENT ----------
function DroppableZone({ id, label, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const style = {
    border: "2px dashed #ccc",
    background: isOver ? "#e0f7ff" : "#fafafa",
    padding: "20px",
    minHeight: "60px",
    borderRadius: "4px",
    marginBottom: "10px",
  };
  return (
    <div ref={setNodeRef} style={style}>
      <strong>{label}</strong>
      <div style={{ marginTop: "10px" }}>{children}</div>
    </div>
  );
}

// ---------- MAIN COMPONENT ----------
export default function ProjectVisualization() {
  const { id: projectId } = useParams();
  const location = useLocation();

  const [columns, setColumns] = useState([]);
  const [columnTypes, setColumnTypes] = useState({});
  const [parsedData, setParsedData] = useState(null);
  const [xVar, setXVar] = useState(null);
  const [yVar, setYVar] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectDatasets, setProjectDatasets] = useState([]);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [dataFilter, setDataFilter] = useState("");
  const [datasetSize, setDatasetSize] = useState(0);
  const [sampledData, setSampledData] = useState(null);
  const [isDataSampled, setIsDataSampled] = useState(false);

  // Configuration for dataset size limits
  const MAX_ROWS_FOR_CHARTS = 10000; // Maximum rows for chart generation
  const MAX_ROWS_FOR_PREVIEW = 5000;  // Maximum rows for data preview
  const SAMPLE_SIZE = 5000;           // Sample size for large datasets

  // Available chart types with descriptions
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'area', label: 'Area Chart', icon: '🏔️' },
    { value: 'scatter', label: 'Scatter Plot', icon: '🔵' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ];

  // Helper function to process dataset
  const processDataset = async (datasetId) => {
    try {
      const response = await getDatasetFile(datasetId);
      const csvText = await response.Body.text();
      const rows = parseCSV(csvText);
      
      if (!rows.length || rows[0].length === 0) {
        throw new Error("Dataset appears empty or malformed.");
      }
      
      // Sample data if it's too large
      const samplingResult = sampleData(rows, MAX_ROWS_FOR_CHARTS, SAMPLE_SIZE);
      const processedRows = samplingResult.data;
      
      setDatasetSize(samplingResult.originalSize);
      setIsDataSampled(samplingResult.isSampled);
      setSampledData(samplingResult);
      
      const types = detectColumnTypes(processedRows);
      setColumns(processedRows[0]);
      setColumnTypes(types);
      setParsedData(processedRows);
      
      // Show warning if data was sampled
      if (samplingResult.isSampled) {
        console.log(`📊 Large dataset detected (${samplingResult.originalSize.toLocaleString()} rows). Using sample of ${samplingResult.sampleSize.toLocaleString()} rows for better performance.`);
      }
      
      return { rows: processedRows, types, samplingResult };
    } catch (error) {
      console.error("❌ Failed to process dataset:", error);
      throw error;
    }
  };

  // ---------- LOAD PROJECT DATA ----------
  useEffect(() => {
    async function fetchProjectData() {
      setLoading(true);
      setError(null);
      try {
        // Use datasets from navigation state if available
        let filtered = location.state?.projectDatasets;
        if (!filtered) {
          // Fallback: fetch from backend
          const [project, datasets] = await Promise.all([
            getProject(projectId),
            listDatasets()
          ]);
          if (!project.selectedDatasets || project.selectedDatasets.length === 0) {
            setError("No datasets linked to this project.");
            setProjectDatasets([]);
            return;
          }
          filtered = datasets.filter((d) => project.selectedDatasets.includes(d.id));
        }
        setProjectDatasets(filtered);
        
        // Auto-select first dataset and process it
        if (filtered.length > 0) {
          setSelectedDataset(filtered[0].id);
          await processDataset(filtered[0].id);
        }
      } catch (err) {
        console.error("❌ Failed to load project datasets:", err);
        setError(`Failed to load project data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchProjectData();
  }, [projectId, location.state]);

  // ---------- HANDLE DRAG-DROP ----------
  const handleDragEnd = ({ over, active }) => {
    if (!over) return;
    
    if (over.id === "x-axis") {
      setXVar(active.id);
      // Auto-recommend chart type when both axes are set
      if (yVar && columnTypes[active.id] && columnTypes[yVar]) {
        const recommended = getRecommendedChartType(
          columnTypes[active.id], 
          columnTypes[yVar], 
          columnTypes[active.id].uniqueValues
        );
        setChartType(recommended);
      }
    }
    if (over.id === "y-axis") {
      setYVar(active.id);
      // Auto-recommend chart type when both axes are set
      if (xVar && columnTypes[active.id] && columnTypes[xVar]) {
        const recommended = getRecommendedChartType(
          columnTypes[xVar], 
          columnTypes[active.id], 
          columnTypes[xVar].uniqueValues
        );
        setChartType(recommended);
      }
    }
  };

  // ---------- GENERATE CHART ----------
  const generateChart = useCallback(async () => {
    if (!selectedDataset || !parsedData || !xVar || !yVar) {
      console.log("❌ Chart generation skipped - missing requirements:", {
        selectedDataset: !!selectedDataset,
        parsedData: !!parsedData,
        xVar: !!xVar,
        yVar: !!yVar
      });
      return;
    }
    
    console.log("🚀 Starting chart generation...", { xVar, yVar, chartType, dataFilter });
    
    setChartLoading(true);
    setError(null);
    
    try {
      // Use setTimeout to yield control back to the browser
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const rows = parsedData;
      const header = rows[0];
      const xIndex = header.indexOf(xVar);
      const yIndex = header.indexOf(yVar);
      
      console.log("📊 Found column indices:", { xIndex, yIndex, header });
      
      if (xIndex === -1 || yIndex === -1) {
        setError("Selected variables not found in dataset.");
        return;
      }

      // Limit data size for performance - take only first 1000 rows if more
      let dataRows = rows.slice(1);
      if (dataRows.length > 1000) {
        console.log(`⚡ Limiting data to 1000 rows (was ${dataRows.length})`);
        dataRows = dataRows.slice(0, 1000);
      }

      // Process filtering with smaller chunks
      let filteredRows = dataRows;
      if (dataFilter.trim()) {
        const filterLower = dataFilter.toLowerCase();
        filteredRows = dataRows.filter(row => 
          row.some(cell => 
            cell.toString().toLowerCase().includes(filterLower)
          )
        );
        console.log(`🔍 Filtered to ${filteredRows.length} rows`);
      }

      let processedData = [];
      let categories = [];
      
      const xType = columnTypes[xVar];

      console.log("🔄 Processing chart data...", { chartType, rowCount: filteredRows.length });

      if (chartType === 'scatter') {
        // Process scatter plot data
        processedData = filteredRows.slice(0, 500).map(row => ({ // Limit scatter to 500 points
          x: parseFloat(row[xIndex]) || 0,
          y: parseFloat(row[yIndex]) || 0
        }));
      } else if (chartType === 'pie') {
        // Aggregate data for pie chart - limit to top 10 categories
        const aggregated = {};
        filteredRows.forEach(row => {
          const key = row[xIndex];
          const value = parseFloat(row[yIndex]) || 1;
          aggregated[key] = (aggregated[key] || 0) + value;
        });
        
        // Sort and take top 10
        const sorted = Object.entries(aggregated)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        categories = sorted.map(([key]) => key);
        processedData = sorted.map(([,value]) => value);
      } else {
        // Bar, Line, Area charts - limit to 100 categories
        const limitedRows = filteredRows.slice(0, 100);
        categories = limitedRows.map(row => row[xIndex]);
        processedData = limitedRows.map(row => parseFloat(row[yIndex]) || 0);
      }

      console.log("✅ Data processed successfully:", { 
        dataPoints: processedData.length, 
        categories: categories.length 
      });

      // Yield control before creating chart config
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create chart configuration
      const chartConfig = {
        options: {
          chart: { 
            id: "enhanced-chart",
            toolbar: { show: true },
            animations: {
              enabled: false // Disable animations for performance
            }
          },
          title: {
            text: `${yVar} vs ${xVar}`,
            align: 'center'
          },
          xaxis: chartType === 'scatter' ? { 
            title: { text: xVar },
            type: xType?.isNumeric ? 'numeric' : 'category'
          } : { 
            categories: categories.slice(0, 50), // Limit x-axis labels
            title: { text: xVar }
          },
          yaxis: {
            title: { text: yVar }
          },
          tooltip: { enabled: true },
          legend: { show: true, position: 'bottom' },
          noData: {
            text: 'No data available',
            align: 'center',
            verticalAlign: 'middle'
          }
        },
        series: chartType === 'pie' ? 
          processedData : 
          [{ name: yVar, data: processedData.slice(0, 1000), type: chartType }] // Limit series data
      };

      console.log("📈 Chart config created, setting chart data...");
      setChartData(chartConfig);
      console.log("✨ Chart generation completed successfully!");
      
    } catch (err) {
      console.error("❌ Failed to generate chart:", err);
      setError(`Chart generation failed: ${err.message}`);
    } finally {
      setChartLoading(false);
    }
  }, [selectedDataset, parsedData, xVar, yVar, chartType, dataFilter, columnTypes]);

  useEffect(() => {
    if (xVar && yVar && parsedData) {
      // Debounce chart generation to avoid too many updates
      const timer = setTimeout(() => {
        generateChart();
      }, 500); // Increased debounce time
      
      // Add a maximum timeout to prevent infinite loading
      const maxTimer = setTimeout(() => {
        console.log("⚠️ Chart generation timeout - stopping loading state");
        setChartLoading(false);
        setError("Chart generation timed out. Try with a smaller dataset or different variables.");
      }, 10000); // 10 second timeout
      
      return () => {
        clearTimeout(timer);
        clearTimeout(maxTimer);
      };
    }
  }, [generateChart, xVar, yVar, parsedData]);

  return (
    <div className="p-6 bg-white rounded shadow min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🎨 Enhanced Data Visualization</h1>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-blue-600">Loading project data...</div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          {/* Data Size Warning */}
          {isDataSampled && sampledData && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 text-xl">⚠️</div>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">Large Dataset Detected</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    Your dataset contains <strong>{sampledData.originalSize.toLocaleString()} rows</strong>, 
                    which is quite large. For optimal performance, we're using a representative sample of{' '}
                    <strong>{sampledData.sampleSize.toLocaleString()} rows</strong> for visualization.
                  </p>
                  <div className="text-xs text-amber-600 bg-amber-100 rounded px-2 py-1 inline-block">
                    📊 Sample represents {((sampledData.sampleSize / sampledData.originalSize) * 100).toFixed(1)}% of your data
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Dataset Selector */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">📊 Select Dataset:</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDataset || ""}
                onChange={async (e) => {
                  setSelectedDataset(e.target.value);
                  setChartData(null);
                  setXVar(null);
                  setYVar(null);
                  setError(null);
                  setChartLoading(false);
                  try {
                    await processDataset(e.target.value);
                  } catch (err) {
                    console.error("❌ Failed to process dataset:", err);
                    setError(`Failed to load dataset: ${err.message}`);
                  }
                }}
              >
                <option value="">-- Select a Dataset --</option>
                {projectDatasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.fileCount || 0} files)
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Selector */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">📈 Chart Type:</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                {chartTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">🔍 Filter Data:</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type to filter rows..."
                value={dataFilter}
                onChange={(e) => setDataFilter(e.target.value)}
              />
            </div>

            {/* Performance Info */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">⚡ Performance:</label>
              <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                <div>Max rows: {MAX_ROWS_FOR_CHARTS.toLocaleString()}</div>
                <div>Sample size: {SAMPLE_SIZE.toLocaleString()}</div>
                {isDataSampled && (
                  <div className="text-amber-600 font-medium mt-1">
                    🔸 Data sampled
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(xVar || yVar) && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => {
                  setXVar(null);
                  setYVar(null);
                  setChartData(null);
                  setChartLoading(false);
                }}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                🗑️ Clear All Variables
              </button>
              {chartData && (
                <div className="text-sm text-gray-600 flex items-center">
                  ✅ Chart generated successfully
                </div>
              )}
            </div>
          )}

          {/* Data Preview Toggle */}
          {parsedData && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowDataPreview(!showDataPreview)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {showDataPreview ? '🙈 Hide' : '👁️ Show'} Data Preview 
                ({(parsedData.length - 1).toLocaleString()} rows
                {isDataSampled && ' - sampled'})
              </button>
              {isDataSampled && (
                <div className="text-xs text-gray-500">
                  Showing sample data for performance
                </div>
              )}
            </div>
          )}

          {/* Data Preview Table */}
          {showDataPreview && parsedData && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      {parsedData[0].map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-gray-700">
                          {header}
                          <div className="text-xs text-gray-500 mt-1">
                            {columnTypes[header]?.isNumeric ? '📊 Numeric' : '📝 Text'}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(1, 6).map((row, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 6 && (
                  <div className="text-sm text-gray-500 mt-2 text-center">
                    ... and {parsedData.length - 6} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Visualization Area */}
          {columns.length > 0 && (
            <DndContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel - Draggable Fields */}
                <div className="lg:col-span-1">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-3 text-gray-800">📋 Variables</h3>
                    <div className="space-y-2">
                      {columns.map((col) => (
                        <DraggableField 
                          key={col} 
                          id={col} 
                          label={col} 
                          columnType={columnTypes[col]}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel - Drop Zones + Chart */}
                <div className="lg:col-span-3">
                  <div className="space-y-4">
                    {/* Drop Zones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DroppableZone id="x-axis" label="🔢 X-Axis Variable">
                        {xVar && (
                          <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg relative group">
                            <button
                              onClick={() => {
                                setXVar(null);
                                setChartData(null);
                                setChartLoading(false);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Remove variable"
                            >
                              ×
                            </button>
                            <strong>{xVar}</strong>
                            {columnTypes[xVar] && (
                              <div className="text-sm text-blue-600 mt-1">
                                {columnTypes[xVar].isNumeric ? '📊 Numeric' : '📝 Categorical'}
                              </div>
                            )}
                          </div>
                        )}
                      </DroppableZone>
                      
                      <DroppableZone id="y-axis" label="📊 Y-Axis Variable">
                        {yVar && (
                          <div className="p-3 bg-green-100 border border-green-200 rounded-lg relative group">
                            <button
                              onClick={() => {
                                setYVar(null);
                                setChartData(null);
                                setChartLoading(false);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Remove variable"
                            >
                              ×
                            </button>
                            <strong>{yVar}</strong>
                            {columnTypes[yVar] && (
                              <div className="text-sm text-green-600 mt-1">
                                {columnTypes[yVar].isNumeric ? '📊 Numeric' : '📝 Categorical'}
                              </div>
                            )}
                          </div>
                        )}
                      </DroppableZone>
                    </div>

                    {/* Chart Display */}
                    {chartLoading ? (
                      <div className="border border-gray-200 rounded-lg p-8 bg-white">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                          <div className="text-lg font-medium text-gray-700 mb-2">
                            🔄 Generating Chart...
                          </div>
                          <div className="text-sm text-gray-500">
                            Processing {parsedData?.length - 1 || 0} rows of data
                            {isDataSampled && ' (sampled for performance)'}
                          </div>
                          {dataFilter && (
                            <div className="text-xs text-blue-600 mt-1">
                              Applying filter: "{dataFilter}"
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            This should take less than 10 seconds...
                          </div>
                          <button
                            onClick={() => {
                              setChartLoading(false);
                              setError("Chart generation cancelled by user");
                            }}
                            className="mt-3 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : chartData ? (
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-800">
                            📈 {chartData.options.title.text}
                          </h3>
                          <div className="text-sm text-gray-500">
                            {dataFilter && `Filtered • `}
                            {chartTypes.find(t => t.value === chartType)?.icon} {chartTypes.find(t => t.value === chartType)?.label}
                          </div>
                        </div>
                        <div className="relative">
                          <Chart
                            options={chartData.options}
                            series={chartData.series}
                            type={chartType}
                            width="100%"
                            height="500"
                          />
                        </div>
                      </div>
                    ) : xVar && yVar ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="text-gray-500">
                          <div className="text-2xl mb-2">⏳</div>
                          <div>Preparing to generate chart...</div>
                          <button
                            onClick={() => {
                              console.log("🔄 Manual chart generation triggered");
                              generateChart();
                            }}
                            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Generate Chart Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="text-gray-500">
                          <div className="text-2xl mb-2">🎯</div>
                          <div className="font-medium mb-1">Ready to Create Chart</div>
                          <div className="text-sm">Drag variables to X and Y axes to begin</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DndContext>
          )}

          {/* No Data State */}
          {!selectedDataset && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Dataset Selected</h3>
              <p className="text-gray-600">Choose a dataset from the dropdown above to start visualizing</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
