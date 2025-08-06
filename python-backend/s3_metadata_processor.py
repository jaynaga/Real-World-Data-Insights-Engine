"""
Custom F-UJI metadata processor for S3 datasets
"""

import json
import re
from urllib.parse import urlparse

class S3MetadataProcessor:
    def __init__(self):
        self.s3_patterns = [
            r'https://.*\.s3\..*\.amazonaws\.com/.*',
            r'https://s3\..*\.amazonaws\.com/.*',
            r's3://.*'
        ]
    
    def is_s3_url(self, url):
        """Check if URL is an S3 resource"""
        return any(re.match(pattern, url) for pattern in self.s3_patterns)
    
    def extract_s3_metadata(self, url):
        """Extract metadata from S3 URL or pre-signed URL"""
        try:
            parsed = urlparse(url)
            
            # Extract bucket and key information
            if 's3.amazonaws.com' in parsed.netloc:
                path_parts = parsed.path.strip('/').split('/')
                bucket = path_parts[0] if path_parts else 'unknown'
                key = '/'.join(path_parts[1:]) if len(path_parts) > 1 else ''
            else:
                # Pre-signed URL format
                bucket = parsed.netloc.split('.')[0]
                key = parsed.path.strip('/')
            
            # Generate basic metadata
            metadata = {
                'source': 'S3',
                'bucket': bucket,
                'key': key,
                'accessible': True,
                'protocol': 'HTTPS',
                'format_score': self._assess_format(key),
                'findability_score': self._assess_findability(key, bucket),
                'accessibility_score': 85,  # S3 URLs are generally accessible
                'interoperability_score': self._assess_interoperability(key),
                'reusability_score': self._assess_reusability(key, bucket)
            }
            
            return metadata
            
        except Exception as e:
            print(f"Error processing S3 metadata: {e}")
            return None
    
    def _assess_format(self, key):
        """Assess file format compliance"""
        standard_formats = ['.csv', '.json', '.xml', '.txt', '.xlsx']
        
        for fmt in standard_formats:
            if key.lower().endswith(fmt):
                return 85  # High score for standard formats
        
        return 45  # Lower score for unknown formats
    
    def _assess_findability(self, key, bucket):
        """Assess findability based on naming conventions"""
        score = 50  # Base score
        
        # Good naming conventions
        if any(term in key.lower() for term in ['data', 'dataset', 'research']):
            score += 20
        
        # Descriptive path structure
        if '/' in key and len(key.split('/')) > 2:
            score += 15
        
        # Avoid generic names
        if any(term in key.lower() for term in ['temp', 'test', 'copy']):
            score -= 15
        
        return min(score, 100)
    
    def _assess_interoperability(self, key):
        """Assess interoperability based on file format"""
        interoperable_formats = {
            '.csv': 90,
            '.json': 95,
            '.xml': 85,
            '.txt': 75,
            '.xlsx': 70
        }
        
        for fmt, score in interoperable_formats.items():
            if key.lower().endswith(fmt):
                return score
        
        return 40  # Default for unknown formats
    
    def _assess_reusability(self, key, bucket):
        """Assess reusability factors"""
        score = 60  # Base score for S3 storage
        
        # Research-oriented naming suggests better documentation
        if any(term in key.lower() for term in ['research', 'study', 'survey']):
            score += 20
        
        # Organized bucket structure
        if any(term in bucket.lower() for term in ['data', 'research', 'archive']):
            score += 10
        
        return min(score, 100)

