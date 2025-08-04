import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        window.close();
        return;
      }

      if (!code || !state) {
        console.error('Missing code or state parameter');
        window.close();
        return;
      }

      // Verify state matches what we stored
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        console.error('State mismatch - potential CSRF attack');
        window.close();
        return;
      }

      // Extract provider from state
      const [providerId] = state.split('_');
      
      try {
        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(providerId, code);
        
        if (tokenResponse.access_token) {
          // Store the access token
          localStorage.setItem(`${providerId}_access_token`, tokenResponse.access_token);
          
          if (tokenResponse.expires_in) {
            const expiryTime = new Date(Date.now() + tokenResponse.expires_in * 1000);
            localStorage.setItem(`${providerId}_token_expiry`, expiryTime.toISOString());
          }

          console.log(`Successfully connected to ${providerId}`);
        }
      } catch (error) {
        console.error('Error exchanging code for token:', error);
      } finally {
        // Clean up and close popup
        localStorage.removeItem('oauth_state');
        window.close();
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  const exchangeCodeForToken = async (providerId, code) => {
    // In a real implementation, this would be done server-side for security
    // For demo purposes, we'll simulate the token exchange
    
    const redirectUri = `${window.location.origin}/oauth-callback`;
    
    const clientIds = {
      googledrive: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      dropbox: process.env.REACT_APP_DROPBOX_CLIENT_ID,
      onedrive: process.env.REACT_APP_MICROSOFT_CLIENT_ID
    };

    const clientSecrets = {
      googledrive: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      dropbox: process.env.REACT_APP_DROPBOX_CLIENT_SECRET,
      onedrive: process.env.REACT_APP_MICROSOFT_CLIENT_SECRET
    };

    let tokenUrl = '';
    let body = {};

    switch (providerId) {
      case 'googledrive':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        body = {
          client_id: clientIds[providerId],
          client_secret: clientSecrets[providerId],
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        };
        break;
      case 'dropbox':
        tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
        body = {
          client_id: clientIds[providerId],
          client_secret: clientSecrets[providerId],
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        };
        break;
      case 'onedrive':
        tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        body = {
          client_id: clientIds[providerId],
          client_secret: clientSecrets[providerId],
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        };
        break;
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }

    // NOTE: In production, this should be done server-side to keep client secrets secure
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body)
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
