#!/usr/bin/env python3
"""
Platform-Aware FAIR Assessment
Better scoring for datasets within the RWDE platform context
"""

import boto3
import json
import pandas as pd
from datetime import datetime
import mimetypes
import re

class PlatformFairAssessment:
    """
    FAIR assessment tailored for platform datasets
    Focuses on data quality, structure, and usability rather than publication standards
    """
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
    
    def assess_dataset(self, bucket_name, dataset_prefix):
        """Assess a dataset with platform-aware FAIR scoring"""
        
        try:
            # Gather comprehensive dataset information
            dataset_info = self._analyze_dataset_structure(bucket_name, dataset_prefix)
            
            # Calculate FAIR scores
            findable_score = self._assess_findable_platform(dataset_info)
            accessible_score = self._assess_accessible_platform(dataset_info)
            interoperable_score = self._assess_interoperable_platform(dataset_info)
            reusable_score = self._assess_reusable_platform(dataset_info)
            
            overall_score = (findable_score + accessible_score + interoperable_score + reusable_score) / 4
            
            return {
                'overall_score': round(overall_score, 1),
                'assessment_method': 'Platform-Aware FAIR Assessment',
                'scores': {
                    'findable': round(findable_score, 1),
                    'accessible': round(accessible_score, 1),
                    'interoperable': round(interoperable_score, 1),
                    'reusable': round(reusable_score, 1)
                },
                'dataset_info': dataset_info,
                'recommendations': self._generate_recommendations(dataset_info)
            }
            
        except Exception as e:
            print(f"Error assessing dataset: {e}")
            return None
    
    def _analyze_dataset_structure(self, bucket_name, dataset_prefix):
        """Analyze dataset structure and extract metadata"""
        
        # List all objects in dataset
        response = self.s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=dataset_prefix
        )
        
        objects = response.get('Contents', [])
        
        # Analyze files
        files = []
        total_size = 0
        formats = set()
        has_documentation = False
        has_metadata = False
        has_schema = False
        
        for obj in objects:
            key = obj['Key']
            filename = key.split('/')[-1]
            
            if not filename:  # Skip directory markers
                continue
                
            file_ext = filename.split('.')[-1].lower() if '.' in filename else 'unknown'
            file_size = obj.get('Size', 0)
            
            files.append({
                'name': filename,
                'key': key,
                'size': file_size,
                'format': file_ext,
                'modified': obj.get('LastModified')
            })
            
            total_size += file_size
            formats.add(file_ext)
            
            # Check for special files
            filename_lower = filename.lower()
            if any(doc in filename_lower for doc in ['readme', 'doc', 'description', 'info']):
                has_documentation = True
            if 'metadata' in filename_lower or 'meta' in filename_lower:
                has_metadata = True
            if 'schema' in filename_lower or filename_lower.endswith('.schema.json'):
                has_schema = True
        
        # Extract dataset characteristics
        dataset_name = dataset_prefix.rstrip('/').split('/')[-1]
        dataset_type = self._classify_dataset_type(dataset_name, files)
        
        return {
            'name': dataset_name,
            'prefix': dataset_prefix,
            'files': files,
            'file_count': len(files),
            'total_size': total_size,
            'formats': list(formats),
            'has_documentation': has_documentation,
            'has_metadata': has_metadata,
            'has_schema': has_schema,
            'dataset_type': dataset_type,
            'structure_quality': self._assess_structure_quality(files)
        }
    
    def _classify_dataset_type(self, name, files):
        """Classify the type of dataset"""
        name_lower = name.lower()
        
        # Medical/Health data
        if any(term in name_lower for term in ['synthea', 'medical', 'health', 'patient', 'clinical']):
            return 'medical_research'
        
        # Survey/Social data  
        elif any(term in name_lower for term in ['survey', 'mental', 'depression', 'bullying', 'social']):
            return 'social_research'
        
        # Business/Financial
        elif any(term in name_lower for term in ['finance', 'business', 'sales', 'market']):
            return 'business_analytics'
        
        # Educational
        elif any(term in name_lower for term in ['education', 'student', 'school', 'academic']):
            return 'educational_research'
        
        # Check file patterns
        has_csv = any(f['format'] == 'csv' for f in files)
        has_json = any(f['format'] == 'json' for f in files)
        
        if has_csv and len(files) > 5:
            return 'structured_dataset'
        elif has_json:
            return 'api_dataset'
        else:
            return 'general_dataset'
    
    def _assess_structure_quality(self, files):
        """Assess the organizational structure quality"""
        score = 0
        
        # File organization (multiple related files)
        if len(files) > 1:
            score += 20
        
        # Consistent naming
        naming_patterns = set()
        for file_info in files:
            name = file_info['name']
            # Extract naming pattern (letters/numbers/separators)
            pattern = re.sub(r'[0-9]+', 'N', name)  # Replace numbers with N
            pattern = re.sub(r'[_-]', 'S', pattern)  # Replace separators
            naming_patterns.add(pattern)
        
        if len(naming_patterns) <= len(files) * 0.5:  # Consistent patterns
            score += 15
        
        # File sizes (not empty, not too large)
        valid_sizes = [f for f in files if 1000 < f['size'] < 100_000_000]  # 1KB - 100MB
        if len(valid_sizes) >= len(files) * 0.8:
            score += 15
        
        return min(score, 50)
    
    def _assess_findable_platform(self, dataset_info):
        """Assess findability within platform context"""
        score = 0
        
        # Clear naming (25 points)
        name = dataset_info['name']
        if len(name) > 5 and not any(bad in name.lower() for bad in ['temp', 'test', 'copy', 'untitled']):
            score += 15
        
        # Descriptive naming
        if any(term in name.lower() for term in ['data', 'dataset', 'research', 'study', 'analysis']):
            score += 10
        
        # Dataset type classification (25 points)
        if dataset_info['dataset_type'] != 'general_dataset':
            score += 25
        
        # File organization (25 points)
        if dataset_info['file_count'] > 1:
            score += 15
        if dataset_info['structure_quality'] > 30:
            score += 10
        
        # Documentation presence (25 points)
        if dataset_info['has_documentation']:
            score += 15
        if dataset_info['has_metadata']:
            score += 10
        
        return min(score, 100)
    
    def _assess_accessible_platform(self, dataset_info):
        """Assess accessibility within platform context"""
        score = 20  # Base score for being in platform
        
        # File formats (40 points)
        accessible_formats = ['csv', 'json', 'txt', 'xlsx', 'xml']
        format_score = 0
        for fmt in dataset_info['formats']:
            if fmt in accessible_formats:
                format_score += 10
        score += min(format_score, 40)
        
        # File sizes (reasonable for platform use) (20 points)
        total_mb = dataset_info['total_size'] / (1024 * 1024)
        if 0.1 <= total_mb <= 1000:  # 100KB to 1GB is reasonable
            score += 20
        elif total_mb <= 5000:  # Up to 5GB is acceptable
            score += 10
        
        # Multiple access points (multiple files) (20 points)
        if dataset_info['file_count'] > 1:
            score += 10
        if dataset_info['file_count'] >= 5:
            score += 10
        
        return min(score, 100)
    
    def _assess_interoperable_platform(self, dataset_info):
        """Assess interoperability within platform context"""
        score = 0
        
        # Standard file formats (50 points)
        standard_formats = {
            'csv': 25,    # Highly interoperable
            'json': 20,   # Well structured
            'xlsx': 15,   # Common but proprietary
            'txt': 10,    # Simple but limited
            'xml': 15,    # Structured
            'parquet': 20 # Efficient structured
        }
        
        format_score = 0
        for fmt in dataset_info['formats']:
            format_score += standard_formats.get(fmt, 5)
        score += min(format_score, 50)
        
        # Schema/Structure documentation (25 points)
        if dataset_info['has_schema']:
            score += 15
        if 'csv' in dataset_info['formats']:  # CSV implies tabular structure
            score += 10
        
        # Consistent structure across files (25 points)
        if dataset_info['structure_quality'] > 30:
            score += 25
        elif dataset_info['structure_quality'] > 15:
            score += 15
        
        return min(score, 100)
    
    def _assess_reusable_platform(self, dataset_info):
        """Assess reusability within platform context"""
        score = 10  # Base score for being in managed platform
        
        # Documentation and context (40 points)
        if dataset_info['has_documentation']:
            score += 20
        if dataset_info['has_metadata']:
            score += 15
        if dataset_info['dataset_type'] in ['medical_research', 'social_research', 'educational_research']:
            score += 5  # Research context adds value
        
        # Data quality indicators (30 points)
        # File completeness
        if dataset_info['file_count'] >= 3:
            score += 10
        
        # Size indicates substantial content
        total_mb = dataset_info['total_size'] / (1024 * 1024)
        if total_mb >= 1:  # At least 1MB of data
            score += 10
        if total_mb >= 10:  # Substantial dataset
            score += 10
        
        # Structure quality (30 points)
        score += min(dataset_info['structure_quality'], 30)
        
        return min(score, 100)
    
    def _generate_recommendations(self, dataset_info):
        """Generate recommendations for improving FAIR score"""
        recommendations = []
        
        if not dataset_info['has_documentation']:
            recommendations.append("Add README or documentation file describing the dataset")
        
        if not dataset_info['has_metadata']:
            recommendations.append("Include metadata file with dataset description and context")
        
        if 'csv' in dataset_info['formats'] and not dataset_info['has_schema']:
            recommendations.append("Add schema documentation for CSV files (column descriptions)")
        
        if dataset_info['structure_quality'] < 30:
            recommendations.append("Improve file naming consistency and organization")
        
        if len(dataset_info['formats']) == 1 and 'csv' in dataset_info['formats']:
            recommendations.append("Consider adding JSON metadata or documentation files")
        
        proprietary_formats = [f for f in dataset_info['formats'] if f in ['xlsx', 'doc', 'pdf']]
        if proprietary_formats:
            recommendations.append(f"Consider converting {', '.join(proprietary_formats)} to open formats")
        
        return recommendations


