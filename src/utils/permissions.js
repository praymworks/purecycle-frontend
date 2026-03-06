// Permission utility functions

import { roles } from '../data';

/**
 * Get user role object from roles data
 * @param {string} userRole - User role name (e.g., 'Admin', 'Staff')
 * @returns {object|null} Role object or null if not found
 */
export const getUserRoleObject = (userRole) => {
  if (!userRole) return null;
  return roles.find(role => role.name.toLowerCase() === userRole.toLowerCase());
};

/**
 * Check if user has a specific permission
 * @param {object} user - User object with role property
 * @param {string} permission - Permission slug to check (e.g., 'view_dashboard')
 * @returns {boolean} True if user has permission, false otherwise
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const roleObject = getUserRoleObject(user.role);
  if (!roleObject) return false;
  
  return roleObject.permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {object} user - User object with role property
 * @param {string[]} permissions - Array of permission slugs
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user || !user.role || !Array.isArray(permissions)) return false;
  
  const roleObject = getUserRoleObject(user.role);
  if (!roleObject) return false;
  
  return permissions.some(permission => roleObject.permissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {object} user - User object with role property
 * @param {string[]} permissions - Array of permission slugs
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user || !user.role || !Array.isArray(permissions)) return false;
  
  const roleObject = getUserRoleObject(user.role);
  if (!roleObject) return false;
  
  return permissions.every(permission => roleObject.permissions.includes(permission));
};

/**
 * Get all permissions for a user
 * @param {object} user - User object with role property
 * @returns {string[]} Array of permission slugs
 */
export const getUserPermissions = (user) => {
  if (!user || !user.role) return [];
  
  const roleObject = getUserRoleObject(user.role);
  if (!roleObject) return [];
  
  return roleObject.permissions;
};
