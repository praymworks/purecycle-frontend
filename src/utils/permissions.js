// Permission utility functions for role-based access control
// Works with backend role_details structure containing permissions array

/**
 * Check if user has a specific permission
 * @param {object} user - User object from backend with role_details
 * @param {string} permissionSlug - Permission slug (e.g., 'view_dashboard', 'create_user')
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permissionSlug) => {
  if (!user || !permissionSlug) {
    console.warn('🔒 hasPermission: Missing user or permission', { user: !!user, permissionSlug });
    return false;
  }
  
  // Check if user has role_details with permissions from backend
  if (user.role_details && user.role_details.permissions && Array.isArray(user.role_details.permissions)) {
    const hasAccess = user.role_details.permissions.some(p => {
      // Permission can be an object with slug or just a string
      const pSlug = typeof p === 'object' ? p.slug : p;
      return pSlug === permissionSlug;
    });
    
    // if (hasAccess) {
    //   console.log('✅ hasPermission: Access granted', { 
    //     role: user.role, 
    //     permissionSlug,
    //     totalPermissions: user.role_details.permissions.length 
    //   });
    // } else {
    //   console.warn('❌ hasPermission: Access denied', { 
    //     role: user.role, 
    //     permissionSlug,
    //     userPermissions: user.role_details.permissions.map(p => p.slug || p).slice(0, 10) // Show first 10
    //   });
    // }
    
    return hasAccess;
  }
  
  // console.error('🔒 hasPermission: User missing role_details.permissions!', { 
  //   role: user.role, 
  //   hasRoleDetails: !!user.role_details,
  //   hasPermissions: !!(user.role_details?.permissions),
  //   roleDetails: user.role_details
  // });
  
  return false;
};

/**
 * Check if user has any of the specified permissions
 * @param {object} user - User object from backend with role_details
 * @param {string[]} permissionSlugs - Array of permission slugs
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (user, permissionSlugs) => {
  if (!user || !Array.isArray(permissionSlugs)) {
    return false;
  }
  
  // Check if user has at least one permission
  return permissionSlugs.some(permSlug => hasPermission(user, permSlug));
};

/**
 * Check if user has all of the specified permissions
 * @param {object} user - User object from backend with role_details
 * @param {string[]} permissionSlugs - Array of permission slugs
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (user, permissionSlugs) => {
  if (!user || !Array.isArray(permissionSlugs)) {
    return false;
  }
  
  // Check if user has all permissions
  return permissionSlugs.every(permSlug => hasPermission(user, permSlug));
};

/**
 * Get all permissions for a user
 * @param {object} user - User object from backend with role_details
 * @returns {string[]} Array of permission slugs
 */
export const getUserPermissions = (user) => {
  if (!user) return [];
  
  // Get permissions from role_details
  if (user.role_details && user.role_details.permissions && Array.isArray(user.role_details.permissions)) {
    return user.role_details.permissions.map(p => {
      // Permission can be an object with slug or just a string
      return typeof p === 'object' ? p.slug : p;
    });
  }
  
  return [];
};

/**
 * Check if user has a specific role
 * @param {object} user - User object
 * @param {string} roleSlug - Role slug (e.g., 'admin', 'staff')
 * @returns {boolean} True if user has the role
 */
export const hasRole = (user, roleSlug) => {
  if (!user || !roleSlug) return false;
  return user.role === roleSlug;
};

/**
 * Check if user has any of the specified roles
 * @param {object} user - User object
 * @param {string[]} roleSlugs - Array of role slugs
 * @returns {boolean} True if user has any of the roles
 */
export const hasAnyRole = (user, roleSlugs) => {
  if (!user || !Array.isArray(roleSlugs)) return false;
  return roleSlugs.includes(user.role);
};

/**
 * Check if user can access a specific module
 * @param {object} user - User object from backend with role_details
 * @param {string} modulePermission - Module view permission slug (e.g., 'view_user_management_module')
 * @returns {boolean} True if user can access the module
 */
export const canAccessModule = (user, modulePermission) => {
  return hasPermission(user, modulePermission);
};

// Export all permission checking functions
export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  hasRole,
  hasAnyRole,
  canAccessModule,
};
