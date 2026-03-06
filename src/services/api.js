/**
 * API Service - Real Backend Integration
 * Centralized API communication module
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('purecycle_auth_token');
};

/**
 * Generic API request handler with error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth token if available
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // For cookies if needed
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'Request failed',
        errors: data.errors || null,
      };
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * API Methods
 */
const api = {
  // ==================== AUTH ====================
  auth: {
    login: (credentials) => 
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    register: (userData) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    logout: () =>
      apiRequest('/auth/logout', { method: 'POST' }),
    
    getCurrentUser: () =>
      apiRequest('/auth/me'),
    
    refreshToken: () =>
      apiRequest('/auth/refresh', { method: 'POST' }),
  },

  // ==================== PROFILE ====================
  profile: {
    update: (profileData) =>
      apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
    
    changePassword: (passwordData) =>
      apiRequest('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      }),
  },

  // ==================== USERS ====================
  users: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/users${queryString ? `?${queryString}` : ''}`);
    },
    
    getById: (id) =>
      apiRequest(`/users/${id}`),
    
    create: (userData) =>
      apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    update: (id, userData) =>
      apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
    
    delete: (id) =>
      apiRequest(`/users/${id}`, { method: 'DELETE' }),
    
    approve: (id) =>
      apiRequest(`/users/${id}/approve`, { method: 'POST' }),
    
    reject: (id) =>
      apiRequest(`/users/${id}/reject`, { method: 'POST' }),
    
    suspend: (id) =>
      apiRequest(`/users/${id}/suspend`, { method: 'POST' }),
    
    resetPassword: (id) =>
      apiRequest(`/users/${id}/reset-password`, { method: 'POST' }),
  },

  // ==================== ROLES ====================
  roles: {
    getAll: () => apiRequest('/roles'),
    getById: (id) => apiRequest(`/roles/${id}`),
    create: (roleData) =>
      apiRequest('/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      }),
    update: (id, roleData) =>
      apiRequest(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      }),
    delete: (id) => apiRequest(`/roles/${id}`, { method: 'DELETE' }),
    attachPermissions: (id, permissionIds) =>
      apiRequest(`/roles/${id}/permissions/attach`, {
        method: 'POST',
        body: JSON.stringify({ permissions: permissionIds }),
      }),
    detachPermissions: (id, permissionIds) =>
      apiRequest(`/roles/${id}/permissions/detach`, {
        method: 'POST',
        body: JSON.stringify({ permissions: permissionIds }),
      }),
  },

  // ==================== PERMISSIONS ====================
  permissions: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/permissions${queryString ? `?${queryString}` : ''}`);
    },
    getByModule: () => apiRequest('/permissions/by-module'),
    getById: (id) => apiRequest(`/permissions/${id}`),
    create: (permissionData) =>
      apiRequest('/permissions', {
        method: 'POST',
        body: JSON.stringify(permissionData),
      }),
    update: (id, permissionData) =>
      apiRequest(`/permissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(permissionData),
      }),
    delete: (id) => apiRequest(`/permissions/${id}`, { method: 'DELETE' }),
  },

  // ==================== REPORTS ====================
  reports: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/reports${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiRequest(`/reports/${id}`),
    getStatistics: () => apiRequest('/reports/statistics'),
    getRanking: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/reports/ranking${queryString ? `?${queryString}` : ''}`);
    },
    create: (reportData) =>
      apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
    update: (id, reportData) =>
      apiRequest(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reportData),
      }),
    updateStatus: (id, statusData) =>
      apiRequest(`/reports/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(statusData),
      }),
    delete: (id) => apiRequest(`/reports/${id}`, { method: 'DELETE' }),
  },

  // ==================== ANNOUNCEMENTS ====================
  announcements: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/announcements${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiRequest(`/announcements/${id}`),
    getStatistics: () => apiRequest('/announcements/statistics'),
    create: (announcementData) => {
      return apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
      });
    },
    update: (id, announcementData) => {
      return apiRequest(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(announcementData),
      });
    },
    updateStatus: (id, statusData) =>
      apiRequest(`/announcements/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(statusData),
      }),
    delete: (id) => apiRequest(`/announcements/${id}`, { method: 'DELETE' }),
    deleteAttachment: (id, filename) =>
      apiRequest(`/announcements/${id}/delete-attachment`, {
        method: 'POST',
        body: JSON.stringify({ filename }),
      }),
  },

  // ==================== UPLOADS ====================
  uploads: {
    uploadAnnouncementAttachment: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/upload/announcement-attachment', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // ==================== ROUTES ====================
  routes: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/routes${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiRequest(`/routes/${id}`),
    create: (routeData) =>
      apiRequest('/routes', {
        method: 'POST',
        body: JSON.stringify(routeData),
      }),
    update: (id, routeData) =>
      apiRequest(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(routeData),
      }),
    delete: (id) =>
      apiRequest(`/routes/${id}`, {
        method: 'DELETE',
      }),
    getStatistics: () => apiRequest('/routes/statistics'),
  },

  // ==================== SCHEDULES ====================
  schedules: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/schedules${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiRequest(`/schedules/${id}`),
    getStatistics: () => apiRequest('/schedules/statistics'),
    create: (scheduleData) =>
      apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      }),
    update: (id, scheduleData) =>
      apiRequest(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(scheduleData),
      }),
    updateStatus: (id, statusData) =>
      apiRequest(`/schedules/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(statusData),
      }),
    updateStopStatus: (id, stopData) =>
      apiRequest(`/schedules/${id}/stop-status`, {
        method: 'POST',
        body: JSON.stringify(stopData),
      }),
    assignDriver: (id, driverData) =>
      apiRequest(`/schedules/${id}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify(driverData),
      }),
    delete: (id) => apiRequest(`/schedules/${id}`, { method: 'DELETE' }),
  },

  // ==================== ANALYTICS ====================
  analytics: {
    getOverview: () => apiRequest('/analytics/overview'),
    getCollectionStats: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/analytics/collection-stats${queryString ? `?${queryString}` : ''}`);
    },
    getRoutePerformance: () => apiRequest('/analytics/route-performance'),
    getReportAnalytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/analytics/report-analytics${queryString ? `?${queryString}` : ''}`);
    },
    getUserActivity: () => apiRequest('/analytics/user-activity'),
    getDashboard: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/analytics/dashboard${queryString ? `?${queryString}` : ''}`);
    },
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`);
    },
    getUnreadCount: () => apiRequest('/notifications/unread-count'),
    getStats: () => apiRequest('/notifications/stats'),
    markAsRead: (id) => apiRequest(`/notifications/${id}/mark-read`, { method: 'POST' }),
    markAsUnread: (id) => apiRequest(`/notifications/${id}/mark-unread`, { method: 'POST' }),
    markAllAsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),
    delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    deleteAll: () => apiRequest('/notifications', { method: 'DELETE' }),
  },

  // ==================== SETTINGS ====================
  settings: {
    getMaintenanceMode: () => apiRequest('/settings/maintenance'),
    updateMaintenanceMode: (maintenanceData) =>
      apiRequest('/settings/maintenance', {
        method: 'POST',
        body: JSON.stringify(maintenanceData),
      }),
    getRecentActivity: () => apiRequest('/settings/recent-activity'),
    getAuditLogs: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/settings/audit-logs${queryString ? `?${queryString}` : ''}`);
    },
    createBackup: () =>
      apiRequest('/settings/backup', {
        method: 'POST',
      }),
    getAllBackups: () => apiRequest('/settings/backups'),
    deleteBackup: (filename) =>
      apiRequest('/settings/backup', {
        method: 'DELETE',
        body: JSON.stringify({ filename }),
      }),
    getSystemStats: () => apiRequest('/settings/system-stats'),
  },

  // ==================== UPLOADS ====================
  upload: {
    validId: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/upload/valid-id', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it with boundary
      });
    },
    
    businessPermit: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/upload/business-permit', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it with boundary
      });
    },
    
    profilePicture: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/upload/profile-picture', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it with boundary
      });
    },

    announcementAttachment: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/upload/announcement-attachment', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it with boundary
      });
    },

    deleteFile: (path) =>
      apiRequest('/upload/delete', {
        method: 'POST',
        body: JSON.stringify({ path }),
      }),
  },

  // ==================== EXPORTS ====================
  exports: {
    collections: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/export/collections${queryString ? `?${queryString}` : ''}`);
    },
    reports: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/export/reports${queryString ? `?${queryString}` : ''}`);
    },
    routePerformance: () => apiRequest('/export/route-performance'),
    users: () => apiRequest('/export/users'),
    analytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/export/analytics${queryString ? `?${queryString}` : ''}`);
    },
    deleteFile: (filename) =>
      apiRequest('/export/delete-file', {
        method: 'DELETE',
        body: JSON.stringify({ filename }),
      }),
  },
};

// Export API methods and utilities
export default api;
export { API_BASE_URL, BASE_URL, getAuthToken };
