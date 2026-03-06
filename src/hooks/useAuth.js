/**
 * useAuth Hook
 * Custom React hook for authentication
 * Provides easy access to auth functions and current user
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  login as authLogin, 
  logout as authLogout, 
  getCurrentUser, 
  isAuthenticated as checkAuth,
  updateUserData 
} from '../services/authService';

/**
 * useAuth Hook
 * @returns {object} Auth state and functions
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = checkAuth();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Login result
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authLogin(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {object} userData - Updated user data
   */
  const updateProfile = useCallback((userData) => {
    try {
      updateUserData(userData);
      setUser(prev => ({ ...prev, ...userData }));
    } catch (error) {
      console.error('Update profile error:', error);
    }
  }, []);

  /**
   * Refresh user data from localStorage
   */
  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(currentUser !== null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    refreshUser
  };
};

export default useAuth;
