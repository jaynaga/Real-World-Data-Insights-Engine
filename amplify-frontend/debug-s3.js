// Debug script to help identify S3 upload issues
import { Auth, Storage } from 'aws-amplify';

// Verify a specific uploaded file exists
export const verifyUploadedFile = async (fileName) => {
    try {
        const key = `user-uploads/${fileName}`;
        console.log('Checking for file with key:', key);

        // Try to get the file URL (this will fail if file doesn't exist)
        const url = await Storage.get(key, { level: 'protected' });
        console.log('File exists! Signed URL:', url);

        // Get file info
        const files = await Storage.list('user-uploads/', { level: 'protected' });
        const fileInfo = files.find(f => f.key === key);
        console.log('File info:', fileInfo);

        return { exists: true, url, info: fileInfo };
    } catch (error) {
        console.error('File verification failed:', error);
        return { exists: false, error: error.message };
    }
};

// List all uploaded files with their full details
export const listAllUploads = async () => {
    try {
        console.log('=== LISTING ALL USER UPLOADS ===');

        // Get current user info
        const credentials = await Auth.currentCredentials();
        console.log('Your Cognito Identity ID:', credentials.identityId);
        console.log('Full S3 path: s3://rwde-dev-datasets1d45f-dev/protected/' + credentials.identityId + '/user-uploads/');

        // List files in user-uploads folder
        const files = await Storage.list('user-uploads/', {
            level: 'protected',
            pageSize: 100
        });

        console.log('Found', files.length, 'files:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.key}`);
            console.log(`   Size: ${file.size} bytes`);
            console.log(`   Modified: ${file.lastModified}`);
            console.log(`   ETag: ${file.eTag}`);
            console.log('---');
        });

        return files;
    } catch (error) {
        console.error('Error listing uploads:', error);
        throw error;
    }
};

// Debug script to help identify S3 upload issues
export const debugS3Upload = async () => {
    try {
        // Get current user identity
        const user = await Auth.currentAuthenticatedUser();
        console.log('Current user:', user.username);

        // Get user's Cognito Identity ID
        const credentials = await Auth.currentCredentials();
        console.log('Cognito Identity ID:', credentials.identityId);

        // Expected S3 path for uploads
        console.log('Expected S3 path:', `protected/${credentials.identityId}/user-uploads/`);

        // List all files in user's protected space
        const allFiles = await Storage.list('', { level: 'protected' });
        console.log('All protected files for user:', allFiles);

        // List specifically in user-uploads folder
        const uploadFiles = await Storage.list('user-uploads/', { level: 'protected' });
        console.log('Files in user-uploads folder:', uploadFiles);

        return {
            userId: user.username,
            identityId: credentials.identityId,
            expectedPath: `protected/${credentials.identityId}/user-uploads/`,
            allFiles,
            uploadFiles
        };
    } catch (error) {
        console.error('Debug error:', error);
        throw error;
    }
};

// Test upload function
export const testUpload = async () => {
    try {
        // Create a test file
        const testContent = 'test,data\n1,hello\n2,world';
        const testFile = new File([testContent], 'test-upload.csv', { type: 'text/csv' });

        // Upload with the same method as your app
        const key = `user-uploads/test-${Date.now()}.csv`;
        console.log('Uploading test file with key:', key);

        const result = await Storage.put(key, testFile, {
            contentType: 'text/csv',
            level: 'protected',
            metadata: {
                uploadedAt: new Date().toISOString(),
                originalFilename: 'test-upload.csv',
                fileType: 'text/csv',
                fileSize: String(testFile.size)
            }
        });

        console.log('Test upload result:', result);
        return result;
    } catch (error) {
        console.error('Test upload error:', error);
        throw error;
    }
};

