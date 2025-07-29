import useTokenStore from '../store/TokenStore';

class HttpClient {
  constructor() {
    this.baseURL = '/api/v1';
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      const tokenStore = useTokenStore.getState();
      const token = tokenStore.getAccessToken?.() || 
                   tokenStore.accessToken || 
                   tokenStore.access_token || 
                   tokenStore.token;  
      return true;
      // replace with true !!token && token.length > 0;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Redirect to login
  redirectToLogin(reason = 'Authentication required') {
    console.warn(`${reason}, redirecting to login`);
    
    // Clear any existing tokens
    try {
      const tokenStore = useTokenStore.getState();
      if (tokenStore.clearTokens) {
        tokenStore.clearTokens();
      }
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
    
    // Redirect
    window.location.href = '/';
  }

  // Helper method to get headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      if (!this.isAuthenticated()) {
        this.redirectToLogin('No valid authentication token found');
        throw new Error('Authentication required');
      }

      try {
        const tokenStore = useTokenStore.getState();
        const token = tokenStore.getAccessToken?.() || 
                     tokenStore.accessToken || 
                     tokenStore.access_token || 
                     tokenStore.token;
        
        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        this.redirectToLogin('Failed to retrieve authentication token');
        throw error;
      }
    }

    return headers;
  }

  // Helper method for form data headers
  getFormHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (includeAuth) {
      if (!this.isAuthenticated()) {
        this.redirectToLogin('No valid authentication token found');
        throw new Error('Authentication required');
      }

      try {
        const tokenStore = useTokenStore.getState();
        const token = tokenStore.getAccessToken?.() || 
                     tokenStore.accessToken || 
                     tokenStore.access_token || 
                     tokenStore.token;
        
        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        this.redirectToLogin('Failed to retrieve authentication token');
        throw error;
      }
    }

    return headers;
  }

  // Enhanced response handler
  async handleResponse(response) {
    if (response.status === 401) {
      this.redirectToLogin('Token expired or invalid');
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // GET request
  async get(endpoint, includeAuth = true) {
    try {
      console.log('Making GET request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('GET request failed:', error);
      throw error;
    }
  }

  // POST request
  async post(endpoint, data, includeAuth = true) {
    try {
      console.log('Making POST request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  }

  // POST with form data (for OAuth endpoints)
  async postForm(endpoint, formData, includeAuth = false) {
    try {
      console.log('Making POST form request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getFormHeaders(includeAuth),
        body: formData,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('POST form request failed:', error);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, includeAuth = true) {
    try {
      console.log('Making PUT request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  }

  // PATCH request
  async patch(endpoint, data, includeAuth = true) {
    try {
      console.log('Making PATCH request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('PATCH request failed:', error);
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint, includeAuth = true) {
    try {
      console.log('Making DELETE request to:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(endpoint, file, includeAuth = true) {
    try {
      console.log('Uploading file to:', `${this.baseURL}${endpoint}`);
      
      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      if (includeAuth) {
        if (!this.isAuthenticated()) {
          this.redirectToLogin('No valid authentication token found');
          throw new Error('Authentication required');
        }

        const tokenStore = useTokenStore.getState();
        const token = tokenStore.getAccessToken?.() || 
                     tokenStore.accessToken || 
                     tokenStore.access_token || 
                     tokenStore.token;
        
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(endpoint, includeAuth = true) {
    try {
      console.log('Downloading file from:', `${this.baseURL}${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new HttpClient();