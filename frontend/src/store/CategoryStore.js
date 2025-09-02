import { create } from 'zustand';
import CategoryService from '../services/CategoryService';

const useCategoryStore = create((set, get) => ({
  // State
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
  successMessage: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, successMessage: null }),
  setSuccessMessage: (message) => set({ successMessage: message, error: null }),
  clearMessages: () => set({ error: null, successMessage: null }),

  // Add category
  addCategory: async (categoryData) => {
    console.log('Store: Adding category:', categoryData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await CategoryService.addCategory(categoryData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Category added successfully',
          error: null
        });
        
        // Refresh categories list if needed
        // get().loadCategories();
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to add category',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Store: Add category error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to add category',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    console.log('Store: Updating category:', categoryId, categoryData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await CategoryService.updateCategory(categoryId, categoryData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Category updated successfully',
          error: null,
          currentCategory: result.data
        });
        
        // Update category in the list if it exists
        const { categories } = get();
        const updatedCategories = categories.map(cat => 
          cat.CategoryID === categoryId ? result.data : cat
        );
        set({ categories: updatedCategories });
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to update category',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Store: Update category error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to update category',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Get category by ID
  getCategory: async (categoryId) => {
    console.log('Store: Getting category:', categoryId);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await CategoryService.getCategory(categoryId);
      
      if (result.success) {
        set({
          loading: false,
          currentCategory: result.data,
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to get category',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Store: Get category error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to get category',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    console.log('Store: Deleting category:', categoryId);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await CategoryService.deleteCategory(categoryId);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Category deleted successfully',
          error: null
        });
        
        // Remove category from the list
        const { categories } = get();
        const updatedCategories = categories.filter(cat => cat.CategoryID !== categoryId);
        set({ categories: updatedCategories });
        
        // Clear current category if it was the deleted one
        const { currentCategory } = get();
        if (currentCategory && currentCategory.CategoryID === categoryId) {
          set({ currentCategory: null });
        }
        
        return { success: true };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to delete category',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Store: Delete category error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to delete category',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Load all categories (for future use)
  loadCategories: async () => {
    console.log('Store: Loading all categories');
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await CategoryService.getAllCategories();
      
      if (result.success) {
        set({
          loading: false,
          categories: result.data || [],
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to load categories',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Store: Load categories error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to load categories',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Set current category
  setCurrentCategory: (category) => set({ currentCategory: category }),

  // Clear current category
  clearCurrentCategory: () => set({ currentCategory: null }),

  // Reset store
  reset: () => set({
    categories: [],
    currentCategory: null,
    loading: false,
    error: null,
    successMessage: null
  })
}));

export default useCategoryStore;
