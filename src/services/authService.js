/**
 * Authentication Service - Backend Integration
 * Handles user authentication, token storage, and session management
 */

import api from './api';

// LocalStorage keys
const TOKEN_KEY = 'purecycle_auth_token';
const USER_KEY = 'purecycle_user_data';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Object with success, token, user, or error
 */
export const login = async (email, password) => {
  try {
    // Call real backend API
    const response = await api.auth.login({ email, password });
    
    if (response.success) {
      const { token, user } = response.data;
      
      // Check if user is admin or staff (web portal restriction)
      if (user.role !== 'admin' && user.role !== 'staff') {
        return {
          success: false,
          error: 'Access denied. Only administrators and staff can access this portal.'
        };
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        return {
          success: false,
          error: `Account is ${user.status}. Please contact administrator.`
        };
      }

      // Save to localStorage
      saveAuthData(token, user);

      return {
        success: true,
        token,
        user
      };
    } else {
      return {
        success: false,
        error: response.message || 'Login failed'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Invalid email or password. Please try again.'
    };
  }
};

/**
 * Logout user and clear session
 */
export const logout = async () => {
  try {
    // Call backend logout API to invalidate token
    await api.auth.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage even if API call fails
    clearAuthData();
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<object|null>} User object or null
 */
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    // Call backend to get current user
    const response = await api.auth.getCurrentUser();
    
    if (response.success) {
      // Backend returns user directly in data, not data.user
      const user = response.data;
      // Update stored user data
      saveUser(user);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    // If token is invalid, clear auth data
    clearAuthData();
    return null;
  }
};

/**
 * Refresh authentication token
 * @returns {Promise<string|null>} New token or null
 */
export const refreshToken = async () => {
  try {
    const response = await api.auth.refreshToken();
    
    if (response.success) {
      const { token } = response.data;
      saveToken(token);
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthData();
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getStoredUser();
  return !!(token && user);
};

/**
 * Get stored token from localStorage
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user from localStorage
 * @returns {object|null} User object or null
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  
  // Check if userData exists and is not "undefined" string
  if (!userData || userData === 'undefined' || userData === 'null') {
    return null;
  }
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    // Silently return null if parsing fails (avoid console spam)
    return null;
  }
};

/**
 * Check if user has specific role
 * @param {string|array} roles - Role or array of roles to check
 * @returns {boolean} True if user has role
 */
export const hasRole = (roles) => {
  const user = getStoredUser();
  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
};

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
export const isAdmin = () => {
  return hasRole('admin');
};

/**
 * Check if user is staff
 * @returns {boolean} True if user is staff
 */
export const isStaff = () => {
  return hasRole('staff');
};

/**
 * Check if user is admin or staff
 * @returns {boolean} True if user is admin or staff
 */
export const isAdminOrStaff = () => {
  return hasRole(['admin', 'staff']);
};

/**
 * Save authentication data to localStorage
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
const saveAuthData = (token, user) => {
  saveToken(token);
  saveUser(user);
};

/**
 * Save token to localStorage
 * @param {string} token - JWT token
 */
const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Save user to localStorage
 * @param {object} user - User object
 */
const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clear all authentication data from localStorage
 */
const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Initialize auth state (call on app startup)
 * Checks if token is valid and refreshes if needed
 */
export const initializeAuth = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Verify token by fetching current user
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    clearAuthData();
    return false;
  }
};

/**
 * Update user data in localStorage
 * @param {Object} userData - Updated user data
 */
export const updateUserData = (userData) => {
  if (userData) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  isAuthenticated,
  getToken,
  getStoredUser,
  hasRole,
  isAdmin,
  isStaff,
  isAdminOrStaff,
  initializeAuth,
  updateUserData,
};
