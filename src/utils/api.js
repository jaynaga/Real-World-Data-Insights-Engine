import { Storage } from 'aws-amplify';

export async function fetchDatasets() {
  try {
    const files = await Storage.list('processed/');
    return files.map(file => ({
      id: file.eTag,
      name: file.key.split('/').pop(),
      description: file.size ? `Size: ${(file.size / 1024).toFixed(2)} KB` : '',
      lastModified: file.lastModified
    }));
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
}

export async function getUploadUrl(fileName) {
  try {
    const key = `user-uploads/${fileName}`;
    return await Storage.get(key, { expires: 60 });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

export async function uploadFileWithSignedUrl(file, signedUrl) {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    if (!response.ok) throw new Error('Upload failed');
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
