# RealWorld Insights Engine: Mental Health Analytics (Georgetown HIDS Capstone)

This repository contains code and documentation for the Georgetown University Health Informatics and Data Science Capstone Project in collaboration with ICA, focused on developing an AI-powered mental health analytics platform using AWS cloud tools and real-world public health data.

## Project Scope
- Mental health data ingestion and harmonization
- Predictive modeling and AI-based analysis of trends, disparities, and risk factors
- Real-time visualization tools and dashboards for public health users

## Tech Stack
- **AWS Services:**
  - S3: Storage for raw and processed datasets
  - Glue: ETL jobs for cleaning and harmonization
  - Kinesis: Streaming data ingestion (if applicable)
  - SageMaker: Model development and deployment
  - Bedrock: Natural language querying and hypothesis generation
  - QuickSight: Dashboard creation and visualization
- **Languages & Libraries:**
  - Python (pandas, NumPy, scikit-learn, TensorFlow)
  - SQL
  - Tableau / QuickSight for visualizations

## Directory Structure
```
├── data_ingestion/
│   └── pipeline_scripts.py
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
│   └── model_dev.ipynb
├── models/
│   └── exported_model.joblib
├── dashboards/
│   └── quicksight_config/
├── docs/
│   └── final_report.pdf
├── .gitignore
├── requirements.txt
└── README.md
```

## Key Deliverables
1. **Data Integration Framework** – Cleaned and harmonized mental health data pipelines on AWS.
2. **AI/ML Model** – Deployed predictive model for mental health trends and risk factors.
3. **Dashboards** – Interactive visualizations for public health decision-makers.
4. **Capstone Report & Presentation** – Documented findings, challenges, and demos.