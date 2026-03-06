/**
 * API Service Layer
 * Simulates backend API with joins for relational data
 * Ready for migration - just replace with fetch('/api/...')
 */

import { users, purokLeaders, businessOwners } from '../data';

/**
 * Get all users with joined data (like SQL JOIN)
 * Simulates: SELECT * FROM users 
 *            LEFT JOIN purok_leaders ON users.user_id = purok_leaders.user_id
 *            LEFT JOIN business_owners ON users.user_id = business_owners.user_id
 * 
 * READY FOR API: Replace with fetch('/api/users')
 * 
 * @returns {Promise<Array>} Users with joined data
 */
export const getAllUsers = async () => {
  try {
    // TODO: Replace with API call
    // const response = await fetch('/api/users');
    // const data = await response.json();
    // return data;

    // MOCK: Simulate API response with joins
    const usersWithRelations = users.map(user => {
      const baseUser = {
        id: `${user.role.toUpperCase().substring(0, 3)}-${String(user.user_id).padStart(3, '0')}`, // e.g., ADM-001
        user_id: user.user_id,
        name: user.fullname,
        email: user.email,
        contactNo: user.contact_number,
        role: mapRoleToDisplay(user.role),
        roleSlug: user.role,
        municipality: user.city_municipality,
        barangay: user.barangay,
        purok: user.purok,
        status: capitalizeFirst(user.status),
        dateCreated: formatDate(user.created_at),
        profilePath: user.profile_path,
      };

      // JOIN with purok_leaders table
      if (user.role === 'purok_leader') {
        const purokLeader = purokLeaders.find(pl => pl.user_id === user.user_id);
        if (purokLeader) {
          baseUser.documents = {
            'Valid ID': purokLeader.valid_id_document,
          };
        }
      }

      // JOIN with business_owners table
      if (user.role === 'business_owner') {
        const businessOwner = businessOwners.find(bo => bo.user_id === user.user_id);
        if (businessOwner) {
          baseUser.businessName = businessOwner.business_name;
          baseUser.businessType = 'Business'; // Not in current schema
          // Format: Municipality/City + Barangay + Purok
          const addressParts = [user.city_municipality, user.barangay, user.purok].filter(Boolean);
          baseUser.businessAddress = addressParts.join(', ');
          baseUser.documents = {
            'Business Permit': businessOwner.business_permit,
            'Valid ID': businessOwner.valid_id_document,
          };
        }
      }

      return baseUser;
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return usersWithRelations;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Get single user by ID with joined data
 * Simulates: SELECT * FROM users WHERE user_id = ?
 *            LEFT JOIN purok_leaders ...
 *            LEFT JOIN business_owners ...
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}`)
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User with joined data
 */
export const getUserById = async (userId) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}`);
    // const data = await response.json();
    // return data;

    const allUsers = await getAllUsers();
    const user = allUsers.find(u => u.user_id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

/**
 * Create new user
 * Simulates: INSERT INTO users ... 
 *            (and INSERT INTO purok_leaders or business_owners if needed)
 * 
 * READY FOR API: Replace with fetch('/api/users', { method: 'POST', ... })
 * 
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch('/api/users', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(userData)
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Simulate user creation
    console.log('Creating user:', userData);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'User created successfully',
      user: {
        user_id: Math.max(...users.map(u => u.user_id)) + 1,
        ...userData
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update user
 * Simulates: UPDATE users SET ... WHERE user_id = ?
 *            (and UPDATE purok_leaders or business_owners if needed)
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}`, { method: 'PUT', ... })
 * 
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(userData)
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Simulate user update
    console.log('Updating user:', userId, userData);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'User updated successfully',
      user: {
        user_id: userId,
        ...userData
      }
    };
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete user
 * Simulates: DELETE FROM users WHERE user_id = ?
 *            (CASCADE will delete related purok_leaders or business_owners)
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}`, { method: 'DELETE' })
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export const deleteUser = async (userId) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}`, {
    //   method: 'DELETE'
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Simulate user deletion
    console.log('Deleting user:', userId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

/**
 * Approve user (change status to approved)
 * Simulates: UPDATE users SET status = 'approved' WHERE user_id = ?
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}/approve`, { method: 'POST' })
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export const approveUser = async (userId) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}/approve`, {
    //   method: 'POST'
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Simulate user approval
    console.log('Approving user:', userId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'User approved successfully'
    };
  } catch (error) {
    console.error('Approve user error:', error);
    throw error;
  }
};

/**
 * Reject user (change status to rejected)
 * Simulates: UPDATE users SET status = 'rejected' WHERE user_id = ?
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}/reject`, { method: 'POST' })
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export const rejectUser = async (userId) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}/reject`, {
    //   method: 'POST'
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Simulate user rejection
    console.log('Rejecting user:', userId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'User rejected successfully'
    };
  } catch (error) {
    console.error('Reject user error:', error);
    throw error;
  }
};

/**
 * Reset user password
 * Simulates: UPDATE users SET password = ? WHERE user_id = ?
 * 
 * READY FOR API: Replace with fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Success response with new password
 */
export const resetUserPassword = async (userId) => {
  try {
    // TODO: Replace with API call
    // const response = await fetch(`/api/users/${userId}/reset-password`, {
    //   method: 'POST'
    // });
    // const data = await response.json();
    // return data;

    // MOCK: Generate temporary password
    const tempPassword = `temp${Math.random().toString(36).substring(2, 10)}`;
    
    console.log('Resetting password for user:', userId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Password reset successfully',
      tempPassword: tempPassword
    };
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Helper functions
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

const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

/**
 * Get Dashboard Analytics Data
 * Connects to: GET /api/analytics/dashboard
 * 
 * @param {string} period - Time period (week, month, year)
 * @returns {Promise<Object>} Dashboard analytics data from backend
 */
export const getDashboardAnalytics = async (period = 'month') => {
  try {
    // Import api from api.js
    const api = await import('./api.js').then(m => m.default);
    
    // Call real backend API
    const response = await api.analytics.getDashboard({ period });
    
    return response;
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  resetUserPassword,
  getDashboardAnalytics,
};
