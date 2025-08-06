# Kaggle API Setup Guide

This guide will help you set up Kaggle API authentication to enable psychiatric dataset integration.

## Prerequisites

1. A Kaggle account (free - sign up at https://www.kaggle.com)
2. API access enabled on your Kaggle account

## Step 1: Get Kaggle API Credentials

1. **Log in to Kaggle**: Go to https://www.kaggle.com and sign in
2. **Navigate to Account Settings**: Click your profile picture → Account
3. **Find API Section**: Scroll down to the "API" section
4. **Create API Token**: Click "Create New API Token"
5. **Download kaggle.json**: This will download a file containing your credentials

## Step 2: Extract Credentials

Open the downloaded `kaggle.json` file. It should look like:
```json
{
  "username": "your_username",
  "key": "abc123def456ghi789..."
}
```

## Step 3: Configure Environment Variables

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit .env.local** and add your Kaggle credentials:
   ```bash
   REACT_APP_KAGGLE_USERNAME=your_username
   REACT_APP_KAGGLE_KEY=abc123def456ghi789...
   ```

## Step 4: Restart Development Server

```bash
npm start
```

## Step 5: Verify Integration

1. Navigate to the Explore page
2. You should see psychiatric datasets from Kaggle appearing alongside local datasets
3. Kaggle datasets will have an orange "Kaggle" badge
4. Check the browser console for any authentication errors

## What You'll Get

Once configured, the platform will automatically:

- Search Kaggle for psychiatric and mental health datasets
- Filter results using keywords like: mental health, depression, anxiety, psychiatric, etc.
- Display them in your explore page with proper tagging
- Allow users to click through to view/download datasets on Kaggle

## Troubleshooting

### Common Issues:

1. **"Kaggle API credentials not configured"**
   - Check that your .env.local file exists and has the correct variable names
   - Restart the development server after adding credentials

2. **"Kaggle API authentication failed"**
   - Verify your username and key are correct
   - Check that your Kaggle account has API access enabled
   - Try regenerating your API token

3. **"No psychiatric datasets found"**
   - This is normal if Kaggle's search doesn't return psychiatric datasets
   - The system filters results to only show psychiatric-related content
   - You may need to adjust the search keywords if needed

4. **Rate limiting errors**
   - Kaggle has API rate limits
   - The system will show an appropriate error message
   - Wait a few minutes and try again

## Security Note

⚠️ **Important**: The current implementation stores API credentials in the frontend environment variables, which means they're visible in the browser. For production use, consider:

1. Moving API calls to a backend service
2. Using a proxy server to hide credentials
3. Implementing proper API key rotation

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your Kaggle account has API access
3. Ensure your API token hasn't expired
4. Try regenerating your API token if authentication fails
