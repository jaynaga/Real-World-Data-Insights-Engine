
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Generate AI-powered notebook content using AWS Bedrock
 */
async function generateAINotebook(goal, files) {
    try {
        const filesList = files.map(f => `- ${f.name}: ${f.description || 'Healthcare dataset'}`).join('\n');
        const prompt = `Create a comprehensive Jupyter notebook for healthcare data analysis.\n\nResearch Goal: ${goal}\n\nAvailable Datasets:\n${filesList}\n\nGenerate a well-structured notebook with:\n1. Introduction and research objectives\n2. Data loading and exploration\n3. Data cleaning and preprocessing\n4. Statistical analysis\n5. Visualizations\n6. Key findings and insights\n7. Conclusions and next steps\n\nUse Python with pandas, matplotlib, seaborn, and scikit-learn. Include detailed markdown explanations and code comments.\n\nReturn only the notebook content in JSON format with cells array containing markdown and code cells.`;

        const params = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        };

        console.log('Calling Bedrock with Claude 3 Sonnet...');
        const command = new InvokeModelCommand(params);
        let response, responseBody, aiContent;
        try {
            response = await bedrockClient.send(command);
            responseBody = JSON.parse(new TextDecoder().decode(response.body));
            aiContent = responseBody.content[0].text;
        } catch (bedrockError) {
            console.error('Bedrock model invocation failed:', {
                message: bedrockError.message,
                name: bedrockError.name,
                stack: bedrockError.stack,
                params
            });
            throw new Error(`Bedrock model invocation failed: ${bedrockError.message}`);
        }

        if (!aiContent) {
            throw new Error('No content returned from Bedrock model');
        }
        console.log('AI-generated content received');
        // Parse AI response and create notebook structure
        return createNotebookFromAI(aiContent, goal, files);
    } catch (error) {
        console.error('Error in generateAINotebook:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            goal,
            files
        });
        // Fallback to static notebook if Bedrock fails
        return createHealthcareNotebook(goal, files);
    }
}

/**
 * Create notebook structure from AI-generated content
 */
function createNotebookFromAI(aiContent, goal, files) {
    // Try to parse JSON response from AI, fallback to text parsing
    let notebookCells = [];

    try {
        const aiNotebook = JSON.parse(aiContent);
        if (aiNotebook.cells) {
            notebookCells = aiNotebook.cells;
        }
    } catch (e) {
        // If not JSON, create cells from text content
        notebookCells = [
            {
                cell_type: "markdown",
                metadata: {},
                source: [`# ${goal}\n\nAI-Generated Healthcare Data Analysis Notebook\n\n${aiContent}`]
            }
        ];
    }

    // Ensure we have a complete notebook structure
    const notebook = {
        cells: notebookCells.length > 0 ? notebookCells : createHealthcareNotebook(goal, files).cells,
        metadata: {
            kernelspec: {
                display_name: "Python 3",
                language: "python",
                name: "python3"
            },
            language_info: {
                name: "python",
                version: "3.8.0"
            }
        },
        nbformat: 4,
        nbformat_minor: 4
    };

    return notebook;
}

/**
 * Lightweight AI Notebook Generator
 * Generates healthcare research notebooks with minimal dependencies
 */
