# Cloud Storage Integration Setup

This guide explains how to set up cloud storage integrations for the RWDE platform, allowing users to share datasets directly from their cloud storage accounts.

## Supported Providers

- **Google Drive** - OAuth 2.0 integration
- **Dropbox** - OAuth 2.0 integration  
- **Microsoft OneDrive** - OAuth 2.0 integration
- **Amazon S3** - Credential-based access
- **Azure Storage** - Credential-based access

## OAuth Setup Instructions

### 1. Google Drive Integration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add your domain to authorized origins: `http://localhost:3000` (for development)
6. Add redirect URI: `http://localhost:3000/oauth-callback`
7. Copy the Client ID and Client Secret to your `.env.local` file

### 2. Dropbox Integration

1. Go to the [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose "Scoped access" and "Full Dropbox"
4. Set permissions: `files.metadata.read`, `files.content.read`
5. Add redirect URI: `http://localhost:3000/oauth-callback`
6. Copy the App key and App secret to your `.env.local` file

### 3. Microsoft OneDrive Integration

1. Go to [Azure App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Register a new application
3. Add redirect URI: `http://localhost:3000/oauth-callback`
4. Add API permissions: `Microsoft Graph > Files.Read`
5. Copy the Application (client) ID and client secret to your `.env.local` file

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your OAuth credentials:

```bash
cp .env.example .env.local
```

## Security Considerations

⚠️ **Important**: In a production environment, OAuth client secrets should be handled server-side, not in the frontend React app. The current implementation is simplified for demonstration purposes.

### Recommended Production Architecture:

1. **Backend OAuth Handler**: Create API endpoints that handle OAuth flows server-side
2. **Token Proxy**: Store access tokens securely on the server, not in localStorage  
3. **File Proxy**: Download files server-side and stream to users instead of direct client access
4. **CORS Configuration**: Properly configure CORS for your domain

## Features

### File Sharing Options

When users import files from cloud storage, they can configure:

- **Public Access**: Make datasets viewable by all platform users
- **Download Permissions**: Allow or restrict file downloads
- **Expiration Dates**: Set automatic access expiration
- **View-Only Mode**: Users can view data through the platform without downloading original files

### Supported File Types

The platform supports importing these file types from cloud storage:

- **Data Files**: CSV, JSON, Excel (.xlsx, .xls), TSV, Parquet
- **Documentation**: PDF, Word documents, Markdown, plain text
- **Archives**: ZIP, TAR files (automatically extracted)
- **Images**: PNG, JPG, JPEG (for visualization datasets)

## Usage Flow

1. **Connect Provider**: Users authenticate with their cloud storage provider
2. **Browse Files**: Browse and select files from their cloud storage
3. **Configure Sharing**: Set access permissions and sharing options
4. **Import**: Files are linked to the platform with metadata
5. **Share**: Other users can discover and use the shared datasets

## File Access Methods

### Reference-Based (Recommended)
- Files remain in the user's cloud storage
- Platform stores metadata and access credentials
- Real-time access to latest file versions
- User maintains full control over their data

### Copy-Based (Optional)
- Files are copied to platform storage
- Faster access for other users
- Uses more platform storage space
- Snapshot of data at import time

## API Integration

The cloud storage system integrates with:

- **Dataset Discovery**: Cloud files appear in the explore page
- **Project Integration**: Cloud datasets can be used in projects  
- **Visualization**: Cloud data works with all visualization tools
- **FAIR Scoring**: Cloud datasets get FAIR assessment scores
- **Access Control**: Sharing settings integrate with platform permissions

## Troubleshooting

### OAuth Errors
- Verify redirect URIs match exactly
- Check that APIs are enabled in provider consoles
- Ensure client IDs/secrets are correct in environment variables

### File Access Issues
- Check that OAuth tokens haven't expired
- Verify user still has access to files in their cloud storage
- Confirm file permissions allow read access

### CORS Issues
- Ensure your domain is added to OAuth app settings
- Check that redirect URIs include the correct protocol (http/https)

## Development Testing

For local development, you can use these test values:

1. Set up localhost OAuth apps with providers
2. Use `http://localhost:3000/oauth-callback` as redirect URI
3. Test with small files first
4. Verify sharing permissions work correctly

## Future Enhancements

Planned improvements:

- **Advanced File Filtering**: Filter by file type, size, date modified
- **Folder-Level Sharing**: Share entire folders as datasets
- **Sync Integration**: Automatically update datasets when cloud files change
- **Multiple Provider Links**: Link the same dataset from multiple cloud providers
- **Advanced Analytics**: Track usage patterns and popular shared datasets
