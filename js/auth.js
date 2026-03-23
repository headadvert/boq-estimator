/**
 * AUTH.js - Central Authentication & User Management
 * Handles one-time login, session persistence, and access control
 */

const AUTH = (() => {
  const STORAGE_KEY = 'boq_user_session';
  const APP_VERSION = '3.0.0';

  return {
    /**
     * Save user data to localStorage (called once during signup)
     */
    saveUser(userData) {
      const user = {
        ...userData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    },

    /**
     * Get user data from localStorage
     */
    getUser() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error reading user data:', error);
        return null;
      }
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
      return !!this.getUser();
    },

    /**
     * Update user data (for upgrades, preference changes, etc.)
     */
    updateUser(updates) {
      const user = this.getUser();
      if (!user) return null;
      
      const updated = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },

    /**
     * Logout user (optional - clear all data)
     */
    logout() {
      localStorage.removeItem(STORAGE_KEY);
    },

    /**
     * Get user's access level
     */
    getAccessLevel() {
      const user = this.getUser();
      return user ? user.accessLevel : 'guest';
    },

    /**
     * Get user's plan type
     */
    getPlan() {
      const user = this.getUser();
      return user ? user.plan : 'free';
    },

    /**
     * Check if user has Pro access
     */
    isProUser() {
      return ['pro_monthly', 'pro_annual'].includes(this.getPlan());
    },

    /**
     * Generate unique user ID
     */
    generateId() {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Enforce login - redirect to index if not logged in
     */
    requireLogin() {
      if (!this.isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },

    /**
     * Sync user across tabs/windows
     */
    syncAcrossTabs() {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          // User data changed in another tab
          location.reload();
        }
      });
    }
  };
})();

// Initialize sync on all pages
AUTH.syncAcrossTabs();
