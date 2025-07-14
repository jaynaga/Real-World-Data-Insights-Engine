import { 
  GetObjectCommand, 
  ListObjectsV2Command, 
  PutObjectCommand,
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "../config/s3Config";

/**
 * List files in the S3 bucket
 * @param {string} prefix - Optional prefix to filter objects (folder path)
 * @returns {Promise<Array>} List of objects in the bucket
 */
export async function listFiles(prefix = "") {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (err) {
    console.error("Error listing files:", err);
    throw err;
  }
}

/**
 * Get a file from S3
 * @param {string} key - The file key (path) in the bucket
 * @returns {Promise<Object>} The file data
 */
export async function getFile(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    return response.Body;
  } catch (err) {
    console.error("Error getting file:", err);
    throw err;
  }
}

/**
 * Upload a file to S3
 * @param {string} key - The file key (path) in the bucket
 * @param {File|Blob|Buffer} file - The file to upload
 * @param {string} contentType - The content type of the file
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFile(key, file, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType
    });

    const response = await s3Client.send(command);
    return response;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}

/**
 * Delete a file from S3
 * @param {string} key - The file key (path) in the bucket
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return response;
  } catch (err) {
    console.error("Error deleting file:", err);
    throw err;
  }
}
