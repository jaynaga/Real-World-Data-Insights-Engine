#!/bin/bash

# Simple packaging script for AWS Lambda
echo "Installing dependencies..."

# Create virtual environment using built-in venv
python3 -m venv ./venv
source ./venv/bin/activate

# Install dependencies
pip install boto3>=1.26.0 pandas>=1.5.0 openpyxl>=3.1.0

# Copy the lambda function
cp fair_scorer_lambda.py ./

echo "Packaging complete!"
