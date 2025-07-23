// Debug utility to test metadata file detection
export const testMetadataDetection = () => {
    // Sample files for testing
    const sampleFiles = [
        {
            key: 'user-uploads/raw/my-dataset-1234567890123/data.csv',
            name: 'data.csv',
            size: 1024,
            lastModified: new Date()
        },
        {
            key: 'user-uploads/raw/my-dataset-1234567890123/metadata/data_dictionary.pdf',
            name: 'data_dictionary.pdf',
            size: 512,
            lastModified: new Date()
        },
        {
            key: 'user-uploads/raw/my-dataset-1234567890123/metadata/readme.txt',
            name: 'readme.txt',
            size: 256,
            lastModified: new Date()
        },
        {
            key: 'user-uploads/raw/my-dataset-1234567890123/patients.csv',
            name: 'patients.csv',
            size: 2048,
            lastModified: new Date()
        }
    ];

    console.log('Testing metadata detection with sample files:');

    const allFiles = sampleFiles.map(f => ({
        name: f.key.split('/').pop(),
        key: f.key,
        size: f.size,
        lastModified: f.lastModified,
        isMetadata: f.key.includes('/metadata/')
    }));

    const dataFiles = allFiles.filter(f => !f.isMetadata);
    const metadataFiles = allFiles.filter(f => f.isMetadata);

    console.log('All files:', allFiles);
    console.log('Data files:', dataFiles);
    console.log('Metadata files:', metadataFiles);

    const result = {
        fileCount: allFiles.length,
        dataFileCount: dataFiles.length,
        metadataFileCount: metadataFiles.length,
        files: dataFiles,
        dataFiles: dataFiles,
        metadataFiles: metadataFiles,
        allFiles: allFiles
    };

    console.log('Final dataset structure:', result);
    return result;
};

// Test the logic
console.log('=== Metadata Detection Test ===');
testMetadataDetection();
