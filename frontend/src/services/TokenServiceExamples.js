// Example usage of TokenService in other services

import TokenService from './TokenService';
import HttpClient from './HttpClient';

// Example: In AuthService.js
export const verifyTokenAndRefreshIfNeeded = async () => {
  try {
    const isValid = await TokenService.ensureValidToken();
    if (!isValid) {
      // Redirect to login if token refresh fails
      window.location.href = '/';
      return false;
    }
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

// Example: Get valid token before making API calls
export const makeAuthenticatedRequest = async (endpoint) => {
  try {
    const validToken = await TokenService.getValidAccessToken();
    if (!validToken) {
      throw new Error('Unable to get valid access token');
    }
    
    // Make your API call with the valid token
    return await HttpClient.get(endpoint);
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
};

// Example: Manual token refresh
export const manualTokenRefresh = async () => {
  try {
    const result = await TokenService.refreshToken();
    if (result.success) {
      console.log('Token refreshed successfully');
      return result.access_token;
    } else {
      console.error('Token refresh failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return null;
  }
};
