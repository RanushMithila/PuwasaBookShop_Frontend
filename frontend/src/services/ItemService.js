import HttpClient from './HttpClient';

class ItemService {
  /**
   * Add a new item
   * @param {Object} itemData - Item data object
   * @returns {Promise<Object>} Response object with success/error status
   */
  async addItem(itemData) {
    try {
      console.log('ItemService: Adding item:', itemData);
      
      const response = await HttpClient.post('/inventory/addItem', itemData, true);
      
      console.log('ItemService: Add item response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Item added successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to add item'
        };
      }
    } catch (error) {
      console.error('ItemService: Add item error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add item'
      };
    }
  }

  /**
   * Update an existing item
   * @param {number} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} Response object with success/error status
   */
  async updateItem(itemId, itemData) {
    try {
      console.log('ItemService: Updating item:', itemId, itemData);
      
      const response = await HttpClient.put(`/inventory/updateItem/${itemId}`, itemData, true);
      
      console.log('ItemService: Update item response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Item updated successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to update item'
        };
      }
    } catch (error) {
      console.error('ItemService: Update item error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update item'
      };
    }
  }

  /**
   * Update stock level for an item at a specific location
   * @param {number} itemId - Item ID
   * @param {number} locationId - Location ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Response object with success/error status
   */
  async updateStockLevel(itemId, locationId, quantity) {
    try {
      console.log('ItemService: Updating stock level:', { itemId, locationId, quantity });
      
      const response = await HttpClient.put(`/inventory/updateStockLevel/${itemId}/${locationId}?quantity=${quantity}`, {}, true);
      
      console.log('ItemService: Update stock level response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Stock level updated successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to update stock level'
        };
      }
    } catch (error) {
      console.error('ItemService: Update stock level error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update stock level'
      };
    }
  }

  /**
   * Get item quantity by barcode and location
   * @param {string} barcode - Item barcode
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with quantity data
   */
  async getItemQuantity(barcode, locationId) {
    try {
      console.log('ItemService: Getting item quantity:', { barcode, locationId });
      
      const response = await HttpClient.get(`/inventory/getItemQTY/${barcode}/${locationId}`, false);
      
      console.log('ItemService: Get item quantity response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          error: response?.error_message || 'Failed to get item quantity'
        };
      }
    } catch (error) {
      console.error('ItemService: Get item quantity error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get item quantity'
      };
    }
  }

  /**
   * Get item by barcode and location
   * @param {string} barcode - Item barcode
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with item data
   */
  async getItemByBarcode(barcode, locationId) {
    try {
      console.log('ItemService: Getting item by barcode:', { barcode, locationId });
      
      const response = await HttpClient.get(`/inventory/getItem/${barcode}/${locationId}`, false);
      
      console.log('ItemService: Get item by barcode response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          error: response?.error_message || 'Item not found'
        };
      }
    } catch (error) {
      console.error('ItemService: Get item by barcode error:', error);
      
      // Preserve specific HTTP status codes for better error messaging
      let errorMessage = error.message || 'Failed to get item';
      if (error.status === 404) {
        errorMessage = `Item with barcode "${barcode}" not found at location ${locationId}`;
      } else if (error.status === 400) {
        errorMessage = 'Invalid barcode or location ID format';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get items by name and location
   * @param {string} name - Item name (partial search)
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with items data
   */
  async getItemsByName(name, locationId) {
    try {
      console.log('ItemService: Getting items by name:', { name, locationId });
      
      const response = await HttpClient.get(`/inventory/getItemName/${encodeURIComponent(name)}/${locationId}`, false);
      
      console.log('ItemService: Get items by name response:', response);

      // Note: API returns status: false even when data is found
      if (response && response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response?.error_message || 'Items not found'
        };
      }
    } catch (error) {
      console.error('ItemService: Get items by name error:', error);
      
      // Preserve specific HTTP status codes for better error messaging
      let errorMessage = error.message || 'Failed to search items';
      if (error.status === 404) {
        errorMessage = `No items found with name containing "${name}" at location ${locationId}`;
      } else if (error.status === 400) {
        errorMessage = 'Invalid search parameters';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Delete item by ID
   * @param {number} itemId - Item ID
   * @returns {Promise<Object>} Response object with success/error status
   */
  async deleteItem(itemId) {
    try {
      console.log('ItemService: Deleting item:', itemId);
      
      const response = await HttpClient.delete(`/inventory/deleteItem/${itemId}`, true);
      
      console.log('ItemService: Delete item response:', response);

      if (response && response.status === true) {
        return {
          success: true,
          message: response.message || 'Item deleted successfully'
        };
      } else {
        return {
          success: false,
          error: response?.error_message || response?.message || 'Failed to delete item'
        };
      }
    } catch (error) {
      console.error('ItemService: Delete item error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete item'
      };
    }
  }

  /**
   * Search items (combines barcode and name search)
   * @param {string} searchTerm - Search term (barcode or name)
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Response object with search results
   */
  async searchItems(searchTerm, locationId) {
    try {
      console.log('ItemService: Searching items:', { searchTerm, locationId });

      // Try barcode search first
      let result = await this.getItemByBarcode(searchTerm, locationId);
      
      if (result.success && result.data.length > 0) {
        return result;
      }

      // If barcode search fails, try name search
      result = await this.getItemsByName(searchTerm, locationId);
      
      return result;
    } catch (error) {
      console.error('ItemService: Search items error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search items'
      };
    }
  }
}

export default new ItemService();
