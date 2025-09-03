import HttpClient from './HttpClient';

class CategoryService {
  /**
   * Add a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.CategoryName - Category name
   * @param {string} categoryData.CategoryDescription - Category description
   * @returns {Promise<Object>} API response
   */
  async addCategory(categoryData) {
    try {
      console.log('=== ADDING CATEGORY ===');
      console.log('Category data:', categoryData);

      const response = await HttpClient.post('/inventory/addCategory', categoryData, true);
      
      console.log('Add category response:', response);
      
      if (response && response.status) {
        console.log('✅ Category added successfully:', response.message);
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        console.error('❌ Category add failed:', response?.error_message || 'Unknown error');
        return {
          success: false,
          error: response?.error_message || 'Failed to add category'
        };
      }
    } catch (error) {
      console.error('❌ Category add error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Update an existing category
   * @param {number} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @param {string} categoryData.CategoryName - Category name
   * @param {string} categoryData.CategoryDescription - Category description
   * @returns {Promise<Object>} API response
   */
  async updateCategory(categoryId, categoryData) {
    try {
      console.log('=== UPDATING CATEGORY ===');
      console.log('Category ID:', categoryId);
      console.log('Category data:', categoryData);

      const response = await HttpClient.put(`/inventory/updateCategory/${categoryId}`, categoryData, true);
      
      console.log('Update category response:', response);
      
      if (response && response.status) {
        console.log('✅ Category updated successfully:', response.message);
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        console.error('❌ Category update failed:', response?.error_message || 'Unknown error');
        return {
          success: false,
          error: response?.error_message || 'Failed to update category'
        };
      }
    } catch (error) {
      console.error('❌ Category update error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get a specific category by ID
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} API response
   */
  async getCategory(categoryId) {
    try {
      console.log('=== GETTING CATEGORY ===');
      console.log('Category ID:', categoryId);

      // Note: The get category endpoint doesn't require authentication based on curl example
      const response = await HttpClient.get(`/inventory/getCategory/${categoryId}`, false);
      
      console.log('Get category response:', response);
      
      if (response && (response.CategoryName || response.CategoryDescription)) {
        console.log('✅ Category retrieved successfully');
        // Add CategoryID to response since API doesn't return it
        const categoryData = {
          CategoryID: categoryId,
          CategoryName: response.CategoryName,
          CategoryDescription: response.CategoryDescription
        };
        return {
          success: true,
          data: categoryData
        };
      } else {
        console.error('❌ Category not found or invalid response structure');
        return {
          success: false,
          error: 'Category not found'
        };
      }
    } catch (error) {
      console.error('❌ Category get error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Delete a category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} API response
   */
  async deleteCategory(categoryId) {
    try {
      console.log('=== DELETING CATEGORY ===');
      console.log('Category ID:', categoryId);

      const response = await HttpClient.delete(`/inventory/deleteCategory/${categoryId}`, true);
      
      console.log('Delete category response:', response);
      
      if (response && response.status) {
        console.log('✅ Category deleted successfully:', response.message);
        return {
          success: true,
          message: response.message
        };
      } else {
        console.error('❌ Category delete failed:', response?.error_message || 'Unknown error');
        return {
          success: false,
          error: response?.error_message || 'Failed to delete category'
        };
      }
    } catch (error) {
      console.error('❌ Category delete error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get all categories (if such endpoint exists)
   * Note: This might need to be implemented later if the API provides a list endpoint
   * @returns {Promise<Object>} API response
   */
  async getAllCategories() {
    try {
      console.log('=== GETTING ALL CATEGORIES ===');
      
      // Note: This endpoint might not exist yet, but adding for future use
      const response = await HttpClient.get('/inventory/categories', true);
      
      console.log('Get all categories response:', response);
      
      if (response) {
        console.log('✅ Categories retrieved successfully');
        return {
          success: true,
          data: response
        };
      } else {
        console.error('❌ Failed to get categories');
        return {
          success: false,
          error: 'Failed to get categories'
        };
      }
    } catch (error) {
      console.error('❌ Get all categories error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }
}

// Export a singleton instance
export default new CategoryService();
