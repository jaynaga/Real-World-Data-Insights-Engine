import json
import boto3
import pandas as pd
import io
import uuid
import logging
from datetime import datetime
from urllib.parse import unquote_plus

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# -------- FAIRshake-Inspired Rubric -------- #
RUBRIC = {
    "Findable": {
        "Has persistent identifier": lambda m: bool(m.get("doi") or m.get("persistent_id")),
        "Has rich metadata": lambda m: bool(m.get("description") and m.get("keywords")),
        "Metadata includes identifier": lambda m: "identifier" in m or "doi" in m,
        "Is indexed in a searchable resource": lambda m: m.get("indexed_in_portal", False)
    },
    "Accessible": {
        "Retrievable by standard protocol": lambda m: m.get("protocol") in ["https", "ftp"],
        "Metadata remains accessible": lambda m: m.get("metadata_stability") == "stable",
        "Clear access conditions": lambda m: m.get("access_level") in ["public", "registered"]
    },
    "Interoperable": {
        "Uses formal knowledge representation": lambda m: m.get("format") in ["RDF", "OWL", "JSON-LD"],
        "Uses FAIR vocabularies": lambda m: m.get("vocabularies_fair") is True,
        "Links to other datasets": lambda m: bool(m.get("linked_datasets"))
    },
    "Reusable": {
        "Rich metadata and accurate attributes": lambda m: bool(m.get("curator") and m.get("provenance")),
        "Clearly stated license": lambda m: bool(m.get("license")),
        "Detailed provenance": lambda m: bool(m.get("provenance")),
        "Meets community standards": lambda m: m.get("community_standards") is True
    }
}

def infer_keywords_from_columns(columns):
    """Extract meaningful keywords from dataset column names"""
    if not columns:
        return []
    
    # Convert columns to strings and clean them up
    keywords = []
    for col in columns:
        if isinstance(col, str):
            # Split on common separators and clean
            parts = col.lower().replace("_", " ").replace("-", " ").replace(".", " ").split()
            keywords.extend(parts)
    
    # Remove duplicates and common stop words
    stop_words = {'id', 'key', 'index', 'value', 'data', 'item', 'record'}
    unique_keywords = list(set(keywords) - stop_words)
    
    return unique_keywords[:10]  # Limit to top 10 keywords

def extract_metadata_from_file(file_content, filename, submitted_by):
    """Extract metadata from uploaded file content"""
    ext = filename.lower().split('.')[-1] if '.' in filename else 'unknown'
    df = None
    
    try:
        # Try to parse the file based on extension
        if ext == "csv":
            # Use StringIO for Python 3.13 compatibility
            df = pd.read_csv(io.StringIO(file_content.decode('utf-8')), nrows=5)
        elif ext == "json":
            try:
                # Try parsing as JSON
                json_data = json.loads(file_content.decode('utf-8'))
                if isinstance(json_data, list) and json_data:
                    df = pd.DataFrame(json_data[:5])  # First 5 records
                elif isinstance(json_data, dict):
                    df = pd.DataFrame([json_data])
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON file: {filename}")
        elif ext in ["xls", "xlsx"]:
            df = pd.read_excel(io.BytesIO(file_content), nrows=5)
        else:
            logger.info(f"Unsupported file type: {ext}")
    except Exception as e:
        logger.warning(f"Unable to parse file {filename}: {str(e)}")

    # Generate metadata
    metadata = {
        "persistent_id": str(uuid.uuid4()),
        "description": f"Auto-generated metadata for {filename}",
        "keywords": infer_keywords_from_columns(df.columns.tolist()) if df is not None else [],
        "indexed_in_portal": False,
        "protocol": "https",
        "metadata_stability": "stable",
        "access_level": "public",
        "format": ext.upper(),
        "vocabularies_fair": False,
        "linked_datasets": [],
        "curator": submitted_by,
        "provenance": f"Uploaded by {submitted_by} on {datetime.utcnow().isoformat()}",
        "license": "CC-BY",
        "community_standards": False,
        "file_size": len(file_content),
        "upload_timestamp": datetime.utcnow().isoformat()
    }
    
    # Add dataset-specific metadata if we could parse it
    if df is not None:
        metadata.update({
            "row_count": len(df),
            "column_count": len(df.columns),
            "column_names": df.columns.tolist()
        })
    
    return metadata

def score_metadata(metadata):
    """Score the metadata against FAIR principles"""
    detailed_results = {}
    category_totals = {}
    total_score = 0
    total_possible = 0

    for category, metrics in RUBRIC.items():
        cat_score = 0
        detailed_results[category] = {}

        for metric_desc, check_fn in metrics.items():
            try:
                result = check_fn(metadata)
                score = int(bool(result))
            except Exception as e:
                logger.warning(f"Error scoring '{metric_desc}': {str(e)}")
                score = 0
                
            detailed_results[category][metric_desc] = score
            cat_score += score

        category_totals[category] = cat_score
        total_score += cat_score
        total_possible += len(metrics)

    fair_percentage = round((total_score / total_possible) * 100, 2) if total_possible > 0 else 0.0

    return {
        "detailed_score": detailed_results,
        "category_totals": category_totals,
        "total_score": total_score,
        "total_possible": total_possible,
        "fair_percentage": fair_percentage
    }

def lambda_handler(event, context):
    """Main Lambda handler function"""
    s3 = boto3.client('s3')
    
    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])
            
            logger.info(f"Processing file: {key} from bucket: {bucket}")

            try:
                # Get the uploaded file
                response = s3.get_object(Bucket=bucket, Key=key)
                file_content = response['Body'].read()
                
                # Extract submitter info (fallback to 'system' if not available)
                submitted_by = "system"
                if 'userIdentity' in record and 'principalId' in record['userIdentity']:
                    submitted_by = record['userIdentity']['principalId']

                # Extract metadata and calculate FAIR score
                metadata = extract_metadata_from_file(file_content, key, submitted_by)
                score = score_metadata(metadata)

                logger.info(f"Generated FAIR score: {score['fair_percentage']}% for {key}")

                # Create the score document
                score_document = {
                    "dataset": key,
                    "metadata": metadata,
                    "fair_score": score,
                    "generated_at": datetime.utcnow().isoformat(),
                    "version": "1.0"
                }

                # Store FAIR score in the same S3 folder as fairscore.json
                if '/' in key:
                    folder_path = key.rsplit('/', 1)[0]
                    score_key = f"{folder_path}/fairscore.json"
                else:
                    score_key = "fairscore.json"

                # Upload the score file
                s3.put_object(
                    Bucket=bucket,
                    Key=score_key,
                    Body=json.dumps(score_document, indent=2),
                    ContentType='application/json'
                )

                logger.info(f"FAIR score saved to: {score_key}")

            except Exception as e:
                logger.error(f"Error processing file {key} from bucket {bucket}: {str(e)}")
                # Continue processing other files even if one fails
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'FAIR scoring completed successfully',
                'processed_files': len(event['Records'])
            })
        }

    except Exception as e:
        logger.error(f"Fatal error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'FAIR scoring failed',
                'message': str(e)
            })
        }
