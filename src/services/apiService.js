/**
 * API Service Layer
 * All functions are deprecated - use api.js instead
 * This file is kept for backward compatibility only
 */

/**
 * @deprecated Use api.users.getAll() instead
 */
export const getAllUsers = async () => {
  console.warn('getAllUsers is deprecated. Use api.users.getAll() instead');
  return [];
};

/**
 * @deprecated Use api.users.getById() instead
 */
export const getUserById = async (userId) => {
  console.warn('getUserById is deprecated. Use api.users.getById() instead');
  return null;
};

/**
 * @deprecated Use api.users.create() instead
 */
export const createUser = async (userData) => {
  console.warn('createUser is deprecated. Use api.users.create() instead');
  return null;
};

/**
 * @deprecated Use api.users.update() instead
 */
export const updateUser = async (userId, userData) => {
  console.warn('updateUser is deprecated. Use api.users.update() instead');
  return null;
};

/**
 * @deprecated Use api.users.delete() instead
 */
export const deleteUser = async (userId) => {
  console.warn('deleteUser is deprecated. Use api.users.delete() instead');
  return null;
};

/**
 * @deprecated Use api.users.approve() instead
 */
export const approveUser = async (userId) => {
  console.warn('approveUser is deprecated. Use api.users.approve() instead');
  return null;
};

/**
 * @deprecated Use api.users.reject() instead
 */
export const rejectUser = async (userId) => {
  console.warn('rejectUser is deprecated. Use api.users.reject() instead');
  return null;
};

/**
 * @deprecated Use api.users.resetPassword() instead
 */
export const resetUserPassword = async (userId) => {
  console.warn('resetUserPassword is deprecated. Use api.users.resetPassword() instead');
  return null;
};

/**
 * @deprecated Use api.analytics.getDashboard() instead
 */
export const getDashboardAnalytics = async (period = 'month') => {
  console.warn('getDashboardAnalytics is deprecated. Use api.analytics.getDashboard() instead');
  return null;
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
