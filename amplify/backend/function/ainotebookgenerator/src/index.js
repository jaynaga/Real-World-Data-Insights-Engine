const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const DYNAMO_TABLE = process.env.DYNAMO_TABLE_NAME || 'NotebookJobs';

/**
 * Build Bedrock prompt dynamically based on user input
 */
function buildPrompt(goal, filesList, expertiseLevel, analysisDepth) {
  const explanationStyle =
    expertiseLevel === "nontechnical"
      ? "Explain every step in simple English, define key terms, and give business-friendly interpretations."
      : expertiseLevel === "advanced"
      ? "Use concise technical explanations and statistical reasoning."
      : "Balance technical depth with clear explanations.";

  const depthInstructions =
    analysisDepth === "basic"
      ? "Focus only on descriptive statistics and simple charts."
      : analysisDepth === "standard"
      ? "Include hypothesis testing, correlations, and trends."
      : "Include predictive modeling (Random Forest, SVM), feature importance, and actionable insights.";

  // ✅ Cleanly extract just file names
  const minimalFileList = filesList
    .split("\n")
    .map(line => {
      const match = line.match(/-\s*([^:]+)/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean)
    .join(", ");

  // ✅ Final prompt string (no stray JS inside it)
  return `
  <system>
  You are an API that outputs ONLY valid Jupyter notebook JSON. Your response must be strictly valid JSON, parsable by JSON.parse, and must conform to the official Jupyter notebook schema. If your output is invalid, you must retry and self-correct until it is valid.
  </system>

  <instructions>
  Goal: ${goal}
  - ${depthInstructions}
  - Use ${explanationStyle}
  - After each major code block, add a markdown cell explaining the results based on the user's expertise.
  - Return your entire response strictly inside <notebook_json>...</notebook_json> tags, with no extra text outside the tags.
  - Use the following schema as a template:
  <notebook_json>
  {
    "cells": [
      {
        "cell_type": "markdown",
        "metadata": { "language": "markdown" },
        "source": ["# Title", "Description..."]
      },
      {
        "cell_type": "code",
        "metadata": { "language": "python" },
        "source": ["import pandas as pd"]
      }
    ],
    "metadata": {},
    "nbformat": 4,
    "nbformat_minor": 2
  }
  </notebook_json>
  - Do not include any cell IDs for new cells.
  - Do not include any text outside the <notebook_json> tags.
  - If your output is invalid, retry and self-correct until it is valid JSON.
  </instructions>

  Available Dataset Files: ${minimalFileList}
  `;
  }

async function generateAINotebook(goal, files, expertiseLevel, analysisDepth) {
  try {
    console.log("📡 Calling Bedrock AI model...");

    // Build file list for prompt
    const filesList = files
      .map(f => `- ${f.name}: ${f.description || "Dataset"}`)
      .join("\n");

    const prompt = buildPrompt(goal, filesList, expertiseLevel, analysisDepth);

    // ✅ Call Bedrock
    const bedrockResponse = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        }),
        contentType: "application/json",
        accept: "application/json",
      })
    );

    const responseObj = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    let rawText = responseObj.content?.[0]?.text?.trim() || '';
    console.log("📄 Raw Bedrock response:", rawText);

    // Extract JSON block from <notebook_json> tags
    const notebookTagMatch = rawText.match(/<notebook_json>([\s\S]*?)<\/notebook_json>/);
    let notebookJsonText = notebookTagMatch ? notebookTagMatch[1].trim() : rawText;
    // Remove trailing commas before } or ]
    notebookJsonText = notebookJsonText.replace(/,\s*([}\]])/g, '$1');

    // Validate against Jupyter notebook schema
    let notebook;
    let isValid = false;
    try {
      notebook = JSON.parse(notebookJsonText);
      // Basic schema check: must have 'cells' array
      isValid = notebook && Array.isArray(notebook.cells);
    } catch (e) {
      isValid = false;
    }
    if (!isValid) {
      console.warn("Invalid notebook JSON detected. Raw text:", notebookJsonText);
    } else {
      console.log("✅ Parsed notebook JSON successfully on first try");
      // Only retry if not valid
      return notebook;
    }

    // If invalid, re-prompt Claude with correction request
    // If invalid, re-prompt Claude with correction request
    let retryCount = 0;
    while (!isValid && retryCount < 2) {
      console.warn("⚠️ Notebook JSON invalid, retrying with self-correction prompt...");
      // Re-prompt with correction instruction
      const correctionPrompt = `Here is your last invalid response: ${notebookJsonText}. Fix it so it passes strict JSON validation and conforms to the Jupyter notebook schema. Return only valid JSON inside <notebook_json> tags.`;
      const correctionResponse = await bedrockClient.send(
        new InvokeModelCommand({
          modelId: "anthropic.claude-3-haiku-20240307-v1:0",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            messages: [{ role: "user", content: correctionPrompt }],
            max_tokens: 4000,
          }),
          contentType: "application/json",
          accept: "application/json",
        })
      );
      const correctionObj = JSON.parse(new TextDecoder().decode(correctionResponse.body));
      rawText = correctionObj.content?.[0]?.text?.trim() || '';
      const retryMatch = rawText.match(/<notebook_json>([\s\S]*?)<\/notebook_json>/);
      notebookJsonText = retryMatch ? retryMatch[1].trim() : rawText;
      notebookJsonText = notebookJsonText.replace(/,\s*([}\]])/g, '$1');
      try {
        notebook = JSON.parse(notebookJsonText);
        isValid = notebook && Array.isArray(notebook.cells);
      } catch (e) {
        isValid = false;
      }
      if (!isValid) {
        console.warn("Invalid notebook JSON detected. Raw text:", notebookJsonText);
      } else {
        console.log("✅ Parsed notebook JSON successfully after retry");
        return notebook;
      }
      retryCount++;
    }

    if (!isValid) {
      throw new Error("Model did not return valid notebook JSON after retries.");
    }
    console.log("✅ Parsed notebook JSON successfully");
    // Add disclaimer cell at the top
    const disclaimerCell = {
      cell_type: "markdown",
      metadata: { language: "markdown" },
      source: [
        "**This notebook was generated by the Real World Data Insights Engine.**",
        "\n",
        "The information and analyses herein are machine-generated and should be double-checked for accuracy and relevance. This notebook is intended as a starting point for further exploration, not as a conclusive report."
      ]
    };
    if (Array.isArray(notebook.cells)) {
      notebook.cells.unshift(disclaimerCell);
    }
    return notebook;

  } catch (error) {
    console.error("❌ Failed to generate AI notebook:", error);
    throw new Error(`AI Notebook generation failed: ${error.message}`);
  }
}
/**
 * Upload AI-generated notebook to S3
 */
