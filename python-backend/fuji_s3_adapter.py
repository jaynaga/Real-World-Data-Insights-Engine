#!/usr/bin/env python3
"""
F-UJI S3 Adapter - Converts S3 dataset metadata to F-UJI compatible format
This script creates temporary metadata endpoints that F-UJI can assess
"""

import json
import yaml
import boto3
import tempfile
import os
from datetime import datetime, timedelta
from urllib.parse import urlparse
import mimetypes

class FujiS3Adapter:
    def __init__(self, aws_access_key=None, aws_secret_key=None, region='us-east-1'):
        """Initialize S3 adapter for F-UJI"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=region
        )
        self.temp_dir = tempfile.mkdtemp(prefix='fuji_s3_')
        print(f"📁 Created temp directory: {self.temp_dir}")

    def extract_dataset_metadata(self, s3_uri):
        """Extract comprehensive metadata from S3 dataset"""
        try:
            # Parse S3 URI (s3://bucket/path/to/dataset/)
            parsed = urlparse(s3_uri)
            bucket_name = parsed.netloc
            dataset_prefix = parsed.path.lstrip('/')
            
            print(f"🔍 Analyzing S3 dataset: s3://{bucket_name}/{dataset_prefix}")
            
            # List all objects in the dataset
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=dataset_prefix
            )
            
            objects = response.get('Contents', [])
            
            # Extract metadata
            metadata = {
                'identifier': self._generate_identifier(s3_uri),
                'title': self._extract_title(dataset_prefix),
                'description': self._generate_description(objects),
                'creator': 'Internal Research Team',
                'publisher': 'RWDE Platform',
                'created': self._get_earliest_date(objects),
                'modified': self._get_latest_date(objects),
                'format': self._get_file_formats(objects),
                'size_bytes': sum(obj.get('Size', 0) for obj in objects),
                'file_count': len(objects),
                'files': self._process_files(objects),
                'keywords': self._extract_keywords(dataset_prefix),
                'license': 'Internal Use License',
                'access_rights': 'Restricted Access',
                'spatial_coverage': 'Internal',
                'temporal_coverage': self._get_temporal_coverage(objects),
                'version': '1.0',
                'language': 'en'
            }
            
            print(f"✅ Extracted metadata for {len(objects)} files")
            return metadata
            
        except Exception as e:
            print(f"❌ Error extracting S3 metadata: {e}")
            return None

    def create_fuji_metadata_files(self, metadata):
        """Create F-UJI compatible metadata files"""
        try:
            # Create schema.org JSON-LD metadata
            schema_metadata = self._create_schema_org_metadata(metadata)
            
            # Create DataCite metadata
            datacite_metadata = self._create_datacite_metadata(metadata)
            
            # Create Dublin Core metadata  
            dublincore_metadata = self._create_dublin_core_metadata(metadata)
            
            # Write metadata files
            files = {}
            
            # Schema.org JSON-LD
            schema_file = os.path.join(self.temp_dir, 'metadata.jsonld')
            with open(schema_file, 'w') as f:
                json.dump(schema_metadata, f, indent=2, default=str)
            files['schema_org'] = schema_file
            
            # DataCite XML
            datacite_file = os.path.join(self.temp_dir, 'datacite.xml')
            with open(datacite_file, 'w') as f:
                f.write(datacite_metadata)
            files['datacite'] = datacite_file
            
            # Dublin Core XML
            dc_file = os.path.join(self.temp_dir, 'dublin_core.xml')
            with open(dc_file, 'w') as f:
                f.write(dublincore_metadata)
            files['dublin_core'] = dc_file
            
            print(f"✅ Created {len(files)} metadata files")
            return files
            
        except Exception as e:
            print(f"❌ Error creating metadata files: {e}")
            return {}

    def create_presigned_urls(self, s3_uri, expiration=3600):
        """Create pre-signed URLs for F-UJI to access S3 objects"""
        try:
            parsed = urlparse(s3_uri)
            bucket_name = parsed.netloc
            dataset_prefix = parsed.path.lstrip('/')
            
            # List dataset objects
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=dataset_prefix
            )
            
            objects = response.get('Contents', [])
            presigned_urls = {}
            
            for obj in objects:
                key = obj['Key']
                filename = key.split('/')[-1]
                
                # Generate pre-signed URL
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket_name, 'Key': key},
                    ExpiresIn=expiration
                )
                
                presigned_urls[filename] = {
                    'url': url,
                    'size': obj.get('Size', 0),
                    'modified': obj.get('LastModified'),
                    'content_type': mimetypes.guess_type(filename)[0] or 'application/octet-stream'
                }
            
            print(f"✅ Created {len(presigned_urls)} pre-signed URLs")
            return presigned_urls
            
        except Exception as e:
            print(f"❌ Error creating pre-signed URLs: {e}")
            return {}

    def _generate_identifier(self, s3_uri):
        """Generate a unique identifier for the dataset"""
        return f"rwde:s3:{s3_uri.replace('s3://', '').replace('/', '-')}"

    def _extract_title(self, prefix):
        """Extract a human-readable title from S3 prefix"""
        # Remove common prefixes and clean up
        title = prefix.rstrip('/').split('/')[-1]
        title = title.replace('_', ' ').replace('-', ' ')
        return title.title()

    def _generate_description(self, objects):
        """Generate a description based on the dataset contents"""
        file_types = set()
        for obj in objects:
            ext = obj['Key'].split('.')[-1].lower() if '.' in obj['Key'] else 'unknown'
            file_types.add(ext)
        
        return f"Dataset containing {len(objects)} files in {', '.join(sorted(file_types))} format(s)"

    def _get_earliest_date(self, objects):
        """Get the earliest creation date"""
        if not objects:
            return datetime.now()
        return min(obj.get('LastModified', datetime.now()) for obj in objects)

    def _get_latest_date(self, objects):
        """Get the latest modification date"""
        if not objects:
            return datetime.now()
        return max(obj.get('LastModified', datetime.now()) for obj in objects)

    def _get_file_formats(self, objects):
        """Get unique file formats in the dataset"""
        formats = set()
        for obj in objects:
            ext = obj['Key'].split('.')[-1].lower() if '.' in obj['Key'] else 'unknown'
            formats.add(ext)
        return list(sorted(formats))

    def _process_files(self, objects):
        """Process file information"""
        files = []
        for obj in objects:
            filename = obj['Key'].split('/')[-1]
            ext = filename.split('.')[-1].lower() if '.' in filename else 'unknown'
            
            files.append({
                'name': filename,
                'size': obj.get('Size', 0),
                'modified': obj.get('LastModified'),
                'format': ext,
                'mime_type': mimetypes.guess_type(filename)[0] or 'application/octet-stream'
            })
        return files

    def _extract_keywords(self, prefix):
        """Extract keywords from the dataset path"""
        # Common research keywords
        keywords = []
        
        keyword_mapping = {
            'synthea': ['medical', 'synthetic', 'healthcare', 'patient data'],
            'mental-health': ['psychology', 'mental health', 'survey', 'research'],
            'depression': ['mental health', 'psychology', 'depression', 'clinical'],
            'suicide': ['mental health', 'prevention', 'psychology', 'public health'],
            'bullying': ['education', 'social', 'psychology', 'youth'],
            'kaggle': ['machine learning', 'data science', 'competition'],
            'covid': ['pandemic', 'public health', 'epidemiology'],
            'cancer': ['oncology', 'medical', 'clinical', 'healthcare']
        }
        
        prefix_lower = prefix.lower()
        for key, terms in keyword_mapping.items():
            if key in prefix_lower:
                keywords.extend(terms)
        
        # Add general keywords
        keywords.extend(['dataset', 'research data', 'data analysis'])
        
        return list(set(keywords))  # Remove duplicates

    def _get_temporal_coverage(self, objects):
        """Determine temporal coverage from file dates"""
        if not objects:
            return "Unknown"
        
        earliest = self._get_earliest_date(objects)
        latest = self._get_latest_date(objects)
        
        if earliest.date() == latest.date():
            return earliest.strftime("%Y-%m-%d")
        else:
            return f"{earliest.strftime('%Y-%m-%d')} to {latest.strftime('%Y-%m-%d')}"

    def _create_schema_org_metadata(self, metadata):
        """Create Schema.org JSON-LD metadata"""
        return {
            "@context": "https://schema.org",
            "@type": "Dataset",
            "identifier": metadata['identifier'],
            "name": metadata['title'],
            "description": metadata['description'],
            "creator": {
                "@type": "Organization",
                "name": metadata['creator']
            },
            "publisher": {
                "@type": "Organization", 
                "name": metadata['publisher']
            },
            "dateCreated": metadata['created'].isoformat() if hasattr(metadata['created'], 'isoformat') else str(metadata['created']),
            "dateModified": metadata['modified'].isoformat() if hasattr(metadata['modified'], 'isoformat') else str(metadata['modified']),
            "keywords": metadata['keywords'],
            "license": metadata['license'],
            "version": metadata['version'],
            "inLanguage": metadata['language'],
            "contentSize": f"{metadata['size_bytes']} bytes",
            "distribution": [
                {
                    "@type": "DataDownload",
                    "name": file_info['name'],
                    "contentSize": file_info['size'],
                    "encodingFormat": file_info['mime_type']
                }
                for file_info in metadata['files']
            ],
            "spatialCoverage": metadata['spatial_coverage'],
            "temporalCoverage": metadata['temporal_coverage']
        }

    def _create_datacite_metadata(self, metadata):
        """Create DataCite XML metadata"""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4">
    <identifier identifierType="DOI">{metadata['identifier']}</identifier>
    <creators>
        <creator>
            <creatorName>{metadata['creator']}</creatorName>
        </creator>
    </creators>
    <titles>
        <title>{metadata['title']}</title>
    </titles>
    <publisher>{metadata['publisher']}</publisher>
    <publicationYear>{metadata['created'].year if hasattr(metadata['created'], 'year') else '2024'}</publicationYear>
    <resourceType resourceTypeGeneral="Dataset">Research Dataset</resourceType>
    <descriptions>
        <description descriptionType="Abstract">{metadata['description']}</description>
    </descriptions>
    <formats>
        {chr(10).join(f'<format>{fmt}</format>' for fmt in metadata['format'])}
    </formats>
    <sizes>
        <size>{metadata['size_bytes']} bytes</size>
    </sizes>
    <rightsList>
        <rights>{metadata['license']}</rights>
    </rightsList>
</resource>"""

    def _create_dublin_core_metadata(self, metadata):
        """Create Dublin Core XML metadata"""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier>{metadata['identifier']}</dc:identifier>
    <dc:title>{metadata['title']}</dc:title>
    <dc:description>{metadata['description']}</dc:description>
    <dc:creator>{metadata['creator']}</dc:creator>
    <dc:publisher>{metadata['publisher']}</dc:publisher>
    <dc:date>{metadata['created']}</dc:date>
    <dc:language>{metadata['language']}</dc:language>
    <dc:rights>{metadata['license']}</dc:rights>
    <dc:type>Dataset</dc:type>
    {chr(10).join(f'<dc:format>{fmt}</dc:format>' for fmt in metadata['format'])}
    {chr(10).join(f'<dc:subject>{keyword}</dc:subject>' for keyword in metadata['keywords'])}
</metadata>"""


if __name__ == "__main__":
    # Example usage
    adapter = FujiS3Adapter()
    
    # Test with a sample S3 URI
    s3_uri = "s3://your-bucket/synthea-medical-data/"
    
    print("🚀 Starting S3 dataset analysis...")
    metadata = adapter.extract_dataset_metadata(s3_uri)
    
    if metadata:
        print(f"📊 Dataset: {metadata['title']}")
        print(f"📁 Files: {metadata['file_count']}")
        print(f"💾 Size: {metadata['size_bytes']:,} bytes")
        print(f"🏷️ Keywords: {', '.join(metadata['keywords'])}")
        
        # Create metadata files
        metadata_files = adapter.create_fuji_metadata_files(metadata)
        print(f"✅ Created metadata files: {list(metadata_files.keys())}")
        
        # Create pre-signed URLs
        urls = adapter.create_presigned_urls(s3_uri)
        print(f"🔗 Created {len(urls)} pre-signed URLs")
    else:
        print("❌ Failed to extract metadata")
