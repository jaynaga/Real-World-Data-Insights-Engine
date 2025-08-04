// Mock Kaggle datasets for development/testing
// This simulates what would come from the real Kaggle API

export const mockKaggleDatasets = [
  {
    ref: "ruchi798/mental-health-in-tech-industry",
    title: "Mental Health in Tech Industry",
    subtitle: "Survey data on mental health in technology workplace",
    description: "This dataset contains survey responses about mental health attitudes and experiences in the technology industry.",
    lastUpdated: "2024-12-15T10:30:00Z",
    totalBytes: 2500000,
    downloadCount: 1250,
    voteCount: 89,
    licenseName: "CC0: Public Domain",
    files: [
      {
        name: "mental_health_survey.csv",
        totalBytes: 2200000,
        creationDate: "2024-12-15T10:30:00Z"
      },
      {
        name: "survey_metadata.json",
        totalBytes: 300000,
        creationDate: "2024-12-15T10:30:00Z"
      }
    ],
    tags: [
      { name: "mental health" },
      { name: "technology" },
      { name: "workplace" },
      { name: "survey" }
    ]
  },
  {
    ref: "sarthakvajpayee/depression-and-anxiety-data",
    title: "Depression and Anxiety Dataset",
    subtitle: "Clinical data on depression and anxiety symptoms",
    description: "Dataset containing patient information and symptom assessments for depression and anxiety disorders.",
    lastUpdated: "2024-11-28T15:45:00Z",
    totalBytes: 1800000,
    downloadCount: 956,
    voteCount: 67,
    licenseName: "MIT License",
    files: [
      {
        name: "depression_anxiety_data.csv",
        totalBytes: 1600000,
        creationDate: "2024-11-28T15:45:00Z"
      },
      {
        name: "data_dictionary.txt",
        totalBytes: 200000,
        creationDate: "2024-11-28T15:45:00Z"
      }
    ],
    tags: [
      { name: "depression" },
      { name: "anxiety" },
      { name: "clinical" },
      { name: "healthcare" }
    ]
  },
  {
    ref: "caesarmario/suicide-rates-overview",
    title: "Suicide Rates Overview 1985 to 2016",
    subtitle: "Global suicide statistics and demographics",
    description: "Comprehensive dataset of suicide rates across different countries, years, age groups, and demographics.",
    lastUpdated: "2024-10-12T09:20:00Z",
    totalBytes: 3200000,
    downloadCount: 2134,
    voteCount: 145,
    licenseName: "CC BY-SA 4.0",
    files: [
      {
        name: "master.csv",
        totalBytes: 2800000,
        creationDate: "2024-10-12T09:20:00Z"
      },
      {
        name: "country_codes.csv",
        totalBytes: 400000,
        creationDate: "2024-10-12T09:20:00Z"
      }
    ],
    tags: [
      { name: "suicide" },
      { name: "mental health" },
      { name: "demographics" },
      { name: "global" }
    ]
  },
  {
    ref: "bharathnarasimhan/bipolar-disorder-data",
    title: "Bipolar Disorder Patient Data",
    subtitle: "Clinical records and treatment outcomes",
    description: "Medical records and treatment response data for patients diagnosed with bipolar disorder.",
    lastUpdated: "2024-09-05T14:15:00Z",
    totalBytes: 1500000,
    downloadCount: 678,
    voteCount: 45,
    licenseName: "CC0: Public Domain",
    files: [
      {
        name: "bipolar_patients.csv",
        totalBytes: 1200000,
        creationDate: "2024-09-05T14:15:00Z"
      },
      {
        name: "treatment_outcomes.csv",
        totalBytes: 300000,
        creationDate: "2024-09-05T14:15:00Z"
      }
    ],
    tags: [
      { name: "bipolar" },
      { name: "psychiatric" },
      { name: "treatment" },
      { name: "clinical" }
    ]
  },
  {
    ref: "shivanandmn/autism-spectrum-disorder",
    title: "Autism Spectrum Disorder Screening",
    subtitle: "ASD screening and diagnostic data",
    description: "Dataset for autism spectrum disorder screening with behavioral and demographic features.",
    lastUpdated: "2024-08-20T11:30:00Z",
    totalBytes: 900000,
    downloadCount: 567,
    voteCount: 38,
    licenseName: "MIT License",
    files: [
      {
        name: "autism_screening.csv",
        totalBytes: 800000,
        creationDate: "2024-08-20T11:30:00Z"
      },
      {
        name: "screening_questions.txt",
        totalBytes: 100000,
        creationDate: "2024-08-20T11:30:00Z"
      }
    ],
    tags: [
      { name: "autism" },
      { name: "screening" },
      { name: "behavioral" },
      { name: "diagnostic" }
    ]
  }
];
