import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // State
      user: null,      // Will hold { id, name, role }
      location: null,  // Will hold { id, name }
      isAuthenticated: false,

      // Actions
      setSession: (sessionData) => {
        // Expects sessionData to contain user and location objects from the API
        set({
          user: sessionData.user,
          location: sessionData.location,
          isAuthenticated: true,
        });
      },

      clearSession: () => {
        set({
          user: null,
          location: null,
          isAuthenticated: false,
        });
        // Note: Clearing the separate TokenStore should be handled alongside this.
      },
    }),
    {
      name: 'auth-session-storage', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

export default useAuthStore;