def test_platform_assessment():
    """Test the platform assessment with Synthea dataset"""
    
    assessor = PlatformFairAssessment()
    
    # Test with Synthea dataset
    bucket = 'rwde-dev-datasets37fb9-rwde'
    synthea_prefix = 'protected/us-east-1:93c96a21-bf10-c542-83fe-a4a162530e52/user-uploads/raw/Synthea/'
    
    print("🏥 Platform-Aware FAIR Assessment: Synthea Dataset")
    print("=" * 60)
    
    result = assessor.assess_dataset(bucket, synthea_prefix)
    
    if result:
        print(f"📊 Overall FAIR Score: {result['overall_score']}%")
        print(f"🔍 Assessment Method: {result['assessment_method']}")
        print()
        print("📈 Detailed Scores:")
        for criterion, score in result['scores'].items():
            print(f"   {criterion.title()}: {score}%")
        
        print()
        print("📋 Dataset Information:")
        info = result['dataset_info']
        print(f"   Name: {info['name']}")
        print(f"   Type: {info['dataset_type']}")
        print(f"   Files: {info['file_count']}")
        print(f"   Size: {info['total_size'] / (1024*1024):.1f} MB")
        print(f"   Formats: {', '.join(info['formats'])}")
        print(f"   Documentation: {'Yes' if info['has_documentation'] else 'No'}")
        print(f"   Metadata: {'Yes' if info['has_metadata'] else 'No'}")
        
        if result['recommendations']:
            print()
            print("💡 Recommendations:")
            for rec in result['recommendations']:
                print(f"   • {rec}")
        
        print()
        print("🎯 Summary:")
        if result['overall_score'] >= 80:
            print("   Excellent dataset quality - ready for research use")
        elif result['overall_score'] >= 60:
            print("   Good dataset quality - minor improvements recommended")
        elif result['overall_score'] >= 40:
            print("   Moderate dataset quality - several improvements needed")
        else:
            print("   Dataset needs significant quality improvements")
    
    else:
        print("❌ Assessment failed")

if __name__ == "__main__":
    test_platform_assessment()
