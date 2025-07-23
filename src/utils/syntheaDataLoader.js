import { Storage } from 'aws-amplify';
import Papa from 'papaparse';

/**
 * React-compatible async function to load and parse CSV files from S3
 * Handles the S3 path: "raw/Synthea/merged_csv/" 
 * Uses protected access level with Amplify auth
 */

// List all CSV files in the specified S3 prefix
export const listSyntheaCsvFiles = async () => {
  try {
    console.log('Listing CSV files from raw/Synthea/merged_csv/...');

    const files = await Storage.list('raw/Synthea/merged_csv/', {
      level: 'protected',
      pageSize: 100
    });

    // Filter for CSV files only
    const csvFiles = files.filter(file =>
      file.size > 0 &&
      file.key.endsWith('.csv')
    );

    console.log(`Found ${csvFiles.length} CSV files:`, csvFiles);
    return csvFiles;
  } catch (error) {
    console.error('Error listing CSV files:', error);
    throw new Error(`Failed to list CSV files: ${error.message}`);
  }
};

// Fetch and parse a specific CSV file with PapaParse
export const fetchAndParseCsv = async (fileKey) => {
  try {
    console.log(`Fetching CSV file: ${fileKey}`);

    // Download the file content from S3
    const result = await Storage.get(fileKey, {
      level: 'protected',
      download: true
    });

    // Convert the file content to text
    const csvContent = await result.Body.text();
    console.log(`Downloaded ${csvContent.length} characters from ${fileKey}`);

    // Parse CSV with PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true, // First row contains column headers
        skipEmptyLines: true, // Skip empty rows
        transform: (value, field) => {
          // Clean and transform data as needed
          if (value === '' || value === 'null' || value === 'NULL') {
            return null;
          }
          return value.trim();
        },
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows from ${fileKey}`);
          console.log('Column headers:', results.meta.fields);

          if (results.errors.length > 0) {
            console.warn('Parsing warnings:', results.errors);
          }

          resolve({
            data: results.data,
            meta: results.meta,
            errors: results.errors,
            fileName: fileKey.split('/').pop(),
            totalRows: results.data.length,
            columns: results.meta.fields
          });
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching/parsing CSV file ${fileKey}:`, error);
    throw new Error(`Failed to fetch and parse CSV: ${error.message}`);
  }
};

// Main function: List files, fetch first CSV, and parse it
export const loadSyntheaDatasets = async () => {
  try {
    console.log('🔄 Loading Synthea datasets from S3...');

    // Step 1: List all CSV files in the directory
    const csvFiles = await listSyntheaCsvFiles();

    if (csvFiles.length === 0) {
      throw new Error('No CSV files found in raw/Synthea/merged_csv/ directory');
    }

    // Step 2: Fetch and parse the first CSV file
    const firstFile = csvFiles[0];
    console.log(`📊 Processing first file: ${firstFile.key}`);

    const parsedData = await fetchAndParseCsv(firstFile.key);

    console.log('✅ Successfully loaded and parsed Synthea dataset:', {
      fileName: parsedData.fileName,
      totalRows: parsedData.totalRows,
      columns: parsedData.columns.length,
      sampleData: parsedData.data.slice(0, 3) // First 3 rows for preview
    });

    return {
      success: true,
      fileList: csvFiles,
      parsedData: parsedData,
      summary: {
        totalFiles: csvFiles.length,
        processedFile: parsedData.fileName,
        rowCount: parsedData.totalRows,
        columnCount: parsedData.columns.length
      }
    };

  } catch (error) {
    console.error('❌ Failed to load Synthea datasets:', error);
    return {
      success: false,
      error: error.message,
      fileList: [],
      parsedData: null
    };
  }
};

// Helper function to load and parse multiple CSV files
export const loadMultipleSyntheaCsvFiles = async (maxFiles = 3) => {
  try {
    const csvFiles = await listSyntheaCsvFiles();
    const filesToProcess = csvFiles.slice(0, maxFiles);

    console.log(`Processing ${filesToProcess.length} CSV files...`);

    const results = await Promise.all(
      filesToProcess.map(async (file) => {
        try {
          return await fetchAndParseCsv(file.key);
        } catch (error) {
          console.error(`Failed to process ${file.key}:`, error);
          return null;
        }
      })
    );

    // Filter out failed files
    const successfulResults = results.filter(result => result !== null);

    return {
      success: true,
      datasets: successfulResults,
      totalFiles: csvFiles.length,
      processedFiles: successfulResults.length
    };

  } catch (error) {
    console.error('Error loading multiple CSV files:', error);
    return {
      success: false,
      error: error.message,
      datasets: []
    };
  }
};

// React Hook for loading CSV data
export const useSyntheaData = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadSyntheaDatasets();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, loadData };
};