exports.handler = async (event) => {
    console.log('Processing notebook generation request:', JSON.stringify(event));

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return createCorsResponse(200, 'OK');
        }

        // Parse request body
        let body = {};
        if (event.body) {
            try {
                body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            } catch (e) {
                console.error('Failed to parse request body:', {
                    error: e,
                    rawBody: event.body
                });
                return createErrorResponse(400, 'Invalid JSON in request body');
            }
        }

        const { projectId = `project_${Date.now()}`, goal = 'Healthcare data analysis', files = [] } = body;

        console.log(`Generating AI-powered notebook for project: ${projectId}`);


        let notebook;
        try {
            notebook = await generateAINotebook(goal, files);
        } catch (aiError) {
            console.error('AI notebook generation failed, using fallback:', {
                message: aiError.message,
                name: aiError.name,
                stack: aiError.stack,
                goal,
                files
            });
            notebook = createHealthcareNotebook(goal, files);
        }

        // Return notebook directly in response
        return createCorsResponse(200, {
            success: true,
            notebook,
            message: 'Healthcare research notebook generated successfully',
            projectId
        });

    } catch (error) {
        console.error('Error generating notebook:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
        let notebook;
        try {
            notebook = await generateAINotebook(goal, files);
        } catch (aiError) {
            console.error('AI notebook generation failed, using fallback:', {
                message: aiError.message,
                name: aiError.name,
                stack: aiError.stack,
                goal,
                files
            });
            notebook = createHealthcareNotebook(goal, files);
        }

        // Return notebook directly in response
        return createCorsResponse(200, {
            success: true,
            notebook,
            message: 'Healthcare research notebook generated successfully',
            projectId
        });
            // Import Libraries
            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `# Import essential libraries for healthcare data analysis\n`,
                    `import pandas as pd\n`,
                    `import numpy as np\n`,
                    `import matplotlib.pyplot as plt\n`,
                    `import seaborn as sns\n`,
                    `from datetime import datetime, timedelta\n`,
                    `import warnings\n`,
                    `warnings.filterwarnings('ignore')\n`,
                    `\n`,
                    `# Configure visualization settings\n`,
                    `plt.style.use('default')\n`,
                    `sns.set_palette('Set2')\n`,
                    `plt.rcParams['figure.figsize'] = (12, 8)\n`,
                    `plt.rcParams['font.size'] = 10\n`,
                    `\n`,
                    `# Display settings for better notebook presentation\n`,
                    `pd.set_option('display.max_columns', 20)\n`,
                    `pd.set_option('display.max_rows', 100)\n`,
                    `\n`,
                    `print('✅ Libraries imported successfully!')\n`,
                    `print(f'📊 Analysis session started: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')\n`,
                    `print(f'🎯 Research Focus: ${goal}')`
                ]
            },

            // Data Loading Section
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 1. Data Loading & Validation\n`,
                    `\n`,
                    `Load your healthcare datasets using the appropriate methods below. Modify the code based on your specific file formats and requirements.\n`
                ]
            },

            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `# Data loading templates - uncomment and modify based on your file types\n`,
                    `\n`,
                    `# For CSV files (most common):\n`,
                    `# df = pd.read_csv('your_file.csv')\n`,
                    `# print(f"Loaded CSV: {df.shape[0]:,} rows × {df.shape[1]:,} columns")\n`,
                    `\n`,
                    `# For Excel files:\n`,
                    `# df = pd.read_excel('your_file.xlsx', sheet_name='Sheet1')\n`,
                    `# print(f"Loaded Excel: {df.shape[0]:,} rows × {df.shape[1]:,} columns")\n`,
                    `\n`,
                    `# For JSON files:\n`,
                    `# df = pd.read_json('your_file.json')\n`,
                    `# print(f"Loaded JSON: {df.shape[0]:,} rows × {df.shape[1]:,} columns")\n`,
                    `\n`,
                    `# For TSV/Tab-separated files:\n`,
                    `# df = pd.read_csv('your_file.tsv', sep='\\t')\n`,
                    `# print(f"Loaded TSV: {df.shape[0]:,} rows × {df.shape[1]:,} columns")\n`,
                    `\n`,
                    `# For Parquet files (efficient for large datasets):\n`,
                    `# df = pd.read_parquet('your_file.parquet')\n`,
                    `# print(f"Loaded Parquet: {df.shape[0]:,} rows × {df.shape[1]:,} columns")\n`,
                    `\n`,
                    `print('📁 Data loading templates ready - modify the code above based on your files')\n`,
                    `print('💡 Tip: Always check data shape and basic info after loading')`
                ]
            },

            // Data Exploration
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 2. Exploratory Data Analysis (EDA)\n`,
                    `\n`,
                    `Comprehensive exploration of your healthcare dataset to understand its structure, quality, and characteristics.\n`
                ]
            },

            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `def comprehensive_data_overview(df, dataset_name='Dataset'):\n`,
                    `    """\n`,
                    `    Comprehensive overview of a healthcare dataset\n`,
                    `    """\n`,
                    `    print(f'📊 {dataset_name} - Comprehensive Overview')\n`,
                    `    print('=' * 60)\n`,
                    `    \n`,
                    `    # Basic information\n`,
                    `    print(f'📏 Shape: {df.shape[0]:,} rows × {df.shape[1]:,} columns')\n`,
                    `    print(f'💾 Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB')\n`,
                    `    print(f'📅 Analysis date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')\n`,
                    `    \n`,
                    `    # Column types\n`,
                    `    print('\\n🔢 Data Types Summary:')\n`,
                    `    dtype_counts = df.dtypes.value_counts()\n`,
                    `    for dtype, count in dtype_counts.items():\n`,
                    `        print(f'  • {dtype}: {count} columns')\n`,
                    `    \n`,
                    `    # Missing values analysis\n`,
                    `    print('\\n❌ Missing Values Analysis:')\n`,
                    `    missing_count = df.isnull().sum().sum()\n`,
                    `    total_cells = df.shape[0] * df.shape[1]\n`,
                    `    missing_pct = (missing_count / total_cells) * 100\n`,
                    `    print(f'  • Total missing values: {missing_count:,} ({missing_pct:.2f}% of all data)')\n`,
                    `    \n`,
                    `    missing_by_col = df.isnull().sum()\n`,
                    `    missing_cols = missing_by_col[missing_by_col > 0]\n`,
                    `    if len(missing_cols) > 0:\n`,
                    `        print('  • Columns with missing values:')\n`,
                    `        for col, count in missing_cols.sort_values(ascending=False).head(10).items():\n`,
                    `            pct = (count / len(df)) * 100\n`,
                    `            print(f'    - {col}: {count:,} ({pct:.1f}%)')\n`,
                    `    else:\n`,
                    `        print('  • ✅ No missing values found!')\n`,
                    `    \n`,
                    `    # Duplicate rows\n`,
                    `    duplicates = df.duplicated().sum()\n`,
                    `    print(f'\\n🔄 Duplicate rows: {duplicates:,} ({(duplicates/len(df)*100):.2f}%)')\n`,
                    `    \n`,
                    `    # Column details\n`,
                    `    print('\\n📋 Detailed Column Information:')\n`,
                    `    print(df.info())\n`,
                    `    \n`,
                    `    # Sample data\n`,
                    `    print('\\n👀 Sample Data (First 5 rows):')\n`,
                    `    display(df.head())\n`,
                    `    \n`,
                    `    # Statistical summary\n`,
                    `    numeric_cols = df.select_dtypes(include=[np.number]).columns\n`,
                    `    if len(numeric_cols) > 0:\n`,
                    `        print(f'\\n📈 Statistical Summary ({len(numeric_cols)} numeric columns):')\n`,
                    `        display(df[numeric_cols].describe())\n`,
                    `    \n`,
                    `    # Categorical data summary\n`,
                    `    categorical_cols = df.select_dtypes(include=['object', 'category']).columns\n`,
                    `    if len(categorical_cols) > 0:\n`,
                    `        print(f'\\n📝 Categorical Data Summary ({len(categorical_cols)} columns):')\n`,
                    `        for col in categorical_cols[:5]:  # Show first 5 categorical columns\n`,
                    `            unique_count = df[col].nunique()\n`,
                    `            print(f'  • {col}: {unique_count} unique values')\n`,
                    `            if unique_count <= 10:\n`,
                    `                print(f'    Values: {list(df[col].value_counts().head().index)}')\n`,
                    `    \n`,
                    `    print('\\n' + '=' * 60)\n`,
                    `    return df.shape, missing_count, duplicates\n`,
                    `\n`,
                    `# Example usage (uncomment when your data is loaded):\n`,
                    `# shape, missing, duplicates = comprehensive_data_overview(df, 'Healthcare Dataset')`
                ]
            },

            // Data Cleaning
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 3. Data Cleaning & Preprocessing\n`,
                    `\n`,
                    `Clean and preprocess your healthcare data to ensure quality and consistency for analysis.\n`
                ]
            },

            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `def clean_healthcare_data(df):\n`,
                    `    """\n`,
                    `    Healthcare-specific data cleaning function\n`,
                    `    """\n`,
                    `    print('🧹 Starting data cleaning process...')\n`,
                    `    original_shape = df.shape\n`,
                    `    \n`,
                    `    # Create a copy to avoid modifying original\n`,
                    `    df_cleaned = df.copy()\n`,
                    `    \n`,
                    `    # 1. Remove completely empty rows and columns\n`,
                    `    df_cleaned = df_cleaned.dropna(how='all')  # Remove rows that are all NaN\n`,
                    `    df_cleaned = df_cleaned.dropna(axis=1, how='all')  # Remove columns that are all NaN\n`,
                    `    \n`,
                    `    # 2. Handle duplicate rows\n`,
                    `    duplicates_before = df_cleaned.duplicated().sum()\n`,
                    `    df_cleaned = df_cleaned.drop_duplicates()\n`,
                    `    duplicates_removed = duplicates_before - df_cleaned.duplicated().sum()\n`,
                    `    \n`,
                    `    # 3. Standardize column names (lowercase, replace spaces with underscores)\n`,
                    `    df_cleaned.columns = df_cleaned.columns.str.lower().str.replace(' ', '_').str.replace('[^a-zA-Z0-9_]', '', regex=True)\n`,
                    `    \n`,
                    `    # 4. Convert data types appropriately\n`,
                    `    # Example: Convert date columns\n`,
                    `    date_columns = [col for col in df_cleaned.columns if 'date' in col.lower() or 'time' in col.lower()]\n`,
                    `    for col in date_columns:\n`,
                    `        try:\n`,
                    `            df_cleaned[col] = pd.to_datetime(df_cleaned[col], errors='coerce')\n`,
                    `            print(f'  ✅ Converted {col} to datetime')\n`,
                    `        except:\n`,
                    `            print(f'  ⚠️ Could not convert {col} to datetime')\n`,
                    `    \n`,
                    `    # 5. Handle missing values strategically\n`,
                    `    missing_threshold = 0.5  # Remove columns with >50% missing values\n`,
                    `    missing_pct = df_cleaned.isnull().sum() / len(df_cleaned)\n`,
                    `    cols_to_drop = missing_pct[missing_pct > missing_threshold].index\n`,
                    `    if len(cols_to_drop) > 0:\n`,
                    `        print(f'  🗑️ Dropping {len(cols_to_drop)} columns with >{missing_threshold*100}% missing values:')\n`,
                    `        print(f'    {list(cols_to_drop)}')\n`,
                    `        df_cleaned = df_cleaned.drop(columns=cols_to_drop)\n`,
                    `    \n`,
                    `    # Summary\n`,
                    `    final_shape = df_cleaned.shape\n`,
                    `    print(f'\\n📊 Cleaning Summary:')\n`,
                    `    print(f'  • Original shape: {original_shape[0]:,} rows × {original_shape[1]:,} columns')\n`,
                    `    print(f'  • Final shape: {final_shape[0]:,} rows × {final_shape[1]:,} columns')\n`,
                    `    print(f'  • Rows removed: {original_shape[0] - final_shape[0]:,}')\n`,
                    `    print(f'  • Columns removed: {original_shape[1] - final_shape[1]:,}')\n`,
                    `    print(f'  • Duplicates removed: {duplicates_removed:,}')\n`,
                    `    print('  ✅ Data cleaning completed!')\n`,
                    `    \n`,
                    `    return df_cleaned\n`,
                    `\n`,
                    `# Example usage (uncomment when your data is loaded):\n`,
                    `# df_clean = clean_healthcare_data(df)\n`,
                    `\n`,
                    `print('🧹 Data cleaning functions ready!')`
                ]
            },

            // Visualization
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 4. Data Visualization\n`,
                    `\n`,
                    `Create comprehensive visualizations to understand patterns, trends, and relationships in your healthcare data.\n`
                ]
            },

            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `def create_healthcare_dashboard(df):\n`,
                    `    """\n`,
                    `    Create a comprehensive healthcare data dashboard\n`,
                    `    """\n`,
                    `    # Identify column types\n`,
                    `    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()\n`,
                    `    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()\n`,
                    `    date_cols = df.select_dtypes(include=['datetime64']).columns.tolist()\n`,
                    `    \n`,
                    `    print(f'📊 Creating dashboard for {len(df):,} records')\n`,
                    `    print(f'   • {len(numeric_cols)} numeric columns')\n`,
                    `    print(f'   • {len(categorical_cols)} categorical columns')\n`,
                    `    print(f'   • {len(date_cols)} date columns')\n`,
                    `    \n`,
                    `    # Create figure with subplots\n`,
                    `    fig = plt.figure(figsize=(20, 15))\n`,
                    `    \n`,
                    `    # 1. Missing values heatmap\n`,
                    `    plt.subplot(3, 3, 1)\n`,
                    `    if df.isnull().sum().sum() > 0:\n`,
                    `        sns.heatmap(df.isnull(), cbar=True, cmap='viridis', yticklabels=False)\n`,
                    `        plt.title('Missing Values Pattern', fontweight='bold')\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'No Missing Values\\n✅', ha='center', va='center', \n`,
                    `                transform=plt.gca().transAxes, fontsize=14, fontweight='bold')\n`,
                    `        plt.title('Missing Values: None Found', fontweight='bold')\n`,
                    `    \n`,
                    `    # 2. Correlation heatmap\n`,
                    `    plt.subplot(3, 3, 2)\n`,
                    `    if len(numeric_cols) > 1:\n`,
                    `        corr_matrix = df[numeric_cols].corr()\n`,
                    `        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))\n`,
                    `        sns.heatmap(corr_matrix, mask=mask, annot=True, cmap='RdBu_r', center=0,\n`,
                    `                   square=True, cbar_kws={'shrink': 0.8})\n`,
                    `        plt.title('Correlation Matrix', fontweight='bold')\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'Need 2+ numeric\\ncolumns for\\ncorrelation', \n`,
                    `                ha='center', va='center', transform=plt.gca().transAxes)\n`,
                    `        plt.title('Correlation: Insufficient Data', fontweight='bold')\n`,
                    `    \n`,
                    `    # 3. Data types distribution\n`,
                    `    plt.subplot(3, 3, 3)\n`,
                    `    dtype_counts = df.dtypes.value_counts()\n`,
                    `    colors = sns.color_palette('Set3', len(dtype_counts))\n`,
                    `    plt.pie(dtype_counts.values, labels=dtype_counts.index, autopct='%1.1f%%', colors=colors)\n`,
                    `    plt.title('Data Types Distribution', fontweight='bold')\n`,
                    `    \n`,
                    `    # 4. First numeric column distribution\n`,
                    `    plt.subplot(3, 3, 4)\n`,
                    `    if numeric_cols:\n`,
                    `        col = numeric_cols[0]\n`,
                    `        df[col].hist(bins=30, alpha=0.7, color='skyblue', edgecolor='black')\n`,
                    `        plt.title(f'Distribution: {col}', fontweight='bold')\n`,
                    `        plt.xlabel(col)\n`,
                    `        plt.ylabel('Frequency')\n`,
                    `        \n`,
                    `        # Add statistics text\n`,
                    `        mean_val = df[col].mean()\n`,
                    `        median_val = df[col].median()\n`,
                    `        plt.axvline(mean_val, color='red', linestyle='--', label=f'Mean: {mean_val:.2f}')\n`,
                    `        plt.axvline(median_val, color='green', linestyle='--', label=f'Median: {median_val:.2f}')\n`,
                    `        plt.legend()\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'No numeric\\ncolumns found', ha='center', va='center',\n`,
                    `                transform=plt.gca().transAxes, fontsize=12)\n`,
                    `        plt.title('Distribution: No Numeric Data', fontweight='bold')\n`,
                    `    \n`,
                    `    # 5. First categorical column\n`,
                    `    plt.subplot(3, 3, 5)\n`,
                    `    if categorical_cols:\n`,
                    `        col = categorical_cols[0]\n`,
                    `        top_values = df[col].value_counts().head(10)\n`,
                    `        bars = plt.bar(range(len(top_values)), top_values.values, color='lightcoral')\n`,
                    `        plt.title(f'Top 10 Values: {col}', fontweight='bold')\n`,
                    `        plt.xlabel('Categories')\n`,
                    `        plt.ylabel('Count')\n`,
                    `        plt.xticks(range(len(top_values)), top_values.index, rotation=45, ha='right')\n`,
                    `        \n`,
                    `        # Add value labels on bars\n`,
                    `        for bar, value in zip(bars, top_values.values):\n`,
                    `            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(top_values.values)*0.01,\n`,
                    `                    f'{value}', ha='center', va='bottom', fontsize=8)\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'No categorical\\ncolumns found', ha='center', va='center',\n`,
                    `                transform=plt.gca().transAxes, fontsize=12)\n`,
                    `        plt.title('Categories: No Categorical Data', fontweight='bold')\n`,
                    `    \n`,
                    `    # 6. Box plot for numeric data\n`,
                    `    plt.subplot(3, 3, 6)\n`,
                    `    if len(numeric_cols) >= 1:\n`,
                    `        # Select up to 5 numeric columns for box plot\n`,
                    `        cols_to_plot = numeric_cols[:5]\n`,
                    `        df[cols_to_plot].boxplot(ax=plt.gca())\n`,
                    `        plt.title('Box Plot: Numeric Variables', fontweight='bold')\n`,
                    `        plt.xticks(rotation=45, ha='right')\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'No numeric data\\nfor box plot', ha='center', va='center',\n`,
                    `                transform=plt.gca().transAxes, fontsize=12)\n`,
                    `        plt.title('Box Plot: No Data', fontweight='bold')\n`,
                    `    \n`,
                    `    # 7. Record count by date (if date column exists)\n`,
                    `    plt.subplot(3, 3, 7)\n`,
                    `    if date_cols:\n`,
                    `        date_col = date_cols[0]\n`,
                    `        df_date_counts = df.groupby(df[date_col].dt.date).size()\n`,
                    `        df_date_counts.plot(kind='line', color='purple', linewidth=2)\n`,
                    `        plt.title(f'Records Over Time: {date_col}', fontweight='bold')\n`,
                    `        plt.xlabel('Date')\n`,
                    `        plt.ylabel('Count')\n`,
                    `        plt.xticks(rotation=45)\n`,
                    `    else:\n`,
                    `        plt.text(0.5, 0.5, 'No date columns\\nfor time series', ha='center', va='center',\n`,
                    `                transform=plt.gca().transAxes, fontsize=12)\n`,
                    `        plt.title('Time Series: No Date Data', fontweight='bold')\n`,
                    `    \n`,
                    `    # 8. Data completeness by column\n`,
                    `    plt.subplot(3, 3, 8)\n`,
                    `    completeness = (1 - df.isnull().sum() / len(df)) * 100\n`,
                    `    completeness = completeness.sort_values()\n`,
                    `    bars = plt.barh(range(len(completeness)), completeness.values, color='lightgreen')\n`,
                    `    plt.yticks(range(len(completeness)), completeness.index)\n`,
                    `    plt.xlabel('Completeness (%)')\n`,
                    `    plt.title('Data Completeness by Column', fontweight='bold')\n`,
                    `    plt.xlim(0, 100)\n`,
                    `    \n`,
                    `    # Add percentage labels\n`,
                    `    for i, (bar, value) in enumerate(zip(bars, completeness.values)):\n`,
                    `        plt.text(value + 1, bar.get_y() + bar.get_height()/2, f'{value:.1f}%',\n`,
                    `                va='center', fontsize=8)\n`,
                    `    \n`,
                    `    # 9. Summary statistics table\n`,
                    `    plt.subplot(3, 3, 9)\n`,
                    `    plt.axis('off')\n`,
                    `    \n`,
                    `    # Create summary text\n`,
                    `    summary_text = f\"\"\"\n`,
                    `📊 Dataset Summary\n`,
                    `\n`,
                    `Rows: {len(df):,}\n`,
                    `Columns: {len(df.columns):,}\n`,
                    `\n`,
                    `Data Types:\n`,
                    `• Numeric: {len(numeric_cols)}\n`,
                    `• Categorical: {len(categorical_cols)}\n`,
                    `• Date/Time: {len(date_cols)}\n`,
                    `\n`,
                    `Data Quality:\n`,
                    `• Missing values: {df.isnull().sum().sum():,}\n`,
                    `• Duplicate rows: {df.duplicated().sum():,}\n`,
                    `• Completeness: {((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100):.1f}%\n`,
                    `\n`,
                    `Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n`,
                    `    \"\"\"\n`,
                    `    \n`,
                    `    plt.text(0.05, 0.95, summary_text, transform=plt.gca().transAxes, \n`,
                    `            fontsize=10, verticalalignment='top', fontfamily='monospace',\n`,
                    `            bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))\n`,
                    `    \n`,
                    `    plt.suptitle(f'Healthcare Data Analysis Dashboard\\nGoal: {goal}', \n`,
                    `                fontsize=16, fontweight='bold', y=0.98)\n`,
                    `    \n`,
                    `    plt.tight_layout()\n`,
                    `    plt.show()\n`,
                    `    \n`,
                    `    print('\\n✅ Dashboard created successfully!')\n`,
                    `    print('💡 Tip: Analyze each visualization to understand your data patterns')\n`,
                    `\n`,
                    `# Example usage (uncomment when your data is loaded):\n`,
                    `# create_healthcare_dashboard(df)`
                ]
            },

            // Statistical Analysis
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 5. Statistical Analysis\n`,
                    `\n`,
                    `Perform comprehensive statistical analysis appropriate for healthcare research.\n`
                ]
            },

            {
                cell_type: "code",
                execution_count: null,
                metadata: {},
                outputs: [],
                source: [
                    `# Statistical analysis templates for healthcare research\n`,
                    `# Uncomment and modify based on your specific research questions\n`,
                    `\n`,
                    `def perform_statistical_tests(df):\n`,
                    `    """\n`,
                    `    Perform common statistical tests for healthcare data\n`,
                    `    """\n`,
                    `    print('📈 Statistical Analysis Summary')\n`,
                    `    print('=' * 50)\n`,
                    `    \n`,
                    `    # Identify numeric columns for analysis\n`,
                    `    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()\n`,
                    `    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()\n`,
                    `    \n`,
                    `    if len(numeric_cols) >= 2:\n`,
                    `        print(f'🔢 Found {len(numeric_cols)} numeric columns for analysis')\n`,
                    `        \n`,
                    `        # Correlation analysis\n`,
                    `        print('\\n📊 Correlation Analysis:')\n`,
                    `        corr_matrix = df[numeric_cols].corr()\n`,
                    `        \n`,
                    `        # Find strongest correlations\n`,
                    `        corr_pairs = []\n`,
                    `        for i in range(len(corr_matrix.columns)):\n`,
                    `            for j in range(i+1, len(corr_matrix.columns)):\n`,
                    `                corr_val = corr_matrix.iloc[i, j]\n`,
                    `                if abs(corr_val) > 0.5:  # Strong correlation threshold\n`,
                    `                    corr_pairs.append((corr_matrix.columns[i], corr_matrix.columns[j], corr_val))\n`,
                    `        \n`,
                    `        if corr_pairs:\n`,
                    `            print('  Strong correlations found (|r| > 0.5):')\n`,
                    `            for col1, col2, corr in sorted(corr_pairs, key=lambda x: abs(x[2]), reverse=True):\n`,
                    `                print(f'    • {col1} ↔ {col2}: r = {corr:.3f}')\n`,
                    `        else:\n`,
                    `            print('  No strong correlations found (|r| > 0.5)')\n`,
                    `    \n`,
                    `    # Descriptive statistics by group\n`,
                    `    if categorical_cols and numeric_cols:\n`,
                    `        print(f'\\n📋 Descriptive Statistics by Groups:')\n`,
                    `        cat_col = categorical_cols[0]  # Use first categorical column\n`,
                    `        num_col = numeric_cols[0]      # Use first numeric column\n`,
                    `        \n`,
                    `        print(f'  Analyzing {num_col} by {cat_col}:')\n`,
                    `        group_stats = df.groupby(cat_col)[num_col].agg(['count', 'mean', 'std', 'median']).round(3)\n`,
                    `        print(group_stats.head(10))\n`,
                    `    \n`,
                    `    print('\\n✅ Basic statistical analysis completed!')\n`,
                    `    print('💡 For advanced analysis, consider:')\n`,
                    `    print('   • Hypothesis testing (t-tests, chi-square, etc.)')\n`,
                    `    print('   • Regression analysis')\n`,
                    `    print('   • Survival analysis (for time-to-event data)')\n`,
                    `    print('   • Clinical significance testing')\n`,
                    `\n`,
                    `# Example statistical tests (uncomment as needed):\n`,
                    `\n`,
                    `# 1. T-test for comparing two groups\n`,
                    `# from scipy.stats import ttest_ind\n`,
                    `# group1 = df[df['category'] == 'Group A']['value']\n`,
                    `# group2 = df[df['category'] == 'Group B']['value']\n`,
                    `# statistic, p_value = ttest_ind(group1, group2)\n`,
                    `# print(f'T-test: statistic={statistic:.3f}, p-value={p_value:.3f}')\n`,
                    `\n`,
                    `# 2. Chi-square test for categorical associations\n`,
                    `# from scipy.stats import chi2_contingency\n`,
                    `# contingency_table = pd.crosstab(df['category1'], df['category2'])\n`,
                    `# chi2, p_value, dof, expected = chi2_contingency(contingency_table)\n`,
                    `# print(f'Chi-square: χ²={chi2:.3f}, p-value={p_value:.3f}')\n`,
                    `\n`,
                    `# 3. Correlation with p-value\n`,
                    `# from scipy.stats import pearsonr\n`,
                    `# correlation, p_value = pearsonr(df['variable1'], df['variable2'])\n`,
                    `# print(f'Correlation: r={correlation:.3f}, p-value={p_value:.3f}')\n`,
                    `\n`,
                    `# 4. One-way ANOVA\n`,
                    `# from scipy.stats import f_oneway\n`,
                    `# groups = [group['value'].values for name, group in df.groupby('category')]\n`,
                    `# f_statistic, p_value = f_oneway(*groups)\n`,
                    `# print(f'ANOVA: F={f_statistic:.3f}, p-value={p_value:.3f}')\n`,
                    `\n`,
                    `# Example usage (uncomment when your data is loaded):\n`,
                    `# perform_statistical_tests(df)\n`,
                    `\n`,
                    `print('📈 Statistical analysis functions ready!')`
                ]
            },

            // Results and Conclusions
            {
                cell_type: "markdown",
                metadata: {},
                source: [
                    `## 6. Results & Clinical Interpretation\n`,
                    `\n`,
                    `**Update this section with your actual findings:**\n`,
                    `\n`,
                    `### Key Findings\n`,
                    `\n`,
                    `1. **Data Quality Assessment**\n`,
                    `   - *[Describe the quality and completeness of your dataset]*\n`,
                    `   - *[Note any limitations or data issues encountered]*\n`,
                    `\n`,
                    `2. **Descriptive Statistics**\n`,
                    `   - *[Summarize key descriptive statistics]*\n`,
                    `   - *[Highlight important patterns or distributions]*\n`,
                    `\n`,
                    `3. **Statistical Analysis Results**\n`,
                    `   - *[Report significant statistical findings]*\n`,
                    `   - *[Include confidence intervals and effect sizes where appropriate]*\n`,
                    `\n`,
                    `4. **Clinical Significance**\n`,
                    `   - *[Discuss the healthcare implications of your findings]*\n`,
                    `   - *[Consider clinical relevance beyond statistical significance]*\n`,
                    `\n`,
                    `### Clinical Recommendations\n`,
                    `\n`,
                    `1. **Patient Care Implications**\n`,
                    `   - *[How do these findings impact patient care?]*\n`,
                    `   - *[Are there actionable insights for clinicians?]*\n`,
                    `\n`,
                    `2. **Healthcare Policy**\n`,
                    `   - *[Do results suggest policy changes or guidelines updates?]*\n`,
                    `   - *[What are the population health implications?]*\n`,
                    `\n`,
                    `3. **Further Research Needs**\n`,
                    `   - *[What additional studies are needed?]*\n`,
                    `   - *[Suggest specific research questions for future investigation]*\n`,
                    `\n`,
                    `### Study Limitations\n`,
                    `\n`,
                    `- **Data Limitations**: *[Describe any data quality issues, missing values, or sampling limitations]*\n`,
                    `- **Methodological Limitations**: *[Note any analytical constraints or assumptions]*\n`,
                    `- **Generalizability**: *[Discuss how findings may apply to other populations or settings]*\n`,
                    `- **Temporal Factors**: *[Consider time-related limitations if applicable]*\n`,
                    `\n`,
                    `### Ethical Considerations\n`,
                    `\n`,
                    `- **Privacy and Confidentiality**: *[Ensure patient data protection throughout analysis]*\n`,
                    `- **Bias Assessment**: *[Consider potential sources of bias in data or analysis]*\n`,
                    `- **Equity Implications**: *[Assess whether findings may impact different groups differently]*\n`,
                    `\n`,
                    `### Next Steps\n`,
                    `\n`,
                    `1. **Validation Studies**: *[Plan for external validation if applicable]*\n`,
                    `2. **Implementation**: *[Consider how to translate findings into practice]*\n`,
                    `3. **Monitoring**: *[Plan for ongoing monitoring of outcomes]*\n`,
                    `4. **Dissemination**: *[Consider publication and presentation opportunities]*\n`,
                    `\n`,
                    `---\n`,
                    `\n`,
                    `**Analysis completed on:** ${timestamp}\n`,
                    `\n`,
                    `**Research Goal:** ${goal}\n`,
                    `\n`,
                    `**Generated by:** AI Healthcare Research Notebook Generator\n`
                ]
            }
        ],
        metadata: {
            kernelspec: {
                display_name: "Python 3",
                language: "python",
                name: "python3"
            },
            language_info: {
                codemirror_mode: { name: "ipython", version: 3 },
                file_extension: ".py",
                mimetype: "text/x-python",
                name: "python",
                nbconvert_exporter: "python",
                pygments_lexer: "ipython3",
                version: "3.8.0"
            }
        },
        nbformat: 4,
        nbformat_minor: 4
    };

    return notebook;
}

async function uploadNotebookToS3(notebook, projectId, bucketName) {
    const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

    // Generate unique notebook key
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const randomId = Math.random().toString(36).substring(2, 10);
    const notebookKey = `notebooks/${projectId}/healthcare_analysis_${timestamp}_${randomId}.ipynb`;

    // Convert notebook to JSON string
    const notebookJson = JSON.stringify(notebook, null, 2);

    try {
        // Upload to S3
        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: notebookKey,
            Body: notebookJson,
            ContentType: 'application/x-ipynb+json',
            ContentDisposition: 'attachment; filename="notebook.ipynb"',
            Metadata: {
                'project-id': projectId,
                'generated-by': 'ai-notebook-generator',
                'timestamp': timestamp,
                'content-type': 'jupyter-notebook'
            }
        });

        await s3Client.send(putCommand);

        // Generate presigned URL (valid for 1 hour)
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: notebookKey
        });

        const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        return { downloadUrl, notebookKey };

    } catch (error) {
        console.error('S3 upload failed:', error);
        throw new Error(`Failed to save notebook to S3: ${error.message}`);
    }
}

function createCorsResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    };
}

function createErrorResponse(statusCode, message) {
    return createCorsResponse(statusCode, {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
}
