// Mock dataset with metadata files for testing
export const mockDatasetWithMetadata = {
    id: "test-dataset-1", // Use a simple URL-safe ID
    name: "Test Dataset",
    key: "user-uploads/raw/test-dataset-1721513391048",
    size: 3840,
    lastModified: new Date('2025-07-20'),
    format: 'folder',
    path: "user-uploads/raw/test-dataset-1721513391048",
    accessLevel: 'protected',
    source: 'User Dataset',
    fileCount: 4,
    dataFileCount: 2,
    metadataFileCount: 2,
    files: [ // Data files only
        {
            name: 'patients.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/patients.csv',
            size: 2048,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        },
        {
            name: 'visits.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/visits.csv',
            size: 1536,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        }
    ],
    dataFiles: [
        {
            name: 'patients.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/patients.csv',
            size: 2048,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        },
        {
            name: 'visits.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/visits.csv',
            size: 1536,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        }
    ],
    metadataFiles: [
        {
            name: 'data_dictionary.pdf',
            key: 'user-uploads/raw/test-dataset-1721513391048/metadata/data_dictionary.pdf',
            size: 128,
            lastModified: new Date('2025-07-20'),
            isMetadata: true
        },
        {
            name: 'readme.txt',
            key: 'user-uploads/raw/test-dataset-1721513391048/metadata/readme.txt',
            size: 128,
            lastModified: new Date('2025-07-20'),
            isMetadata: true
        }
    ],
    allFiles: [
        {
            name: 'patients.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/patients.csv',
            size: 2048,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        },
        {
            name: 'visits.csv',
            key: 'user-uploads/raw/test-dataset-1721513391048/visits.csv',
            size: 1536,
            lastModified: new Date('2025-07-20'),
            isMetadata: false
        },
        {
            name: 'data_dictionary.pdf',
            key: 'user-uploads/raw/test-dataset-1721513391048/metadata/data_dictionary.pdf',
            size: 128,
            lastModified: new Date('2025-07-20'),
            isMetadata: true
        },
        {
            name: 'readme.txt',
            key: 'user-uploads/raw/test-dataset-1721513391048/metadata/readme.txt',
            size: 128,
            lastModified: new Date('2025-07-20'),
            isMetadata: true
        }
    ]
};
