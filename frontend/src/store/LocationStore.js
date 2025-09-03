import { create } from 'zustand';
import LocationService from '../services/LocationService';

const useLocationStore = create((set, get) => ({
  // State
  locations: [],
  currentLocation: null,
  loading: false,
  error: null,
  successMessage: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, successMessage: null }),
  setSuccessMessage: (message) => set({ successMessage: message, error: null }),
  clearMessages: () => set({ error: null, successMessage: null }),

  // Add location
  addLocation: async (locationData) => {
    console.log('LocationStore: Adding location:', locationData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await LocationService.addLocation(locationData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Location added successfully',
          error: null
        });
        
        // Refresh locations list if needed
        // get().loadLocations();
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to add location',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('LocationStore: Add location error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to add location',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Update location
  updateLocation: async (locationId, locationData) => {
    console.log('LocationStore: Updating location:', locationId, locationData);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await LocationService.updateLocation(locationId, locationData);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Location updated successfully',
          error: null,
          currentLocation: result.data
        });
        
        // Update location in the list if it exists
        const { locations } = get();
        const updatedLocations = locations.map(loc => 
          loc.LocationID === locationId ? result.data : loc
        );
        set({ locations: updatedLocations });
        
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to update location',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('LocationStore: Update location error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to update location',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Get location by ID
  getLocation: async (locationId) => {
    console.log('LocationStore: Getting location:', locationId);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await LocationService.getLocation(locationId);
      
      if (result.success) {
        set({
          loading: false,
          currentLocation: result.data,
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to get location',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('LocationStore: Get location error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to get location',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Delete location
  deleteLocation: async (locationId) => {
    console.log('LocationStore: Deleting location:', locationId);
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await LocationService.deleteLocation(locationId);
      
      if (result.success) {
        set({
          loading: false,
          successMessage: result.message || 'Location deleted successfully',
          error: null
        });
        
        // Remove location from the list
        const { locations } = get();
        const updatedLocations = locations.filter(loc => loc.LocationID !== locationId);
        set({ locations: updatedLocations });
        
        // Clear current location if it was the deleted one
        const { currentLocation } = get();
        if (currentLocation && currentLocation.LocationID === locationId) {
          set({ currentLocation: null });
        }
        
        return { success: true };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to delete location',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('LocationStore: Delete location error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to delete location',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Load all locations (for future use)
  loadLocations: async () => {
    console.log('LocationStore: Loading all locations');
    set({ loading: true, error: null, successMessage: null });
    
    try {
      const result = await LocationService.getAllLocations();
      
      if (result.success) {
        set({
          loading: false,
          locations: result.data || [],
          error: null
        });
        return { success: true, data: result.data };
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to load locations',
          successMessage: null
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('LocationStore: Load locations error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to load locations',
        successMessage: null
      });
      return { success: false, error: error.message };
    }
  },

  // Set current location
  setCurrentLocation: (location) => set({ currentLocation: location }),

  // Clear current location
  clearCurrentLocation: () => set({ currentLocation: null }),

  // Reset store
  reset: () => set({
    locations: [],
    currentLocation: null,
    loading: false,
    error: null,
    successMessage: null
  })
}));

export default useLocationStore;
