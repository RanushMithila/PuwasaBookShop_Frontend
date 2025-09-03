import { create } from 'zustand';
import ItemService from '../services/ItemService';

const useItemStore = create((set, get) => ({
  // State
  items: [],
  currentItem: null,
  searchResults: [],
  loading: false,
  error: null,
  successMessage: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, successMessage: null }),
  setSuccessMessage: (message) => set({ successMessage: message, error: null }),
  clearMessages: () => set({ error: null, successMessage: null }),

  // Add item
  addItem: async (itemData) => {
    console.log('ItemStore: Adding item:', itemData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.addItem(itemData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Item added successfully',
          error: null
        });
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to add item',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Add item error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to add item',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Update item
  updateItem: async (itemId, itemData) => {
    console.log('ItemStore: Updating item:', itemId, itemData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.updateItem(itemId, itemData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Item updated successfully',
          error: null,
          currentItem: result.data
        });
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to update item',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Update item error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to update item',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Update stock level
  updateStockLevel: async (itemId, locationId, quantity) => {
    console.log('ItemStore: Updating stock level:', { itemId, locationId, quantity });
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.updateStockLevel(itemId, locationId, quantity);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Stock level updated successfully',
          error: null
        });
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to update stock level',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Update stock level error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to update stock level',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Get item by barcode
  getItemByBarcode: async (barcode, locationId) => {
    console.log('ItemStore: Getting item by barcode:', { barcode, locationId });
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.getItemByBarcode(barcode, locationId);
      
      if (result.success) {
        const firstItem = result.data.length > 0 ? result.data[0] : null;
        set({
          loading: false,
          currentItem: firstItem,
          searchResults: result.data,
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Item not found',
          successMessage: null,
          searchResults: []
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Get item by barcode error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to get item',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Search items
  searchItems: async (searchTerm, locationId) => {
    console.log('ItemStore: Searching items:', { searchTerm, locationId });
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.searchItems(searchTerm, locationId);
      
      if (result.success) {
        const firstItem = result.data.length > 0 ? result.data[0] : null;
        set({
          loading: false,
          searchResults: result.data,
          currentItem: firstItem,
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'No items found',
          successMessage: null,
          searchResults: []
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Search items error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to search items',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Get item quantity
  getItemQuantity: async (barcode, locationId) => {
    console.log('ItemStore: Getting item quantity:', { barcode, locationId });
    
    try {
      const result = await ItemService.getItemQuantity(barcode, locationId);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Get item quantity error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete item
  deleteItem: async (itemId) => {
    console.log('ItemStore: Deleting item:', itemId);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await ItemService.deleteItem(itemId);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Item deleted successfully',
          error: null
        });
        
        return { success: true };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to delete item',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('ItemStore: Delete item error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to delete item',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Set current item
  setCurrentItem: (item) => set({ currentItem: item }),

  // Clear current item
  clearCurrentItem: () => set({ currentItem: null }),

  // Clear search results
  clearSearchResults: () => set({ searchResults: [] }),

  // Reset store
  reset: () => set({
    items: [],
    currentItem: null,
    searchResults: [],
    loading: false,
    error: null,
    successMessage: null
  })
}));

export default useItemStore;
