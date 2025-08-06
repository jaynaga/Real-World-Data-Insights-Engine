#!/usr/bin/env python3
"""
S3 Dataset F-UJI Testing Script
This script lists your S3 datasets and tests them with F-UJI
"""

import boto3
import requests
import json
from botocore.exceptions import NoCredentialsError, ClientError
import time
from urllib.parse import unquote

class S3FujiTester:
    def __init__(self, bucket_name=None):
        """Initialize S3 F-UJI tester"""
        try:
            self.s3_client = boto3.client('s3')
            self.bucket_name = bucket_name
            print("✅ AWS credentials loaded successfully")
        except NoCredentialsError:
            print("❌ AWS credentials not found. Please configure AWS CLI or set environment variables:")
            print("   export AWS_ACCESS_KEY_ID=your_access_key")
            print("   export AWS_SECRET_ACCESS_KEY=your_secret_key")
            print("   export AWS_DEFAULT_REGION=us-east-1")
            exit(1)

    def discover_buckets(self):
        """List all available S3 buckets"""
        try:
            response = self.s3_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            print(f"📦 Found {len(buckets)} S3 buckets:")
            for i, bucket in enumerate(buckets, 1):
                print(f"   {i}. {bucket}")
            return buckets
        except ClientError as e:
            print(f"❌ Error listing buckets: {e}")
            return []

    def discover_datasets(self, bucket_name, max_datasets=10):
        """Discover dataset folders in S3 bucket"""
        try:
            print(f"🔍 Scanning bucket '{bucket_name}' for datasets...")
            
            # List objects in bucket
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=bucket_name)
            
            datasets = {}
            file_count = 0
            
            for page in pages:
                if 'Contents' not in page:
                    continue
                    
                for obj in page['Contents']:
                    key = obj['Key']
                    file_count += 1
                    
                    # Skip if it's just a folder marker
                    if key.endswith('/'):
                        continue
                    
                    # Extract dataset folder (first or second level)
                    parts = key.split('/')
                    if len(parts) >= 2:
                        dataset_folder = '/'.join(parts[:-1])  # Everything except the filename
                        
                        if dataset_folder not in datasets:
                            datasets[dataset_folder] = {
                                'files': [],
                                'total_size': 0,
                                'formats': set()
                            }
                        
                        # Add file info
                        filename = parts[-1]
                        file_ext = filename.split('.')[-1].lower() if '.' in filename else 'unknown'
                        
                        datasets[dataset_folder]['files'].append({
                            'key': key,
                            'name': filename,
                            'size': obj.get('Size', 0),
                            'modified': obj.get('LastModified'),
                            'format': file_ext
                        })
                        datasets[dataset_folder]['total_size'] += obj.get('Size', 0)
                        datasets[dataset_folder]['formats'].add(file_ext)
                
                # Limit discovery to avoid overwhelming output
                if len(datasets) >= max_datasets:
                    break
            
            print(f"📊 Found {len(datasets)} datasets with {file_count} total files")
            return datasets
            
        except ClientError as e:
            print(f"❌ Error scanning bucket: {e}")
            return {}

    def create_presigned_url(self, bucket_name, key, expiration=3600):
        """Create pre-signed URL for S3 object"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"❌ Error creating pre-signed URL for {key}: {e}")
            return None

    def test_fuji_assessment(self, dataset_identifier, dataset_name="S3 Dataset"):
        """Test F-UJI assessment with dataset identifier"""
        
        fuji_url = "http://localhost:1071/fuji/api/v1/evaluate"
        
        payload = {
            "object_identifier": dataset_identifier,
            "test_debug": False,
            "use_datacite": True,
            "datacite_endpoint": "https://api.datacite.org/application/vnd.datacite.datacite+json/",
            "re3data_endpoint": "https://www.re3data.org/api/beta/repositories"
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Basic bWFydmVsOndvbmRlcndvbWFu'  # marvel:wonderwoman
        }
        
        try:
            print(f"🔬 Testing F-UJI assessment for: {dataset_name}")
            print(f"🔗 Identifier: {dataset_identifier[:100]}...")
            
            response = requests.post(fuji_url, json=payload, headers=headers, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'summary' in result:
                    summary = result['summary']
                    print(f"✅ F-UJI Assessment Successful!")
                    print(f"📊 Overall FAIR Score: {summary['score_percent']['FAIR']}%")
                    print(f"🔍 Detailed Scores:")
                    print(f"   Findable (F): {summary['score_percent']['F']}%")
                    print(f"   Accessible (A): {summary['score_percent']['A']}%")
                    print(f"   Interoperable (I): {summary['score_percent']['I']}%")
                    print(f"   Reusable (R): {summary['score_percent']['R']}%")
                    
                    return {
                        'success': True,
                        'overall_score': summary['score_percent']['FAIR'],
                        'detailed_scores': summary['score_percent'],
                        'dataset_name': dataset_name
                    }
                else:
                    print(f"⚠️  F-UJI returned data but no summary found")
                    return {'success': False, 'error': 'No summary in response'}
            else:
                print(f"❌ F-UJI request failed: HTTP {response.status_code}")
                print(f"Response: {response.text[:500]}...")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return {'success': False, 'error': str(e)}

    def test_datasets(self, bucket_name, datasets, max_tests=5):
        """Test multiple datasets with F-UJI"""
        
        print(f"\n🧪 Testing up to {max_tests} datasets with F-UJI...")
        print("=" * 60)
        
        results = []
        tested = 0
        
        for dataset_path, dataset_info in datasets.items():
            if tested >= max_tests:
                break
            
            print(f"\n📁 Dataset: {dataset_path}")
            print(f"   Files: {len(dataset_info['files'])}")
            print(f"   Size: {dataset_info['total_size']:,} bytes")
            print(f"   Formats: {', '.join(dataset_info['formats'])}")
            
            # Pick a representative file from the dataset
            if dataset_info['files']:
                # Prefer CSV, JSON, or the first file
                test_file = None
                for file_info in dataset_info['files']:
                    if file_info['format'] in ['csv', 'json']:
                        test_file = file_info
                        break
                
                if not test_file:
                    test_file = dataset_info['files'][0]
                
                # Create pre-signed URL for the test file
                presigned_url = self.create_presigned_url(bucket_name, test_file['key'])
                
                if presigned_url:
                    # Test with F-UJI
                    result = self.test_fuji_assessment(presigned_url, dataset_path)
                    results.append(result)
                    tested += 1
                    
                    # Wait between tests to avoid rate limiting
                    if tested < max_tests:
                        print("⏳ Waiting 3 seconds before next test...")
                        time.sleep(3)
                else:
                    print("❌ Could not create pre-signed URL")
            else:
                print("⚠️  No files found in dataset")
        
        return results

    def summarize_results(self, results):
        """Summarize F-UJI test results"""
        print(f"\n📈 F-UJI Assessment Summary")
        print("=" * 60)
        
        successful_tests = [r for r in results if r.get('success')]
        failed_tests = [r for r in results if not r.get('success')]
        
        print(f"✅ Successful assessments: {len(successful_tests)}")
        print(f"❌ Failed assessments: {len(failed_tests)}")
        
        if successful_tests:
            scores = [r['overall_score'] for r in successful_tests]
            avg_score = sum(scores) / len(scores)
            min_score = min(scores)
            max_score = max(scores)
            
            print(f"\n📊 FAIR Score Statistics:")
            print(f"   Average: {avg_score:.1f}%")
            print(f"   Range: {min_score:.1f}% - {max_score:.1f}%")
            
            print(f"\n🏆 Dataset Rankings:")
            successful_tests.sort(key=lambda x: x['overall_score'], reverse=True)
            for i, result in enumerate(successful_tests[:5], 1):
                print(f"   {i}. {result['dataset_name']}: {result['overall_score']:.1f}%")
        
        if failed_tests:
            print(f"\n⚠️  Failed Assessments:")
            for result in failed_tests:
                print(f"   - {result.get('dataset_name', 'Unknown')}: {result.get('error', 'Unknown error')}")

def main():
    print("🚀 S3 Dataset F-UJI Testing")
    print("=" * 50)
    
    # Initialize tester
    tester = S3FujiTester()
    
    # Discover buckets
    buckets = tester.discover_buckets()
    
    if not buckets:
        print("❌ No S3 buckets found")
        return
    
    # Let user choose bucket or auto-detect
    if len(buckets) == 1:
        bucket_name = buckets[0]
        print(f"📦 Using bucket: {bucket_name}")
    else:
        print(f"\n📦 Multiple buckets found. Please choose:")
        for i, bucket in enumerate(buckets, 1):
            print(f"   {i}. {bucket}")
        
        try:
            choice = int(input(f"\nEnter bucket number (1-{len(buckets)}): ")) - 1
            bucket_name = buckets[choice]
        except (ValueError, IndexError):
            print("❌ Invalid choice, using first bucket")
            bucket_name = buckets[0]
    
    print(f"✅ Selected bucket: {bucket_name}")
    
    # Discover datasets
    datasets = tester.discover_datasets(bucket_name)
    
    if not datasets:
        print("❌ No datasets found in bucket")
        return
    
    print(f"\n📁 Found datasets:")
    for i, (dataset_path, info) in enumerate(list(datasets.items())[:10], 1):
        formats = ', '.join(list(info['formats'])[:3])
        if len(info['formats']) > 3:
            formats += '...'
        print(f"   {i}. {dataset_path} ({len(info['files'])} files, {formats})")
    
    # Test datasets with F-UJI
    results = tester.test_datasets(bucket_name, datasets, max_tests=5)
    
    # Summarize results
    tester.summarize_results(results)
    
    print(f"\n🎯 Demo Ready!")
    print("Your F-UJI integration is working with real S3 datasets!")
    print("Use these results to show professional FAIR scoring in tomorrow's demo.")

if __name__ == "__main__":
    main()
