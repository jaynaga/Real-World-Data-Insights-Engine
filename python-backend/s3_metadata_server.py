"""
Simple HTTP server to serve S3 dataset metadata to F-UJI
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading
import sys
import os

sys.path.append('/usr/src/app')
from fuji_s3_adapter import FujiS3Adapter

class S3MetadataHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.adapter = FujiS3Adapter()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests for S3 metadata"""
        try:
            if self.path.startswith('/s3-metadata/'):
                # Extract S3 URI from path
                s3_uri = self.path.replace('/s3-metadata/', '').replace('%2F', '/')
                s3_uri = f"s3://{s3_uri}"
                
                # Extract metadata
                metadata = self.adapter.extract_dataset_metadata(s3_uri)
                
                if metadata:
                    # Create schema.org metadata
                    schema_metadata = {
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        "identifier": metadata['identifier'],
                        "name": metadata['title'],
                        "description": metadata['description'],
                        "dateModified": str(metadata['modified']),
                        "contentSize": f"{metadata['size_bytes']} bytes"
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/ld+json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(schema_metadata, indent=2, default=str).encode())
                else:
                    self.send_error(404, "Metadata not found")
            else:
                self.send_error(404, "Not found")
                
        except Exception as e:
            print(f"Error serving metadata: {e}")
            self.send_error(500, str(e))
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def start_metadata_server():
    """Start the S3 metadata server"""
    server = HTTPServer(('0.0.0.0', 8080), S3MetadataHandler)
    print("🌐 S3 Metadata server running on port 8080")
    server.serve_forever()

if __name__ == "__main__":
    start_metadata_server()
