import httpClient from './HttpClient';

/**
 * Logs in a user by exchanging credentials for an access token.
 * This function specifically handles the 'application/x-www-form-urlencoded'
 * content type required by FastAPI's default OAuth2 password flow.
 *
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The token data, typically { access_token, token_type }.
 */
export const login = async (username, password) => {
  try {
    // Create form data for the token endpoint
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', 'password'); // Required by OAuth2 spec

    // Use a dedicated 'postForm' method in HttpClient or a custom call
    // This call does not include the default 'Authorization' header
    const response = await httpClient.postForm('/auth/token', formData, false);
    
    // The response should be { access_token: "...", token_type: "bearer" }
    return response;
  } catch (error) {
    console.error('Login API call failed:', error);
    // Re-throw the error so the calling component (e.g., LoginPage) can handle it
    throw error;
  }
};

/**
 * Fetches the profile information for the currently authenticated user.
 * This should be called after a successful login and the token is stored.
 * It relies on the HttpClient to automatically include the 'Authorization' header.
 *
 * @returns {Promise<object>} The user's profile data, including user and location info.
 */
export const getProfile = async () => {
  try {
    // This endpoint should be protected and return the current user's data
    // Example endpoint: '/users/me'
    const profileData = await httpClient.get('/users/me');
    
    // MOCK RESPONSE STRUCTURE (for example):
    // {
    //   "user": { "id": 1, "name": "Ranu", "role": "Admin" },
    //   "location": { "id": 1, "name": "Main Branch" }
    // }
    return profileData;
  } catch (error) {
    console.error('Get profile failed:', error);
    throw error;
  }
};