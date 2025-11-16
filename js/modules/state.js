/**
 * State Management Module
 * Manages global application state
 */

class StateManager {
  constructor() {
    this.state = {
      user: null,
      dummyMode: this.getDummyMode(),
      darkMode: this.getDarkMode(),
      settings: {},
      currentPage: '',
      sidebarCollapsed: this.getSidebarState()
    };
    
    this.listeners = new Map();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state
   */
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Notify listeners
    Object.keys(updates).forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => {
          callback(this.state[key], oldState[key]);
        });
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Set user
   */
  setUser(user) {
    this.setState({ user });
  }

  /**
   * Get user
   */
  getUser() {
    return this.state.user;
  }

  /**
   * Clear user (logout)
   */
  clearUser() {
    this.setState({ user: null });
  }

  /**
   * Toggle dummy mode
   */
  toggleDummyMode() {
    const newMode = !this.state.dummyMode;
    this.setState({ dummyMode: newMode });
    localStorage.setItem('k7_dummy_mode', JSON.stringify(newMode));
    return newMode;
  }

  /**
   * Set dummy mode
   */
  setDummyMode(enabled) {
    this.setState({ dummyMode: enabled });
    localStorage.setItem('k7_dummy_mode', JSON.stringify(enabled));
  }

  /**
   * Get dummy mode from localStorage
   */
  getDummyMode() {
    // PRODUCTION MODE: Always return false (disabled dummy mode)
    // Clear any stored dummy mode setting
    localStorage.removeItem('k7_dummy_mode');
    return false; // Always use real data from Supabase
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const newMode = !this.state.darkMode;
    this.setState({ darkMode: newMode });
    localStorage.setItem('k7_dark_mode', JSON.stringify(newMode));
    this.applyDarkMode(newMode);
    return newMode;
  }

  /**
   * Set dark mode
   */
  setDarkMode(enabled) {
    this.setState({ darkMode: enabled });
    localStorage.setItem('k7_dark_mode', JSON.stringify(enabled));
    this.applyDarkMode(enabled);
  }

  /**
   * Get dark mode from localStorage
   */
  getDarkMode() {
    const stored = localStorage.getItem('k7_dark_mode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Apply dark mode to document
   */
  applyDarkMode(enabled) {
    if (enabled) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    const newState = !this.state.sidebarCollapsed;
    this.setState({ sidebarCollapsed: newState });
    localStorage.setItem('k7_sidebar_collapsed', JSON.stringify(newState));
    return newState;
  }

  /**
   * Get sidebar state from localStorage
   */
  getSidebarState() {
    const stored = localStorage.getItem('k7_sidebar_collapsed');
    return stored ? JSON.parse(stored) : false;
  }

  /**
   * Set settings
   */
  setSettings(settings) {
    this.setState({ settings });
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.state.settings;
  }

  /**
   * Update single setting
   */
  updateSetting(key, value) {
    const settings = { ...this.state.settings, [key]: value };
    this.setState({ settings });
  }

  /**
   * Set current page
   */
  setCurrentPage(page) {
    this.setState({ currentPage: page });
  }

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.state.currentPage;
  }

  /**
   * Initialize state from storage and system
   */
  initialize() {
    // Apply dark mode
    this.applyDarkMode(this.state.darkMode);
    
    // Apply sidebar state
    if (this.state.sidebarCollapsed) {
      document.querySelector('.sidebar')?.classList.add('collapsed');
    }
  }
}

// Create singleton instance
const state = new StateManager();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => state.initialize());
} else {
  state.initialize();
}

export default state;
