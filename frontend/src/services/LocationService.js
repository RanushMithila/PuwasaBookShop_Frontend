import HttpClient from './HttpClient';

class LocationService {
  /**
   * Add a new location
   * @param {Object} locationData - Location data object
   * @param {string} locationData.locationName - Location name
   * @param {string} locationData.address1 - Address line 1
   * @param {string} locationData.address2 - Address line 2
   * @param {string} locationData.city - City
   * @param {string} locationData.province - Province
   * @param {string} locationData.country - Country
   * @returns {Promise<Object>} Response object with success/error status
   */
  async addLocation(locationData) {
    try {
      console.log('LocationService: Adding location:', locationData);
      
      const response = await HttpClient.post('/inventory/addLocation', locationData, true);
      
      console.log('LocationService: Add location response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Location added successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to add location'
        };
      }
    } catch (error) {
      console.error('LocationService: Add location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add location'
      };
    }
  }

  /**
   * Update an existing location
   * @param {number} locationId - Location ID
   * @param {Object} locationData - Updated location data
   * @returns {Promise<Object>} Response object with success/error status
   */
  async updateLocation(locationId, locationData) {
    try {
      console.log('LocationService: Updating location:', locationId, locationData);
      
      const response = await HttpClient.put(`/inventory/updateLocation/${locationId}`, locationData, true);
      
      console.log('LocationService: Update location response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Location updated successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to update location'
        };
      }
    } catch (error) {
      console.error('LocationService: Update location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }

  /**
   * Get location by ID
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with location data
   */
  async getLocation(locationId) {
    try {
      console.log('LocationService: Getting location:', locationId);
      
      const response = await HttpClient.get(`/inventory/getLocation/${locationId}`, false);
      
      console.log('LocationService: Get location response:', response);

      if (response) {
        // The API returns location data directly, not wrapped in status object
        return {
          success: true,
          data: {
            LocationID: locationId,
            LocationName: response.locationName,
            Address1: response.address1,
            Address2: response.address2,
            City: response.city,
            Province: response.province,
            Country: response.country
          }
        };
      } else {
        return {
          success: false,
          error: 'Location not found'
        };
      }
    } catch (error) {
      console.error('LocationService: Get location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get location'
      };
    }
  }

  /**
   * Delete location by ID
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with success/error status
   */
  async deleteLocation(locationId) {
    try {
      console.log('LocationService: Deleting location:', locationId);
      
      const response = await HttpClient.delete(`/inventory/deleteLocation/${locationId}`, true);
      
      console.log('LocationService: Delete location response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Location deleted successfully'
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to delete location'
        };
      }
    } catch (error) {
      console.error('LocationService: Delete location error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete location'
      };
    }
  }

  /**
   * Get all locations (for future use)
   * @returns {Promise<Object>} Response object with locations array
   */
  async getAllLocations() {
    try {
      console.log('LocationService: Getting all locations');
      
      const response = await HttpClient.get('/inventory/getAllLocations', true);
      
      console.log('LocationService: Get all locations response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          error: response?.error_message || 'Failed to get locations'
        };
      }
    } catch (error) {
      console.error('LocationService: Get all locations error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get locations'
      };
    }
  }
}

export default new LocationService();
