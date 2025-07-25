import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import Chart from "react-apexcharts";
import { listDatasets, getDatasetFile } from "../../utils/storageUtils";
import { getProject, updateProject } from "../../services/projectService";

// ====================================================================
// --------------------  UTILITY FUNCTIONS  ----------------------------
// ====================================================================

/** Robust CSV Parser (handles quotes) */
const parseCSV = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  const result = [];

  for (const line of lines) {
    const row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    if (row.length > 1) result.push(row);
  }

  return result;
};

/** Sample large data to avoid rendering slowness */
const sampleData = (rows, maxRows = 5000, sampleSize = 2000) => {
  if (rows.length <= maxRows) {
    return { data: rows, isSampled: false, originalSize: rows.length };
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
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
    sampleSize: sampledRows.length,
  };
};

/** Calculate correlation coefficient between two arrays */
const calculateCorrelation = (x, y) => {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  // Filter out invalid values
  const validPairs = [];
  for (let i = 0; i < x.length; i++) {
    if (typeof x[i] === 'number' && typeof y[i] === 'number' && 
        !isNaN(x[i]) && !isNaN(y[i]) && isFinite(x[i]) && isFinite(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }
  
  if (validPairs.length < 2) return 0; // Need at least 2 points for correlation
  
  const n = validPairs.length;
  const xValues = validPairs.map(pair => pair[0]);
  const yValues = validPairs.map(pair => pair[1]);
  
  const meanX = xValues.reduce((a, b) => a + b, 0) / n;
  const meanY = yValues.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = xValues[i] - meanX;
    const diffY = yValues[i] - meanY;
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denominatorX * denominatorY);
  if (denominator === 0) return 0;
  
  const correlation = numerator / denominator;
  return isNaN(correlation) || !isFinite(correlation) ? 0 : correlation;
};

/** Generate statistical insights for charts */
const generateInsight = (chartType, stats, dataCount) => {
  if (chartType === 'histogram' && stats) {
    return `Distribution: Mean=${stats.mean?.toFixed(2)}, Std Dev=${((stats.q3 - stats.q1) / 1.35)?.toFixed(2)}`;
  } else if (chartType === 'boxplot' && stats) {
    return `5-Number Summary: Min=${stats.min}, Q1=${stats.q1}, Median=${stats.median}, Q3=${stats.q3}, Max=${stats.max}`;
  } else if (chartType === 'heatmap') {
    return `Correlation Matrix: Showing relationships between numeric variables`;
  } else if (stats) {
    return `Sample: ${dataCount} rows, Range: ${stats.min?.toFixed(1)} - ${stats.max?.toFixed(1)}`;
  }
  return `Showing ${dataCount} data points`;
};

/** Get chart type recommendations based on variable types */
const getChartTypeRecommendation = (chartType) => {
  const recommendations = {
    'bar': 'Best for: Category vs Numeric comparisons',
    'line': 'Best for: Time series or sequential data trends',
    'area': 'Best for: Cumulative values over categories/time',
    'scatter': 'Best for: Correlation analysis between two numeric variables',
    'pie': 'Best for: Part-to-whole relationships (limit to 8 categories)',
    'heatmap': 'Best for: Correlation matrix with 3+ numeric variables',
    'boxplot': 'Best for: Statistical distribution analysis and outlier detection',
    'histogram': 'Best for: Understanding data distribution patterns',
    'bubble': 'Best for: 3-dimensional numeric data relationships'
  };
  return recommendations[chartType] || 'Suitable for general data visualization';
};
const detectColumnTypes = (rows) => {
  if (rows.length < 2) return {};

  const headers = rows[0];
  const types = {};

  headers.forEach((header, index) => {
    let numericCount = 0;
    let totalCount = 0;
    let nullCount = 0;
    let uniqueValues = new Set();
    let sum = 0;
    let values = [];

    for (let i = 1; i < Math.min(rows.length, 1000); i++) {
      const value = rows[i][index];
      if (value === '' || value == null) {
        nullCount++;
      } else {
        totalCount++;
        uniqueValues.add(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          numericCount++;
          sum += numValue;
          values.push(numValue);
        }
      }
    }

    const isNumeric = numericCount / Math.max(totalCount, 1) > 0.8;
    
    // Calculate statistics for numeric columns
    let stats = {};
    if (isNumeric && values.length > 0) {
      values.sort((a, b) => a - b);
      const mean = sum / values.length;
      const median = values[Math.floor(values.length / 2)];
      const min = values[0];
      const max = values[values.length - 1];
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      
      stats = { mean, median, min, max, q1, q3, count: values.length };
    }

    types[header] = {
      isNumeric,
      uniqueValues: uniqueValues.size,
      nullCount,
      completeness: (totalCount / (totalCount + nullCount)) * 100,
      stats,
      sampleValues: rows
        .slice(1, 6)
        .map((row) => row[index])
        .filter((v) => v),
    };
  });

  return types;
};

// ====================================================================
// --------------------  VISUALIZATION WIDGET  ------------------------
// ====================================================================

function VisualizationWidget({ widget, onUpdate, onDelete, datasets, allWidgets, resolveCollisions }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isBeingResized, setIsBeingResized] = useState(false);

  const chartTypes = [
    { value: 'bar', label: 'Bar', icon: '📊', description: 'Compare categories' },
    { value: 'line', label: 'Line', icon: '📈', description: 'Show trends over time' },
    { value: 'area', label: 'Area', icon: '🏔️', description: 'Show cumulative data' },
    { value: 'scatter', label: 'Scatter', icon: '🔵', description: 'Find correlations' },
    { value: 'pie', label: 'Pie', icon: '🥧', description: 'Show proportions' },
    { value: 'heatmap', label: 'Heatmap', icon: '🌡️', description: 'Show data density' },
    { value: 'box', label: 'Box Plot', icon: '📦', description: 'Show distributions' },
    { value: 'histogram', label: 'Histogram', icon: '📈', description: 'Show frequency distribution' },
    { value: 'bubble', label: 'Bubble', icon: '🫧', description: 'Three-dimensional data' }
  ];

  // Load dataset when widget dataset changes
  const loadWidgetData = useCallback(async () => {
    if (!widget.datasetId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getDatasetFile(widget.datasetId);
      const csvText = await response.Body.text();
      const rows = parseCSV(csvText);
      const samplingResult = sampleData(rows, 5000, 2000);
      
      setParsedData(samplingResult.data);
      
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [widget.datasetId]);

  useEffect(() => {
    if (widget.datasetId && !parsedData) {
      loadWidgetData();
    }
  }, [widget.datasetId, parsedData, loadWidgetData]);

/** Generate plot options for specific chart types */
const getPlotOptions = (chartType) => {
  const options = {};
  
  switch (chartType) {
    case 'heatmap':
      options.heatmap = {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [{
            from: -1,
            to: -0.5,
            name: 'Strong Negative',
            color: '#FF4560'
          }, {
            from: -0.5,
            to: 0,
            name: 'Weak Negative', 
            color: '#FEB019'
          }, {
            from: 0,
            to: 0.5,
            name: 'Weak Positive',
            color: '#00E396'
          }, {
            from: 0.5,
            to: 1,
            name: 'Strong Positive',
            color: '#008FFB'
          }]
        }
      };
      break;
    case 'histogram':
      options.bar = {
        horizontal: false,
        columnWidth: '80%',
        borderRadius: 2
      };
      break;
    case 'boxplot':
      options.boxPlot = {
        colors: {
          upper: '#5C4742',
          lower: '#A5978B'
        }
      };
      break;
    default:
      // No specific plot options needed for other chart types
      break;
  }
  
  return options;
};

  const generateChart = useCallback(async () => {
    if (!parsedData || !widget.xVar || !widget.yVar) return null;

    try {
      const rows = parsedData;
      const header = rows[0];
      const xIndex = header.indexOf(widget.xVar);
      const yIndex = header.indexOf(widget.yVar);
      
      if (xIndex === -1 || yIndex === -1) return null;

      const dataRows = rows.slice(1);
      if (dataRows.length === 0) return null; // No data to process
      
      const maxRows = 500;
      const limitedRows = dataRows.length > maxRows ? dataRows.slice(0, maxRows) : dataRows;
      
      // Get column type information for enhanced processing
      const columnTypes = detectColumnTypes(rows);
      const yType = columnTypes[widget.yVar];

      let processedData = [];
      let categories = [];

      // Enhanced chart type processing with better validation
      if (widget.chartType === 'scatter' || widget.chartType === 'bubble') {
        const maxPoints = widget.chartType === 'bubble' ? 50 : 100;
        const validData = [];
        
        for (let i = 0; i < Math.min(limitedRows.length, maxPoints); i++) {
          const row = limitedRows[i];
          const x = parseFloat(row[xIndex]);
          const y = parseFloat(row[yIndex]);
          
          if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
            if (widget.chartType === 'bubble') {
              validData.push({
                x: x,
                y: y,
                z: Math.abs(y) + 1 // Size based on y-value
              });
            } else {
              validData.push({ x: x, y: y });
            }
          }
        }
        
        processedData = validData;
        if (processedData.length === 0) {
          // Fallback to prevent empty data
          processedData = [{ x: 0, y: 0 }];
        }
      } else if (widget.chartType === 'pie') {
        const aggregated = {};
        limitedRows.forEach(row => {
          const key = String(row[xIndex] || 'Unknown').substring(0, 20);
          const value = parseFloat(row[yIndex]) || 0;
          if (value > 0) { // Only include positive values for pie charts
            aggregated[key] = (aggregated[key] || 0) + value;
          }
        });
        
        const sorted = Object.entries(aggregated)
          .filter(([_, value]) => value > 0) // Ensure positive values
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8);
        
        if (sorted.length === 0) {
          // Fallback data for pie chart
          categories = ['No Data'];
          processedData = [1];
        } else {
          categories = sorted.map(([key]) => key);
          processedData = sorted.map(([,value]) => value);
        }
      } else if (widget.chartType === 'histogram') {
        // Create histogram bins for numeric data
        if (yType?.isNumeric && yType.stats) {
          const values = limitedRows
            .map(row => parseFloat(row[yIndex]))
            .filter(v => !isNaN(v) && isFinite(v));
          
          if (values.length > 0) {
            const bins = 10;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            if (min !== max) { // Ensure we have a range
              const binSize = (max - min) / bins;
              const histogram = new Array(bins).fill(0);
              const binLabels = [];
              
              for (let i = 0; i < bins; i++) {
                const binStart = min + i * binSize;
                const binEnd = min + (i + 1) * binSize;
                binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
              }
              
              values.forEach(value => {
                const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
                histogram[binIndex]++;
              });
              
              categories = binLabels;
              processedData = histogram;
            } else {
              // All values are the same
              categories = [min.toString()];
              processedData = [values.length];
            }
          } else {
            // No valid numeric data
            categories = ['No Data'];
            processedData = [0];
          }
        } else {
          // Fallback for non-numeric data
          categories = ['No Data'];
          processedData = [0];
        }
      } else if (widget.chartType === 'boxplot') {
        // Prepare box plot data with validation
        if (yType?.isNumeric && yType.stats) {
          const stats = yType.stats;
          if (stats.min != null && stats.q1 != null && stats.median != null && stats.q3 != null && stats.max != null) {
            processedData = [{
              x: widget.xVar,
              y: [stats.min, stats.q1, stats.median, stats.q3, stats.max]
            }];
          } else {
            // Fallback if stats are incomplete
            processedData = [{
              x: widget.xVar,
              y: [0, 0, 0, 0, 0]
            }];
          }
        } else {
          processedData = [{
            x: widget.xVar,
            y: [0, 0, 0, 0, 0]
          }];
        }
      } else if (widget.chartType === 'heatmap') {
        // Create correlation heatmap for numeric columns
        const numericColumns = Object.entries(columnTypes)
          .filter(([col, type]) => type.isNumeric && type.stats && type.stats.count > 0)
          .map(([col]) => col)
          .slice(0, 8); // Reduced for better performance
          
        if (numericColumns.length >= 2) {
          const correlationMatrix = [];
          const labels = [];
          
          numericColumns.forEach((colA, i) => {
            const colAIndex = header.indexOf(colA);
            labels.push(colA);
            const row = [];
            
            numericColumns.forEach((colB, j) => {
              const colBIndex = header.indexOf(colB);
              
              // Calculate correlation coefficient
              const valuesA = limitedRows
                .map(row => parseFloat(row[colAIndex]))
                .filter(v => !isNaN(v) && isFinite(v));
              const valuesB = limitedRows
                .map(row => parseFloat(row[colBIndex]))
                .filter(v => !isNaN(v) && isFinite(v));
              
              const correlation = calculateCorrelation(valuesA, valuesB);
              row.push({
                x: colB,
                y: isNaN(correlation) ? 0 : Math.round(correlation * 100) / 100
              });
            });
            
            correlationMatrix.push({ name: colA, data: row });
          });
          
          processedData = correlationMatrix;
          categories = labels;
        } else {
          // Fallback for insufficient numeric columns
          processedData = [{ name: 'No Data', data: [{ x: 'No Data', y: 0 }] }];
          categories = ['No Data'];
        }
      } else {
        // Default processing for bar, line, area charts
        const maxCategories = 20;
        const limitedData = limitedRows.slice(0, maxCategories);
        const validData = [];
        const validCategories = [];
        
        limitedData.forEach(row => {
          const yValue = parseFloat(row[yIndex]);
          if (!isNaN(yValue) && isFinite(yValue)) {
            validCategories.push(String(row[xIndex] || 'Unknown').substring(0, 15));
            validData.push(yValue);
          }
        });
        
        if (validData.length === 0) {
          // Fallback data
          categories = ['No Data'];
          processedData = [0];
        } else {
          categories = validCategories;
          processedData = validData;
        }
      }

      // Enhanced chart configuration with better error handling
      const baseChartType = widget.chartType === 'bubble' ? 'scatter' : 
                           widget.chartType === 'histogram' ? 'column' :
                           widget.chartType === 'boxplot' ? 'boxPlot' :
                           widget.chartType === 'pie' ? 'donut' :
                           widget.chartType;

      const chartConfig = {
        options: {
          chart: { 
            id: `widget-${widget.id}`,
            type: baseChartType,
            toolbar: { show: true },
            animations: { enabled: true, speed: 400 },
            parentHeightOffset: 0,
            redrawOnParentResize: true,
            zoom: { enabled: ['line', 'scatter', 'bubble'].includes(widget.chartType) }
          },
          title: {
            text: widget.title || `${widget.yVar} vs ${widget.xVar}`,
            align: 'center',
            style: { fontSize: '12px', fontWeight: 'bold' }
          },
          subtitle: {
            text: generateInsight(widget.chartType, yType?.stats, limitedRows.length),
            align: 'center',
            style: { fontSize: '10px', color: '#666' }
          },
          xaxis: widget.chartType === 'scatter' || widget.chartType === 'bubble' ? { 
            title: { text: widget.xVar, style: { fontSize: '10px' } },
            labels: { style: { fontSize: '9px' } },
            type: 'numeric'
          } : widget.chartType === 'heatmap' ? {
            categories: categories,
            labels: { rotate: -45, style: { fontSize: '8px' } }
          } : { 
            categories: categories,
            title: { text: widget.xVar, style: { fontSize: '10px' } },
            labels: { 
              style: { fontSize: '9px' }, 
              rotate: categories.length > 10 ? -45 : 0,
              maxHeight: 60
            }
          },
          yaxis: widget.chartType === 'heatmap' ? {
            categories: categories,
            labels: { style: { fontSize: '8px' } }
          } : {
            title: { text: widget.yVar, style: { fontSize: '10px' } },
            labels: { style: { fontSize: '9px' } }
          },
          tooltip: { 
            enabled: true,
            theme: 'light',
            custom: widget.chartType === 'bubble' ? function({ series, seriesIndex, dataPointIndex, w }) {
              const data = w.config.series[seriesIndex].data[dataPointIndex];
              return `<div class="p-2 bg-white border rounded shadow">
                <strong>${w.config.series[seriesIndex].name}</strong><br/>
                ${widget.xVar}: ${data.x}<br/>
                ${widget.yVar}: ${data.y}<br/>
                Size: ${data.z?.toFixed(2)}
              </div>`;
            } : undefined
          },
          legend: { 
            show: widget.chartType !== 'heatmap', 
            position: 'bottom', 
            fontSize: '10px' 
          },
          dataLabels: { 
            enabled: widget.chartType === 'pie',
            formatter: widget.chartType === 'bubble' ? function(val, opts) {
              return opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex].z?.toFixed(1);
            } : undefined
          },
          grid: { 
            show: !['pie', 'heatmap'].includes(widget.chartType), 
            strokeDashArray: 3 
          },
          stroke: { 
            width: widget.chartType === 'line' ? 2 : 1,
            curve: widget.chartType === 'line' ? 'smooth' : 'straight'
          },
          fill: {
            type: widget.chartType === 'area' ? 'gradient' : 'solid',
            gradient: widget.chartType === 'area' ? {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.2,
            } : undefined,
          },
          plotOptions: getPlotOptions(widget.chartType),
          noData: {
            text: 'No data available',
            align: 'center',
            verticalAlign: 'middle',
            style: {
              color: '#666',
              fontSize: '14px'
            }
          }
        },
        series: widget.chartType === 'pie' ? 
          processedData : 
          widget.chartType === 'heatmap' ?
          processedData :
          widget.chartType === 'boxplot' ?
          [{ name: widget.yVar, type: 'boxPlot', data: processedData }] :
          [{ 
            name: widget.yVar, 
            data: processedData,
            type: widget.chartType === 'bubble' ? 'scatter' : undefined
          }]
      };

      // Validate series data before returning
      if (widget.chartType === 'pie') {
        if (!Array.isArray(processedData) || processedData.length === 0) {
          chartConfig.series = [1]; // Fallback
          chartConfig.options.labels = ['No Data'];
        } else {
          chartConfig.options.labels = categories;
        }
      } else if (widget.chartType === 'heatmap') {
        if (!Array.isArray(processedData) || processedData.length === 0) {
          chartConfig.series = [{ name: 'No Data', data: [{ x: 'No Data', y: 0 }] }];
        }
      } else {
        if (!Array.isArray(chartConfig.series) || chartConfig.series.length === 0 || 
            !Array.isArray(chartConfig.series[0].data) || chartConfig.series[0].data.length === 0) {
          chartConfig.series = [{ name: widget.yVar, data: [0] }];
          chartConfig.options.xaxis.categories = ['No Data'];
        }
      }

      return chartConfig;
    } catch (err) {
      console.error("Chart generation error:", err);
      // Return a safe fallback configuration
      return {
        options: {
          chart: { id: `widget-${widget.id}`, type: 'bar' },
          title: { text: 'Error Loading Chart' },
          xaxis: { categories: ['Error'] },
          noData: {
            text: 'Failed to load chart data',
            align: 'center',
            verticalAlign: 'middle'
          }
        },
        series: [{ name: 'Error', data: [0] }]
      };
    }
  }, [parsedData, widget]);

  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (widget.xVar && widget.yVar && parsedData && !chartLoading) {
      setChartLoading(true);
      setError(null);
      
      generateChart()
        .then(result => {
          if (result) {
            setChartData(result);
          } else {
            setError("Failed to generate chart");
          }
        })
        .catch(err => {
          setError("Chart generation failed");
        })
        .finally(() => {
          setChartLoading(false);
        });
    }
  }, [generateChart, widget.xVar, widget.yVar, widget.chartType, parsedData, chartLoading]);

  // Use effect to detect when widget is being auto-resized due to collisions
  useEffect(() => {
    setIsBeingResized(true);
    const timer = setTimeout(() => setIsBeingResized(false), 300);
    return () => clearTimeout(timer);
  }, [widget.width, widget.height, widget.x, widget.y]);

  return (
    <div 
      className={`border rounded-lg bg-white shadow-sm relative transition-all duration-300 ${
        isBeingResized ? 'border-orange-400 shadow-lg' : 'border-gray-200 hover:shadow-md'
      }`}
      style={{ 
        width: widget.width || 500,  // Increased from 400
        height: widget.height || 400, // Increased from 300
        minWidth: 300,
        minHeight: 250
      }}
    >
      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
        style={{ 
          clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
          zIndex: 10
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = widget.width || 500;  // Increased from 380
          const startHeight = widget.height || 400; // Increased from 320

          // Find the dashboard container - look for flex-1 container
          const dashboardContainer = document.querySelector('.flex-1.relative.bg-white') ||
                                   e.target.closest('.flex').querySelector('.flex-1');
          
          let containerWidth = window.innerWidth - 256; // Account for 256px sidebar (w-64)
          
          if (dashboardContainer) {
            const containerRect = dashboardContainer.getBoundingClientRect();
            containerWidth = containerRect.width - 32; // Account for padding
          }

          const handleMouseMove = (e) => {
            const newWidth = Math.max(250, startWidth + (e.clientX - startX));
            const newHeight = Math.max(200, startHeight + (e.clientY - startY));
            
            // Apply boundary constraints for resizing
            const widgetX = widget.x || 0;
            const maxWidth = containerWidth - widgetX;
            const constrainedWidth = Math.min(newWidth, maxWidth);
            
            // Use collision resolution for resize operations
            if (resolveCollisions && allWidgets) {
              const updatedWidget = { ...widget, width: constrainedWidth, height: newHeight };
              
              // Create a temporary widgets array for collision checking
              const tempWidgets = allWidgets.map(w => w.id === widget.id ? updatedWidget : w);
              const resolvedWidgets = resolveCollisions(updatedWidget, tempWidgets);
              
              // Find the resolved widget
              const resolvedWidget = resolvedWidgets.find(w => w.id === widget.id);
              if (resolvedWidget) {
                onUpdate(resolvedWidget);
              }
            } else {
              // Fallback to direct update
              onUpdate({ ...widget, width: constrainedWidth, height: newHeight });
            }
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        title="Resize widget"
      />

      {/* Widget Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50">
        {/* Drag Handle */}
        <div 
          className="cursor-move text-gray-400 hover:text-gray-600 mr-2 select-none px-1 py-1 rounded hover:bg-gray-200 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startXPos = widget.x || 0;
            const startYPos = widget.y || 0;

            // Find the dashboard container - look for flex-1 container
            const dashboardContainer = document.querySelector('.flex-1.relative.bg-white') ||
                                     e.target.closest('.flex').querySelector('.flex-1');
            
            let containerWidth = window.innerWidth - 256; // Account for 256px sidebar (w-64)
            
            if (dashboardContainer) {
              const containerRect = dashboardContainer.getBoundingClientRect();
              containerWidth = containerRect.width - 32; // Account for padding
            }

            const handleMouseMove = (e) => {
              const newX = startXPos + (e.clientX - startX);
              const newY = startYPos + (e.clientY - startY);
              
              // Apply boundary constraints (left and right only, let bottom expand)
              const constrainedX = Math.max(0, Math.min(newX, containerWidth - (widget.width || 500)));
              const constrainedY = Math.max(0, newY); // No upper limit for Y
              
              // Use collision resolution for drag operations
              if (resolveCollisions && allWidgets) {
                const updatedWidget = { ...widget, x: constrainedX, y: constrainedY };
                
                // Create a temporary widgets array for collision checking
                const tempWidgets = allWidgets.map(w => w.id === widget.id ? updatedWidget : w);
                const resolvedWidgets = resolveCollisions(updatedWidget, tempWidgets);
                
                // Find the resolved position for this widget
                const resolvedWidget = resolvedWidgets.find(w => w.id === widget.id);
                if (resolvedWidget) {
                  onUpdate(resolvedWidget);
                }
              } else {
                // Fallback to direct update if collision resolution isn't available
                onUpdate({ ...widget, x: constrainedX, y: constrainedY });
              }
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          title="Drag to move widget"
        >
          <div style={{ fontSize: '14px', lineHeight: '1' }}>⋮⋮</div>
        </div>
        
        <input
          type="text"
          value={widget.title || ''}
          onChange={(e) => onUpdate({ ...widget, title: e.target.value })}
          placeholder="Widget Title"
          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none"
        />
        <button
          onClick={() => onDelete(widget.id)}
          className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
          title="Delete widget"
        >
          ×
        </button>
      </div>

      {/* Widget Content */}
      <div className="p-2 h-full flex flex-col" style={{ height: (widget.height || 300) - 50 }}>
        {/* Controls Row */}
        <div className="mb-2 flex-shrink-0">
          <div className="relative">
            <select
              value={widget.chartType}
              onChange={(e) => onUpdate({ ...widget, chartType: e.target.value })}
              className="text-xs border rounded px-1 py-1 w-full pr-6 appearance-none"
              title={chartTypes.find(t => t.value === widget.chartType)?.description || ''}
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value} title={type.description}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1 text-gray-400 text-xs pointer-events-none">
              <span>⌄</span>
            </div>
          </div>
          
          {/* Chart Type Help Text */}
          {widget.chartType && (
            <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="font-medium text-blue-800 mb-1">
                {chartTypes.find(t => t.value === widget.chartType)?.icon} {chartTypes.find(t => t.value === widget.chartType)?.label}
              </div>
              <div className="text-blue-600 text-xs leading-tight">
                {chartTypes.find(t => t.value === widget.chartType)?.description}
              </div>
              <div className="text-blue-500 text-xs mt-1 font-medium">
                {getChartTypeRecommendation(widget.chartType)}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Drop Zones Panel */}
          <div className="w-24 mr-2 flex flex-col">
            <div className="text-xs font-medium mb-2 text-gray-600">Axes</div>
            <div className="space-y-2">
              <DroppableZone id={`x-axis-${widget.id}`} label="X">
                {widget.xVar && (
                  <div className="text-xs bg-blue-100 rounded px-2 py-1 relative group">
                    <button
                      onClick={() => onUpdate({ ...widget, xVar: null })}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      style={{ fontSize: '8px' }}
                    >
                      ×
                    </button>
                    {widget.xVar}
                  </div>
                )}
              </DroppableZone>
              
              <DroppableZone id={`y-axis-${widget.id}`} label="Y">
                {widget.yVar && (
                  <div className="text-xs bg-green-100 rounded px-2 py-1 relative group">
                    <button
                      onClick={() => onUpdate({ ...widget, yVar: null })}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      style={{ fontSize: '8px' }}
                    >
                      ×
                    </button>
                    {widget.yVar}
                  </div>
                )}
              </DroppableZone>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-xs text-gray-500">📊 Loading data...</div>
              </div>
            ) : chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                  <div className="text-xs text-gray-500">⚡ Generating chart...</div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-xs text-red-500 mb-1">❌ {error}</div>
                  <button
                    onClick={() => {
                      setError(null);
                      if (widget.xVar && widget.yVar) {
                        setChartLoading(true);
                        generateChart().then(setChartData).finally(() => setChartLoading(false));
                      }
                    }}
                    className="text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                  >
                    🔄 Retry
                  </button>
                </div>
              </div>
            ) : chartData && widget.xVar && widget.yVar ? (
              <div className="relative h-full flex items-center justify-center">
                <div style={{ 
                  width: '100%', 
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}>
                  <Chart
                    options={chartData.options}
                    series={chartData.series}
                    type={widget.chartType}
                    width="100%"
                    height="100%"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                📋 Drag variables from the left panel
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableZone({ id, label, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const style = {
    border: "2px dashed #ccc",
    background: isOver ? "#e0f7ff" : "#fafafa",
    padding: "12px",
    minHeight: "40px",
    borderRadius: "4px",
    marginBottom: "8px",
    fontSize: "12px",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <strong style={{ fontSize: "11px" }}>{label}</strong>
      <div style={{ marginTop: "6px" }}>{children}</div>
    </div>
  );
}

function GlobalDraggableField({ id, label, datasetName, columnType }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : "",
    cursor: "grab",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: columnType?.isNumeric ? "#eff6ff" : "#f0fdf4",
    marginBottom: "4px",
    fontSize: "13px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div style={{ fontWeight: "500", color: "#374151" }}>{label}</div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            {columnType?.isNumeric ? "📊 Numeric" : "📝 Text"} • {datasetName}
          </div>
          {columnType && (
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
              {columnType.isNumeric ? (
                <>
                  {columnType.stats ? 
                    `${columnType.stats.count} values • ${columnType.completeness?.toFixed(0)}% complete` :
                    `${columnType.uniqueValues} unique • ${columnType.completeness?.toFixed(0)}% complete`
                  }
                </>
              ) : (
                `${columnType.uniqueValues} categories • ${columnType.completeness?.toFixed(0)}% complete`
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.6 }}>
          {columnType?.isNumeric ? "📊" : "📝"}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// ----------------  MAIN DASHBOARD COMPONENT  ------------------------
// ====================================================================

export default function ProjectVisualizationDashboard() {
  const { id: projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [widgets, setWidgets] = useState([]);
  const [projectDatasets, setProjectDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextWidgetId, setNextWidgetId] = useState(1);
  const [containerHeight, setContainerHeight] = useState(800);
  const [allVariables, setAllVariables] = useState({});
  const [allColumnTypes, setAllColumnTypes] = useState({});
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);

  /** Render data summary panel */
  const renderDataSummary = () => {
    if (!projectDatasets || projectDatasets.length === 0) return null;

    // Combine all datasets for comprehensive analysis
    const allData = projectDatasets.flatMap(dataset => {
      if (!dataset.parsedData || dataset.parsedData.length < 2) return [];
      return dataset.parsedData.slice(1); // Remove header
    });

    if (allData.length === 0) return null;

    // Get column types from all datasets
    const allColumnTypes = {};
    projectDatasets.forEach(dataset => {
      if (dataset.parsedData && dataset.parsedData.length > 1) {
        const columnTypes = detectColumnTypes(dataset.parsedData);
        Object.assign(allColumnTypes, columnTypes);
      }
    });

    const numericCols = Object.entries(allColumnTypes).filter(([_, type]) => type.isNumeric);
    const categoricalCols = Object.entries(allColumnTypes).filter(([_, type]) => !type.isNumeric);

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Dataset Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{projectDatasets.length}</div>
            <div className="text-sm text-gray-600">Datasets</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-gray-600">{allData.length}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">{numericCols.length}</div>
            <div className="text-sm text-gray-600">Numeric Columns</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">{categoricalCols.length}</div>
            <div className="text-sm text-gray-600">Categorical Columns</div>
          </div>
        </div>

        {numericCols.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-gray-700">Numeric Column Statistics</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Column</th>
                    <th className="px-3 py-2 text-left">Mean</th>
                    <th className="px-3 py-2 text-left">Median</th>
                    <th className="px-3 py-2 text-left">Range</th>
                    <th className="px-3 py-2 text-left">Completeness</th>
                  </tr>
                </thead>
                <tbody>
                  {numericCols.slice(0, 10).map(([col, type]) => (
                    <tr key={col} className="border-t">
                      <td className="px-3 py-2 font-medium">{col}</td>
                      <td className="px-3 py-2">{type.stats?.mean?.toFixed(2) || 'N/A'}</td>
                      <td className="px-3 py-2">{type.stats?.median?.toFixed(2) || 'N/A'}</td>
                      <td className="px-3 py-2">
                        {type.stats ? `${type.stats.min?.toFixed(1)} - ${type.stats.max?.toFixed(1)}` : 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${type.completeness}%` }}
                            />
                          </div>
                          <span className="text-xs">{type.completeness?.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">Recommended Visualizations</h4>
            <div className="space-y-2">
              {numericCols.length >= 2 && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Scatter plot for correlation analysis
                </div>
              )}
              {numericCols.length >= 1 && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Histogram for distribution analysis
                </div>
              )}
              {categoricalCols.length >= 1 && numericCols.length >= 1 && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Bar chart for category comparison
                </div>
              )}
              {numericCols.length >= 3 && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Heatmap for correlation matrix
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">Data Quality Insights</h4>
            <div className="space-y-2">
              {Object.entries(allColumnTypes).some(([_, type]) => type.completeness < 90) && (
                <div className="flex items-center text-sm text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                  Some columns have missing values
                </div>
              )}
              {numericCols.some(([_, type]) => type.uniqueValues / allData.length < 0.1) && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Some numeric columns may be categorical
                </div>
              )}
              {categoricalCols.some(([_, type]) => type.uniqueValues > 50) && (
                <div className="flex items-center text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  High cardinality categories detected
                </div>
              )}
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Dataset ready for visualization
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const [projectData, setProjectData] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ----- LOAD ALL VARIABLES FROM DATASETS -----
  const loadAllVariables = async (datasets) => {
    const variables = {};
    const columnTypes = {};
    
    for (const dataset of datasets) {
      try {
        const response = await getDatasetFile(dataset.id);
        const csvText = await response.Body.text();
        const rows = parseCSV(csvText);
        const samplingResult = sampleData(rows, 5000, 2000);
        
        if (samplingResult.data.length > 0) {
          const columns = samplingResult.data[0];
          const types = detectColumnTypes(samplingResult.data);
          
          variables[dataset.id] = {
            datasetName: dataset.name,
            columns: columns
          };
          columnTypes[dataset.id] = types;
        }
      } catch (err) {
        console.error(`Failed to load variables for dataset ${dataset.name}:`, err);
      }
    }
    
    setAllVariables(variables);
    setAllColumnTypes(columnTypes);
  };

  // ----- NAVIGATION -----
  const returnToProject = useCallback(() => {
    // Add a timestamp to force refresh when returning to project
    navigate(`/projects/${projectId}?refresh=${Date.now()}`);
  }, [navigate, projectId]);

  // ----- SAVE DASHBOARD -----
  const saveDashboard = useCallback(async () => {
    if (!projectData) return;
    
    setSaving(true);
    try {
      const dashboardData = {
        widgets: widgets.map(widget => ({
          id: widget.id,
          title: widget.title,
          datasetId: widget.datasetId,
          xVar: widget.xVar,
          yVar: widget.yVar,
          chartType: widget.chartType,
          width: widget.width,
          height: widget.height,
          x: widget.x,
          y: widget.y
        })),
        nextWidgetId,
        containerHeight,
        lastModified: new Date().toISOString()
      };

      console.log('🔄 Saving dashboard data:', dashboardData);

      const updatedProject = {
        ...projectData,
        dashboardConfig: dashboardData
      };

      console.log('🔄 Updating project with dashboard config:', updatedProject);

      await updateProject(projectId, updatedProject);
      setProjectData(updatedProject);
      setLastSaved(new Date());
      
      console.log('✅ Dashboard saved successfully to S3');
      
      // Return to project page after save
      returnToProject();
    } catch (err) {
      console.error('❌ Failed to save dashboard:', err);
      setError(`Failed to save dashboard: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [projectData, widgets, nextWidgetId, containerHeight, projectId, returnToProject]);

  // ----- EXPORT DASHBOARD -----
  const exportDashboardAsImage = useCallback(async () => {
    if (widgets.length === 0) {
      setError("No widgets to export. Please add some visualizations first.");
      return;
    }

    setExporting(true);
    try {
      // Use html2canvas to capture the dashboard in user's layout
      const { default: html2canvas } = await import('html2canvas');
      
      // Find the dashboard container (right side with charts)
      const dashboardContainer = document.querySelector('.flex-1.relative.bg-white');
      if (!dashboardContainer) {
        throw new Error('Dashboard container not found');
      }

      // Create a temporary container preserving the user's layout
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'relative';
      exportContainer.style.background = '#ffffff'; // Clean white background
      exportContainer.style.padding = '20px'; // Add some padding around the entire layout
      
      // Calculate the exact bounding box of all widgets to preserve layout
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      widgets.forEach(widget => {
        const x = widget.x || 0;
        const y = widget.y || 0;
        const width = widget.width || 500;
        const height = widget.height || 400;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });
      
      // Set container size to match the user's layout exactly
      const containerWidth = maxX - minX + 40; // Add padding
      const containerHeight = maxY - minY + 40;
      
      exportContainer.style.width = containerWidth + 'px';
      exportContainer.style.height = containerHeight + 'px';

      // Create clean chart widgets in their exact positions for ALL widgets
      widgets.forEach(widget => {
        // Only export widgets that have both X and Y variables configured
        if (widget && widget.xVar && widget.yVar) {
          // Find the corresponding DOM element for this widget
          const widgetSelector = `[data-widget-id="${widget.id}"]`;
          let widgetEl = dashboardContainer.querySelector(widgetSelector);
          
          // Fallback: if data attribute isn't found, try to find by position
          if (!widgetEl) {
            const widgetElements = dashboardContainer.querySelectorAll('.absolute');
            widgetElements.forEach(el => {
              const style = el.style;
              const elLeft = parseInt(style.left) || 0;
              const elTop = parseInt(style.top) || 0;
              if (Math.abs(elLeft - (widget.x || 0)) < 5 && Math.abs(elTop - (widget.y || 0)) < 5) {
                widgetEl = el;
              }
            });
          }
          
          // Create a clean chart container with minimal styling
          const cleanChartContainer = document.createElement('div');
          cleanChartContainer.style.position = 'absolute';
          cleanChartContainer.style.left = ((widget.x || 0) - minX + 20) + 'px';
          cleanChartContainer.style.top = ((widget.y || 0) - minY + 20) + 'px';
          cleanChartContainer.style.width = (widget.width || 500) + 'px';
          cleanChartContainer.style.height = (widget.height || 400) + 'px';
          cleanChartContainer.style.background = '#ffffff';
          cleanChartContainer.style.border = '1px solid #e5e7eb';
          cleanChartContainer.style.borderRadius = '8px';
          cleanChartContainer.style.padding = '16px';
          cleanChartContainer.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          
          // Add title if it exists
          if (widget.title) {
            const titleElement = document.createElement('div');
            titleElement.style.fontSize = '16px';
            titleElement.style.fontWeight = '600';
            titleElement.style.color = '#374151';
            titleElement.style.marginBottom = '12px';
            titleElement.style.textAlign = 'center';
            titleElement.textContent = widget.title;
            cleanChartContainer.appendChild(titleElement);
          }
          
          // Find and clone the actual chart from the widget element
          if (widgetEl) {
            const chartArea = widgetEl.querySelector('.flex-1 > .flex-1');
            if (chartArea) {
              const clonedChart = chartArea.cloneNode(true);
              
              // Calculate chart area height (subtract title space)
              const chartHeight = (widget.height || 400) - 32 - (widget.title ? 40 : 0);
              
              clonedChart.style.width = '100%';
              clonedChart.style.height = chartHeight + 'px';
              clonedChart.style.display = 'flex';
              clonedChart.style.alignItems = 'center';
              clonedChart.style.justifyContent = 'center';
              
              cleanChartContainer.appendChild(clonedChart);
            }
          } else {
            // Fallback: create a placeholder if we couldn't find the DOM element
            const placeholder = document.createElement('div');
            placeholder.style.width = '100%';
            placeholder.style.height = ((widget.height || 400) - 32 - (widget.title ? 40 : 0)) + 'px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = '#6b7280';
            placeholder.style.fontSize = '14px';
            placeholder.textContent = `${widget.yVar} vs ${widget.xVar} (${widget.chartType})`;
            cleanChartContainer.appendChild(placeholder);
          }
          
          exportContainer.appendChild(cleanChartContainer);
        }
      });

      // Temporarily add to document for rendering
      document.body.appendChild(exportContainer);
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';

      // Wait for charts to render properly
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Capture the image with html2canvas
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#ffffff', // Clean white background
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all charts are visible in the clone
          const chartElements = clonedDoc.querySelectorAll('.apexcharts-canvas');
          chartElements.forEach(chart => {
            chart.style.opacity = '1';
            chart.style.visibility = 'visible';
          });
        }
      });

      // Clean up
      document.body.removeChild(exportContainer);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-layout-${projectData?.title || 'visualization'}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ Dashboard layout exported (preserving user layout, clean presentation)');
      }, 'image/png', 0.95);
      
    } catch (err) {
      console.error('❌ Failed to export charts:', err);
      
      // Fallback to simple canvas method if html2canvas fails
      console.log('Falling back to canvas-based export...');
      try {
        // Calculate the bounding box of all widgets
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        widgets.forEach(widget => {
          const x = widget.x || 0;
          const y = widget.y || 0;
          const width = widget.width || 500;
          const height = widget.height || 400;
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + width);
          maxY = Math.max(maxY, y + height);
        });
        
        const padding = 20;
        const canvasWidth = maxX - minX + (padding * 2);
        const canvasHeight = maxY - minY + (padding * 2);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        ctx.scale(dpr, dpr);
        
        // Transparent background - don't fill with white
        
        // Draw only the widgets
        widgets.forEach((widget) => {
          const x = (widget.x || 0) - minX + padding;
          const y = (widget.y || 0) - minY + padding;
          const width = widget.width || 500;
          const height = widget.height || 400;
          
          // Draw widget container
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, width, height);
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, width, height);
          
          // Draw widget header
          ctx.fillStyle = '#f9fafb';
          ctx.fillRect(x, y, width, 40);
          ctx.strokeStyle = '#e5e7eb';
          ctx.strokeRect(x, y, width, 40);
          
          // Draw widget title
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
          ctx.fillText(widget.title || `Visualization ${widget.id}`, x + 10, y + 25);
          
          // Draw chart placeholder
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(x + 10, y + 50, width - 20, height - 60);
          
          if (widget.xVar && widget.yVar) {
            ctx.fillStyle = '#374151';
            ctx.font = '12px system-ui, -apple-system, sans-serif';
            ctx.fillText(`${widget.yVar} vs ${widget.xVar} (${widget.chartType})`, x + 10, y + 75);
          }
        });
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `charts-fallback-${projectData?.title || 'visualization'}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png', 0.95);
        
      } catch (fallbackErr) {
        setError(`Failed to export charts: ${err.message}`);
      }
    } finally {
      setExporting(false);
    }
  }, [widgets, projectData]);

  // ----- AUTO-SAVE DISABLED - Now using explicit save and exit -----
  // useEffect(() => {
  //   if (projectData) {
  //     const timeoutId = setTimeout(() => {
  //       console.log('🔄 Auto-save triggered with widgets:', widgets.length);
  //       saveDashboard();
  //     }, 2000); // Auto-save 2 seconds after changes

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [widgets, nextWidgetId, containerHeight, projectData, saveDashboard]);

  // ----- KEYBOARD SHORTCUTS -----
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save and exit
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDashboard();
      }
      // Ctrl+E or Cmd+E to export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportDashboardAsImage();
      }
      // Escape to return to project
      if (e.key === 'Escape') {
        returnToProject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [exportDashboardAsImage, returnToProject, saveDashboard]);

  // ----- FETCH PROJECT DATA -----
  useEffect(() => {
    async function fetchProjectData() {
      setLoading(true);
      setError(null);
      try {
        let filtered = location.state?.projectDatasets;
        let project;
        
        if (!filtered) {
          const [projectResult, datasets] = await Promise.all([
            getProject(projectId),
            listDatasets(),
          ]);
          project = projectResult;
          
          if (!project.selectedDatasets || project.selectedDatasets.length === 0) {
            setError("No datasets linked to this project.");
            setLoading(false);
            return;
          }
          filtered = datasets.filter((d) =>
            project.selectedDatasets.includes(d.id)
          );
        } else {
          // If datasets came from state, still need to fetch project for dashboard config
          project = await getProject(projectId);
        }
        
        setProjectData(project);
        setProjectDatasets(filtered);
        
        // Load saved dashboard configuration if it exists
        if (project.dashboardConfig) {
          const config = project.dashboardConfig;
          setWidgets(config.widgets || []);
          setNextWidgetId(config.nextWidgetId || 1);
          setContainerHeight(config.containerHeight || 800);
          setLastSaved(config.lastModified ? new Date(config.lastModified) : null);
        }
        
        // Load all variables from all datasets
        await loadAllVariables(filtered);
        
        console.log(`Dashboard loaded with ${filtered.length} datasets`);
      } catch (err) {
        console.error("❌ Failed to load project datasets:", err);
        setError(`Failed to load project data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [projectId, location.state]);

  // ----- COLLISION DETECTION AND RESOLUTION -----
  const checkCollisions = (updatedWidget, allWidgets) => {
    const collisions = [];
    const widgetRect = {
      left: updatedWidget.x || 0,
      top: updatedWidget.y || 0,
      right: (updatedWidget.x || 0) + (updatedWidget.width || 500),
      bottom: (updatedWidget.y || 0) + (updatedWidget.height || 400)
    };

    allWidgets.forEach(widget => {
      if (widget.id === updatedWidget.id) return;

      const otherRect = {
        left: widget.x || 0,
        top: widget.y || 0,
        right: (widget.x || 0) + (widget.width || 500),
        bottom: (widget.y || 0) + (widget.height || 400)
      };

      // Check if rectangles overlap (with 1px buffer to prevent edge cases)
      if (widgetRect.left < otherRect.right - 1 &&
          widgetRect.right > otherRect.left + 1 &&
          widgetRect.top < otherRect.bottom - 1 &&
          widgetRect.bottom > otherRect.top + 1) {
        collisions.push(widget);
      }
    });

    return collisions;
  };

  const resolveCollisions = (updatedWidget, allWidgets) => {
    let resolvedWidgets = [...allWidgets];
    let collisions = checkCollisions(updatedWidget, resolvedWidgets);
    let iterationsLeft = 10; // Prevent infinite loops
    
    // Keep resolving until no more collisions or max iterations reached
    while (collisions.length > 0 && iterationsLeft > 0) {
      iterationsLeft--;
      
      collisions.forEach(collidingWidget => {
        const updatedRect = {
          left: updatedWidget.x || 0,
          top: updatedWidget.y || 0,
          right: (updatedWidget.x || 0) + (updatedWidget.width || 500),
          bottom: (updatedWidget.y || 0) + (updatedWidget.height || 400)
        };

        const collidingRect = {
          left: collidingWidget.x || 0,
          top: collidingWidget.y || 0,
          right: (collidingWidget.x || 0) + (collidingWidget.width || 500),
          bottom: (collidingWidget.y || 0) + (collidingWidget.height || 400)
        };

        // Calculate overlap dimensions
        const overlapLeft = Math.max(updatedRect.left, collidingRect.left);
        const overlapRight = Math.min(updatedRect.right, collidingRect.right);
        const overlapTop = Math.max(updatedRect.top, collidingRect.top);
        const overlapBottom = Math.min(updatedRect.bottom, collidingRect.bottom);

        const overlapWidth = overlapRight - overlapLeft;
        const overlapHeight = overlapBottom - overlapTop;

        const widgetIndex = resolvedWidgets.findIndex(w => w.id === collidingWidget.id);
        if (widgetIndex === -1) return;

        // Get available container width for boundary checking
        const containerWidth = window.innerWidth - 256 - 32; // Sidebar + padding
        
        // Strategy 1: Try to move the colliding widget away from the updated widget
        let resolvedWidget = null;
        
        if (overlapWidth < overlapHeight) {
          // Horizontal displacement is smaller - try moving horizontally first
          if (updatedRect.left < collidingRect.left) {
            // Updated widget is to the left - push colliding widget right
            const newX = updatedRect.right + 5; // 5px gap
            if (newX + (collidingWidget.width || 500) <= containerWidth) {
              resolvedWidget = { ...collidingWidget, x: newX };
            }
          } else {
            // Updated widget is to the right - push colliding widget left
            const newX = updatedRect.left - (collidingWidget.width || 500) - 5;
            if (newX >= 0) {
              resolvedWidget = { ...collidingWidget, x: newX };
            }
          }
        } else {
          // Vertical displacement is smaller - try moving vertically first
          if (updatedRect.top < collidingRect.top) {
            // Updated widget is above - push colliding widget down
            const newY = updatedRect.bottom + 5; // 5px gap
            resolvedWidget = { ...collidingWidget, y: newY };
          } else {
            // Updated widget is below - push colliding widget up
            const newY = updatedRect.top - (collidingWidget.height || 400) - 5;
            if (newY >= 0) {
              resolvedWidget = { ...collidingWidget, y: newY };
            }
          }
        }
        
        // Strategy 2: If moving didn't work, try resizing
        if (!resolvedWidget) {
          if (overlapWidth > overlapHeight) {
            // Horizontal overlap is larger - resize horizontally
            if (updatedRect.left < collidingRect.left) {
              // Updated widget is to the left - shrink colliding widget from left
              const newWidth = Math.max(300, collidingRect.right - updatedRect.right - 5);
              const newX = updatedRect.right + 5;
              if (newX + newWidth <= containerWidth) {
                resolvedWidget = { ...collidingWidget, x: newX, width: newWidth };
              }
            } else {
              // Updated widget is to the right - shrink colliding widget from right
              const newWidth = Math.max(300, updatedRect.left - collidingRect.left - 5);
              if (newWidth >= 300) {
                resolvedWidget = { ...collidingWidget, width: newWidth };
              }
            }
          } else {
            // Vertical overlap is larger - resize vertically
            if (updatedRect.top < collidingRect.top) {
              // Updated widget is above - shrink colliding widget from top
              const newHeight = Math.max(250, collidingRect.bottom - updatedRect.bottom - 5);
              const newY = updatedRect.bottom + 5;
              resolvedWidget = { ...collidingWidget, y: newY, height: newHeight };
            } else {
              // Updated widget is below - shrink colliding widget from bottom
              const newHeight = Math.max(250, updatedRect.top - collidingRect.top - 5);
              if (newHeight >= 250) {
                resolvedWidget = { ...collidingWidget, height: newHeight };
              }
            }
          }
        }
        
        // Strategy 3: Last resort - find a completely new position
        if (!resolvedWidget) {
          // Find the first available position in a grid
          const margin = 20;
          const widgetWidth = collidingWidget.width || 500;
          const widgetHeight = collidingWidget.height || 400;
          
          for (let y = margin; y < 2000; y += widgetHeight + margin) {
            for (let x = margin; x < containerWidth - widgetWidth; x += widgetWidth + margin) {
              const testRect = {
                left: x,
                top: y,
                right: x + widgetWidth,
                bottom: y + widgetHeight
              };
              
              // Check if this position conflicts with any other widget
              const hasConflict = resolvedWidgets.some(w => {
                if (w.id === collidingWidget.id || w.id === updatedWidget.id) return false;
                
                const wRect = {
                  left: w.x || 0,
                  top: w.y || 0,
                  right: (w.x || 0) + (w.width || 500),
                  bottom: (w.y || 0) + (w.height || 400)
                };
                
                return testRect.left < wRect.right &&
                       testRect.right > wRect.left &&
                       testRect.top < wRect.bottom &&
                       testRect.bottom > wRect.top;
              });
              
              // Also check against the updated widget
              const conflictsWithUpdated = testRect.left < updatedRect.right &&
                                         testRect.right > updatedRect.left &&
                                         testRect.top < updatedRect.bottom &&
                                         testRect.bottom > updatedRect.top;
              
              if (!hasConflict && !conflictsWithUpdated) {
                resolvedWidget = { ...collidingWidget, x, y };
                break;
              }
            }
            if (resolvedWidget) break;
          }
        }
        
        // Apply the resolution
        if (resolvedWidget) {
          resolvedWidgets[widgetIndex] = resolvedWidget;
        }
      });
      
      // Check for new collisions after resolution
      collisions = checkCollisions(updatedWidget, resolvedWidgets);
    }

    return resolvedWidgets;
  };

  // ----- GLOBAL DRAG HANDLER -----
  const handleGlobalDragStart = ({ active }) => {
    const draggedVariable = active.id;
    const [datasetId, variableName] = draggedVariable.split('::');
    
    // Find the variable info for the drag overlay
    const datasetInfo = allVariables[datasetId];
    const columnType = allColumnTypes[datasetId]?.[variableName];
    
    if (datasetInfo) {
      setActiveDragItem({
        id: draggedVariable,
        label: variableName,
        datasetName: datasetInfo.datasetName,
        columnType: columnType
      });
    }
  };

  const handleGlobalDragEnd = ({ over, active }) => {
    setActiveDragItem(null); // Clear the active drag item
    
    if (!over) return;
    
    // Extract widget ID and drop zone type from the drop target
    const dropId = over.id;
    const [dropType, widgetId] = dropId.split('-').slice(-2); // e.g., "x-axis-1" -> ["axis", "1"]
    
    if (dropType === 'axis') {
      const targetWidgetId = parseInt(widgetId);
      const draggedVariable = active.id;
      const [datasetId, variableName] = draggedVariable.split('::');
      
      // Update the appropriate widget
      const updatedWidgets = widgets.map(widget => {
        if (widget.id === targetWidgetId) {
          const updates = { ...widget };
          if (dropId.includes('x-axis')) {
            updates.xVar = variableName;
            updates.datasetId = datasetId; // Ensure dataset is set
          } else if (dropId.includes('y-axis')) {
            updates.yVar = variableName;
            updates.datasetId = datasetId; // Ensure dataset is set
          }
          return updates;
        }
        return widget;
      });
      
      setWidgets(updatedWidgets);
    }
  };

  // ----- ADD / UPDATE / DELETE WIDGETS -----
  const findNonOverlappingPosition = (width = 500, height = 400, existingWidgets) => {
    // Calculate available width based on viewport minus sidebar
    const containerWidth = window.innerWidth - 256 - 32; // 256px sidebar + 32px padding
    const margin = 20;
    
    // Try positions in a grid pattern
    for (let y = margin; y < 2000; y += height + margin) {
      for (let x = margin; x < containerWidth - width; x += width + margin) {
        const testRect = {
          left: x,
          top: y,
          right: x + width,
          bottom: y + height
        };
        
        // Check if this position overlaps with any existing widget
        const hasOverlap = existingWidgets.some(widget => {
          const widgetRect = {
            left: widget.x || 0,
            top: widget.y || 0,
            right: (widget.x || 0) + (widget.width || 500),
            bottom: (widget.y || 0) + (widget.height || 400)
          };
          
          // Add 5px buffer to prevent tight spacing
          return testRect.left < widgetRect.right + 5 &&
                 testRect.right > widgetRect.left - 5 &&
                 testRect.top < widgetRect.bottom + 5 &&
                 testRect.bottom > widgetRect.top - 5;
        });
        
        if (!hasOverlap) {
          return { x, y };
        }
      }
    }
    
    // Fallback to staggered position if no free space found
    const widgetCount = existingWidgets.length;
    return {
      x: 20 + (widgetCount * 40),
      y: 20 + (widgetCount * 40)
    };
  };

  const addWidget = (sizeOptions = {}) => {
    const widgetWidth = sizeOptions.width || 500;  // Increased from 380
    const widgetHeight = sizeOptions.height || 400; // Increased from 320
    
    // Find a non-overlapping position for the new widget
    const position = findNonOverlappingPosition(widgetWidth, widgetHeight, widgets);
    
    const newWidget = {
      id: nextWidgetId,
      title: `Visualization ${nextWidgetId}`,
      datasetId: null,
      xVar: null,
      yVar: null,
      chartType: "bar",
      width: widgetWidth,
      height: widgetHeight,
      x: position.x,
      y: position.y,
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    setNextWidgetId(nextWidgetId + 1);
    
    // Update container height based on new widget position
    const maxBottom = Math.max(
      800, // Minimum height
      ...updatedWidgets.map(w => (w.y || 0) + (w.height || 400) + 40) // Add padding
    );
    setContainerHeight(maxBottom);
  };

  const updateWidget = (updatedWidget) => {
    // First update the widget in the array
    const allWidgets = widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));
    
    // Resolve any collisions caused by this update
    const resolvedWidgets = resolveCollisions(updatedWidget, allWidgets);
    
    setWidgets(resolvedWidgets);
    
    // Calculate required container height based on widget positions
    const maxBottom = Math.max(
      800, // Minimum height
      ...resolvedWidgets.map(w => (w.y || 0) + (w.height || 400) + 40) // Add padding
    );
    setContainerHeight(maxBottom);
  };

  const deleteWidget = (widgetId) => {
    const updatedWidgets = widgets.filter((w) => w.id !== widgetId);
    setWidgets(updatedWidgets);
    
    // Update container height after deletion
    if (updatedWidgets.length > 0) {
      const maxBottom = Math.max(
        800, // Minimum height
        ...updatedWidgets.map(w => (w.y || 0) + (w.height || 400) + 40) // Add padding
      );
      setContainerHeight(maxBottom);
    } else {
      setContainerHeight(800); // Reset to minimum when no widgets
    }
  };

  // ----- RENDER -----
  if (loading) {
    return (
      <div className="p-6 bg-white rounded shadow min-h-screen flex items-center justify-center">
        <div className="text-blue-600">Loading project data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded shadow min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex items-center justify-between bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={returnToProject}
            className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
            title="Return to project"
          >
            ← Back to Project
          </button>
          <div className="text-gray-300">|</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📊 {projectData?.title || 'Project'} Dashboard
            </h1>
            {lastSaved && (
              <p className="text-xs text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()} • Ctrl+S to save and exit • Ctrl+E to export • Esc to return
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportDashboardAsImage}
            disabled={exporting || widgets.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              exporting || widgets.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
            title={widgets.length === 0 ? "Add widgets to enable export" : "Export dashboard as PNG image (Ctrl+E)"}
          >
            {exporting ? '📸 Exporting...' : '📸 Export Image'}
          </button>
          <button
            onClick={saveDashboard}
            disabled={saving || widgets.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              saving || widgets.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title={widgets.length === 0 ? "Add widgets to enable save" : "Save dashboard and return to project (Ctrl+S)"}
          >
            {saving ? '💾 Saving...' : '💾 Save and Exit'}
          </button>
          <button
            onClick={addWidget}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Add Widget
          </button>
        </div>
      </div>

      {/* Data Summary Panel */}
      <div className="px-6">
        {renderDataSummary()}
      </div>

      {/* Visualization Guide Panel */}
      <div className="px-6 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-t-lg"
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800">Chart Selection Guide</h3>
            </div>
            <div className={`transition-transform duration-300 text-gray-600 ${isGuideExpanded ? 'rotate-180' : ''}`}>
              ⌄
            </div>
          </div>
          
          <div className={`transition-all duration-300 overflow-hidden ${isGuideExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="font-semibold text-blue-600 mb-2 flex items-center">
                    <span className="mr-2">📊</span> Numeric vs Numeric
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Scatter Plot:</strong> Show relationships & correlations</li>
                    <li>• <strong>Bubble Chart:</strong> 3-dimensional data comparison</li>
                    <li>• <strong>Line Chart:</strong> Trends over time/sequence</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center">
                    <span className="mr-2">📝</span> Category vs Numeric
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Bar Chart:</strong> Compare values across categories</li>
                    <li>• <strong>Pie Chart:</strong> Show parts of a whole (≤8 categories)</li>
                    <li>• <strong>Area Chart:</strong> Cumulative values over categories</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="font-semibold text-purple-600 mb-2 flex items-center">
                    <span className="mr-2">🔬</span> Data Distribution
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Histogram:</strong> Show data distribution patterns</li>
                    <li>• <strong>Box Plot:</strong> Visualize quartiles & outliers</li>
                    <li>• <strong>Heatmap:</strong> Correlation matrix (multiple numeric)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <div className="text-amber-600 mr-2 mt-0.5">💡</div>
                  <div className="text-sm text-amber-800">
                    <strong>Pro Tips:</strong>
                    <span className="ml-2">Use scatter plots for correlation analysis • Choose bar charts for category comparisons • Try histograms to understand data distribution • Heatmaps work best with 3+ numeric variables</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DndContext onDragStart={handleGlobalDragStart} onDragEnd={handleGlobalDragEnd}>
        <div className="flex">
          {/* Variables Panel */}
          <div className="w-64 bg-white border-r border-gray-200 p-4 h-screen sticky top-0 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">📋 Variables</h3>
              <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="font-medium mb-1 text-gray-700">Drag & Drop Guide:</div>
                <div className="flex items-center mb-1">
                  <span className="w-3 h-3 bg-blue-100 rounded mr-2 flex items-center justify-center text-xs">📊</span>
                  <span className="text-gray-600">Numeric - Best for Y-axis, measurements</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-100 rounded mr-2 flex items-center justify-center text-xs">📝</span>
                  <span className="text-gray-600">Text - Best for X-axis, categories</span>
                </div>
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {Object.entries(allVariables).map(([datasetId, datasetInfo]) => (
                <div key={datasetId} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">{datasetInfo.datasetName}</h4>
                  <div className="space-y-1">
                    {datasetInfo.columns.map(column => (
                      <GlobalDraggableField
                        key={`${datasetId}::${column}`}
                        id={`${datasetId}::${column}`}
                        label={column}
                        datasetName={datasetInfo.datasetName}
                        columnType={allColumnTypes[datasetId]?.[column]}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(allVariables).length === 0 && !loading && (
                <div className="text-center text-gray-500 text-sm py-8">
                  No variables available
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Container */}
          <div 
            className="flex-1 relative bg-white p-4" 
            style={{ 
              minHeight: `${containerHeight}px`,
              backgroundImage: `
                linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          >
            {/* Saving Indicator */}
            {saving && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md z-50 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm font-medium">Saving dashboard...</span>
              </div>
            )}

            {/* Export Indicator */}
            {exporting && (
              <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-2 rounded-lg shadow-md z-50 flex items-center space-x-2">
                <div className="animate-pulse text-white">📸</div>
                <span className="text-sm font-medium">Exporting dashboard...</span>
              </div>
            )}
            
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="absolute"
                data-widget-id={widget.id}
                style={{
                  left: widget.x || 0,
                  top: widget.y || 0,
                  zIndex: 1
                }}
              >
                <VisualizationWidget
                  widget={widget}
                  onUpdate={updateWidget}
                  onDelete={deleteWidget}
                  datasets={projectDatasets}
                  allWidgets={widgets}
                  resolveCollisions={resolveCollisions}
                />
              </div>
            ))}

            {widgets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Create Your First Widget
                </h3>
                <p className="text-gray-600 mb-4 text-center max-w-md">
                  Add visualization widgets and drag variables from the left panel to create charts.
                  Choose chart types based on your data: numeric variables work best for Y-axis, 
                  categorical data for X-axis grouping.
                </p>
                <button
                  onClick={addWidget}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  + Add Widget
                </button>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800 max-w-md">
                  <div className="font-medium mb-1">Quick Start Guide:</div>
                  <div>1. Click "Add Widget" above</div>
                  <div>2. Drag variables from left panel to X and Y axes</div>
                  <div>3. Select appropriate chart type from dropdown</div>
                  <div>4. Use Ctrl+S to save or Ctrl+E to export</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Drag Overlay - shows the dragged item following the cursor */}
        <DragOverlay>
          {activeDragItem ? (
            <div style={{
              cursor: "grabbing",
              padding: "8px 10px",
              border: "2px solid #3b82f6",
              borderRadius: "6px",
              background: activeDragItem.columnType?.isNumeric ? "#eff6ff" : "#f0fdf4",
              fontSize: "13px",
              boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.3)",
              transform: "rotate(2deg)",
              opacity: 0.9
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: "600", color: "#374151" }}>{activeDragItem.label}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    {activeDragItem.columnType?.isNumeric ? "📊 Numeric" : "📝 Text"} • {activeDragItem.datasetName}
                  </div>
                </div>
                <div style={{ fontSize: "16px", marginLeft: "8px" }}>
                  {activeDragItem.columnType?.isNumeric ? "📊" : "📝"}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

    </div>
  );
}