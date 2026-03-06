/**
 * Authentication Service
 * Handles user authentication, token storage, and session management
 * Ready for API migration - replace mock login with API calls
 */

import { users } from '../data';
import { generateToken, verifyToken, isTokenExpired } from './jwtService';

// LocalStorage keys
const TOKEN_KEY = 'purecycle_auth_token';
const USER_KEY = 'purecycle_user_data';

/**
 * Login user with email and password
 * READY FOR API: Replace this with fetch('/api/login', {...})
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Object with success, token, user, or error
 */
export const login = async (email, password) => {
  try {
    // TODO: Replace with API call when backend is ready
    // const response = await fetch('/api/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await response.json();
    // if (data.success) {
    //   saveAuthData(data.token, data.user);
    //   return { success: true, token: data.token, user: data.user };
    // }

    // MOCK: Find user in JSON data
    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // RESTRICT: Only admin and staff can login to web portal
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

    // Generate JWT token (async)
    const token = await generateToken(user);

    if (!token) {
      return {
        success: false,
        error: 'Failed to generate authentication token'
      };
    }

    // Save to localStorage (encrypted as JWT)
    saveAuthData(token, user);

    return {
      success: true,
      token,
      user: mapUserData(user)
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login'
    };
  }
};

/**
 * Logout user and clear session
 * READY FOR API: Add API call to invalidate token on server
 */
export const logout = async () => {
  try {
    // TODO: Add API call to logout endpoint
    // await fetch('/api/logout', {
    //   method: 'POST',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getToken()}`
    //   }
    // });

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Clear localStorage anyway
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: false, error: error.message };
  }
};

/**
 * Get current authenticated user from localStorage
 * Verifies token before returning user data
 * 
 * @returns {Promise<object|null>} User object or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    
    if (!token) return null;

    // Verify token is valid and not expired
    if (isTokenExpired(token)) {
      await logout(); // Auto logout if token expired
      return null;
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      await logout(); // Auto logout if token invalid
      return null;
    }

    // Return user data in frontend format
    return mapUserData(decoded);

  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken();
  
  if (!token) return false;
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    logout(); // Auto logout
    return false;
  }

  // Verify token is valid
  const decoded = verifyToken(token);
  return decoded !== null;
};

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Save authentication data to localStorage
 * Token is already encrypted (JWT)
 * 
 * @param {string} token - JWT token
 * @param {object} user - User data
 */
const saveAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(mapUserData(user)));
};

/**
 * Map user data from database format to frontend format
 * Makes it easier to transition from JSON to API
 * 
 * @param {object} user - User data from DB/JSON
 * @returns {object} Mapped user data for frontend
 */
const mapUserData = (user) => {
  return {
    user_id: user.user_id,
    email: user.email,
    name: user.fullname || user.name, // Support both formats
    fullname: user.fullname || user.name,
    contactNo: user.contact_number || user.contactNo,
    contact_number: user.contact_number || user.contactNo,
    municipality: user.city_municipality || user.municipality,
    city_municipality: user.city_municipality || user.municipality,
    barangay: user.barangay,
    purok: user.purok,
    role: mapRoleToDisplay(user.role), // Display format (Admin, Staff, etc.)
    roleSlug: user.role, // Database format (admin, staff, etc.)
    profilePath: user.profile_path || user.profilePath,
    profile_path: user.profile_path || user.profilePath,
    status: user.status
  };
};

/**
 * Map role slug to display format
 * @param {string} role - Role slug (admin, staff, purok_leader, business_owner)
 * @returns {string} Display role (Admin, Staff, Purok Leader, Business Owner)
 */
const mapRoleToDisplay = (role) => {
  const roleMap = {
    'admin': 'Admin',
    'staff': 'Staff',
    'purok_leader': 'Purok Leader',
    'business_owner': 'Business Owner',
    'viewer': 'Viewer'
  };
  return roleMap[role] || role;
};

/**
 * Get authorization header for API requests
 * @returns {object} Headers object with Authorization token
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Update user data in localStorage
 * Used when user updates profile
 * 
 * @param {object} userData - Updated user data
 */
export const updateUserData = async (userData) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    // Optionally regenerate token with new data
    const token = await generateToken(updatedUser);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Update user data error:', error);
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getToken,
  getAuthHeaders,
  updateUserData
};