// Debug function to explore S3 bucket structure  
export const exploreS3Structure = async () => {
    try {
        console.log('=== EXPLORING S3 BUCKET STRUCTURE ===');

        const results = {};

        // Check public access level (most likely for raw data)
        try {
            console.log('\n--- Checking PUBLIC access level ---');
            const publicFiles = await Storage.list('', {
                level: 'public',
                pageSize: 100
            });

            results.public = publicFiles;
            console.log('Public files:', publicFiles);

            // Look for raw folder specifically
            const rawFiles = publicFiles.filter(f => f.key.includes('raw'));
            if (rawFiles.length > 0) {
                console.log(`Found ${rawFiles.length} files in raw folder at PUBLIC level:`, rawFiles);
            }

            // Look specifically in raw/Synthea path
            const syntheaFiles = publicFiles.filter(f => f.key.includes('raw/Synthea'));
            if (syntheaFiles.length > 0) {
                console.log(`Found ${syntheaFiles.length} Synthea files:`, syntheaFiles);
            }
        } catch (error) {
            console.log('Cannot access public level:', error.message);
            results.public = { error: error.message };
        }

        // Also check protected (for user uploads)
        try {
            console.log('\n--- Checking PROTECTED access level ---');
            const protectedFiles = await Storage.list('', {
                level: 'protected',
                pageSize: 100
            });

            results.protected = protectedFiles;
            console.log('Protected files:', protectedFiles);
        } catch (error) {
            console.log('Cannot access protected level:', error.message);
            results.protected = { error: error.message };
        }

        return results;
    } catch (error) {
        console.error('Error exploring S3 structure:', error);
        throw error;
    }
};

// Test function to manually upload sample datasets to public area
export const uploadSampleDatasets = async () => {
    try {
        console.log('Creating and uploading sample datasets...');

        const sampleDatasets = [
            {
                name: 'patients.csv',
                content: `Id,BIRTHDATE,DEATHDATE,SSN,DRIVERS,PASSPORT,PREFIX,FIRST,LAST,SUFFIX,MAIDEN,MARITAL,RACE,ETHNICITY,GENDER,BIRTHPLACE,ADDRESS,CITY,STATE,COUNTY,ZIP,LAT,LON,HEALTHCARE_EXPENSES,HEALTHCARE_COVERAGE
1,1990-01-15,,999-99-9999,S99999999,,Mr.,John,Doe,,Smith,M,white,nonhispanic,M,Boston MA US,123 Main St,Boston,Massachusetts,Suffolk County,02101,42.3601,-71.0589,5000.00,10000.00
2,1985-05-20,,888-88-8888,S88888888,,Ms.,Jane,Smith,,,S,white,nonhispanic,F,Cambridge MA US,456 Oak Ave,Cambridge,Massachusetts,Middlesex County,02139,42.3736,-71.1097,7500.00,12000.00`,
                path: 'raw/Synthea/merged_csv/patients.csv'
            },
            {
                name: 'conditions.csv',
                content: `START,STOP,PATIENT,ENCOUNTER,CODE,DESCRIPTION
2020-01-15,2020-01-20,1,e1,444814009,Viral sinusitis (disorder)
2020-03-10,,2,e2,195967001,Asthma (disorder)
2020-06-05,2020-06-15,1,e3,65363002,Otitis media (disorder)`,
                path: 'raw/Synthea/merged_csv/conditions.csv'
            },
            {
                name: 'medications.csv',
                content: `START,STOP,PATIENT,ENCOUNTER,CODE,DESCRIPTION,REASONCODE,REASONDESCRIPTION
2020-01-15,2020-01-25,1,e1,834060,Ibuprofen 200 MG Oral Tablet,444814009,Viral sinusitis (disorder)  
2020-03-10,,2,e2,896188,Fluticasone propionate 0.25 MG/ACTUAT Metered Dose Inhaler,195967001,Asthma (disorder)`,
                path: 'raw/Synthea/merged_csv/medications.csv'
            }
        ];

        const uploadPromises = sampleDatasets.map(async (dataset) => {
            try {
                const file = new File([dataset.content], dataset.name, { type: 'text/csv' });
                console.log(`Uploading ${dataset.name} to ${dataset.path}...`);

                const result = await Storage.put(dataset.path, file, {
                    level: 'public',
                    contentType: 'text/csv',
                    metadata: {
                        uploadedAt: new Date().toISOString(),
                        type: 'sample-dataset',
                        description: `Sample ${dataset.name.replace('.csv', '')} data`
                    }
                });

                console.log(`Successfully uploaded ${dataset.name}:`, result);
                return result;
            } catch (error) {
                console.error(`Failed to upload ${dataset.name}:`, error);
                throw error;
            }
        });

        const results = await Promise.all(uploadPromises);
        console.log('All sample datasets uploaded successfully:', results);
        return results;

    } catch (error) {
        console.error('Error uploading sample datasets:', error);
        throw error;
    }
};