async function uploadNotebookToS3(notebook, projectId, bucketName, event) {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const randomId = Math.random().toString(36).substring(2, 10);

    const identityId =
    event.identity?.cognitoIdentityId ||
    event.requestContext?.identity?.cognitoIdentityId ||
    event.queryStringParameters?.identityId ||
    (typeof event.body === "string" ? JSON.parse(event.body).identityId : event.body?.identityId);

    if (!identityId) {
      throw new Error("Missing Cognito identityId. Make sure frontend passes it.");
    }

    const notebookKey = `protected/${identityId}/notebooks/${projectId}/healthcare_analysis_${timestamp}_${randomId}.ipynb`;

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: notebookKey,
      Body: JSON.stringify(notebook),
      ContentType: 'application/x-ipynb+json',
      ContentDisposition: 'attachment; filename="notebook.ipynb"',
      Metadata: {
        'project-id': projectId,
        'generated-by': 'ai-notebook-generator',
        'timestamp': timestamp,
        'content-type': 'jupyter-notebook'
      }
    });

    await s3Client.send(putCommand);

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: notebookKey
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    return { downloadUrl, notebookKey };

  } catch (error) {
    console.error("❌ S3 upload failed:", error);
    throw new Error(`Failed to save notebook to S3: ${error.message}`);
  }
}

/**
 * Helper: Standard CORS response
 */
function createCorsResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

function createErrorResponse(statusCode, message) {
  return createCorsResponse(statusCode, {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}


/**
 * ✅ Lambda Handler (SQS async job processor)
 */
exports.handler = async (event) => {
  try {
    console.log("🔹 Raw Event Received:", JSON.stringify(event, null, 2));

    // ✅ Handle OPTIONS Preflight (CORS)
    if (event.httpMethod === "OPTIONS") {
      return createCorsResponse(200, { success: true });
    }

    // ✅ Flexible Parsing
    let payload;
    if (Array.isArray(event.Records)) {
      payload = event.Records.map((r) => r.body ? JSON.parse(r.body) : r);
    } else if (event.body) {
      payload = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } else {
      payload = event;
    }

    console.log("✅ Parsed Payload:", JSON.stringify(payload, null, 2));

    // Extract new parameters
    const expertiseLevel = payload.expertiseLevel || "intermediate";
    const analysisDepth = payload.analysisDepth || "standard";
    const projectId = payload.projectId || payload.id || "unknown";

    // ✅ Generate Notebook (adaptive)
    const notebook = await generateAINotebook(
      payload.goal,
      payload.files,
      expertiseLevel,
      analysisDepth
    );

    // ✅ Upload notebook to S3
    const bucketName = "rwde-dev-datasets37fb9-rwde";
    const uploadResult = await uploadNotebookToS3(notebook, projectId, bucketName, event);

    return createCorsResponse(200, {
      success: true,
      notebook,
      downloadUrl: uploadResult.downloadUrl,
      notebookKey: uploadResult.notebookKey
    });
  } catch (error) {
    console.error("❌ Handler Error:", error);
    return createErrorResponse(500, error.message);
  }
};