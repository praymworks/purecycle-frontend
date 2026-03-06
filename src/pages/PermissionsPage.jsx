import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Loading } from '../components/ui';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import { Input, Toast } from '../components/ui';
import api from '../services/api';

// Icon definitions for permission icons
const PERMISSION_ICONS = {
  dashboard: {
    name: 'Dashboard',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  },
  users: {
    name: 'Users',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  },
  document: {
    name: 'Document',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  },
  megaphone: {
    name: 'Megaphone',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  },
  calendar: {
    name: 'Calendar',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  },
  chart: {
    name: 'Chart',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  },
  lock: {
    name: 'Lock',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  },
  user: {
    name: 'User',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  },
  bell: {
    name: 'Bell',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  },
  cog: {
    name: 'Settings',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  },
  shield: {
    name: 'Shield',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  },
  eye: {
    name: 'Eye/View',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  },
  pencil: {
    name: 'Edit',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  },
  trash: {
    name: 'Delete',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  },
  check: {
    name: 'Check/Approve',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  },
  download: {
    name: 'Download',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  },
  plus: {
    name: 'Add/Create',
    svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  }
};

const PermissionsPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', module: '', description: '', icon: '' });
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusPermission, setStatusPermission] = useState(null);
  const [permissionStatuses, setPermissionStatuses] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch permissions and roles from API
  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await api.permissions.getAll();
      if (response.success) {
        // Transform API response to match frontend structure
        const transformedPermissions = response.data.map(perm => ({
          id: perm.id,
          name: perm.name,
          slug: perm.slug,
          module: perm.module,
          description: perm.description,
          status: perm.status || 'active',
          icon: perm.icon || ''
        }));
        setPermissions(transformedPermissions);
        
        // Initialize permission statuses
        const statuses = {};
        transformedPermissions.forEach(p => {
          statuses[p.id] = p.status;
        });
        setPermissionStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.roles.getAll();
      if (response.success) {
        // Transform API response to match frontend structure
        const transformedRoles = response.data.map(role => ({
          id: role.id,
          name: role.name,
          slug: role.slug,
          permissions: role.permissions ? role.permissions.map(p => p.slug) : []
        }));
        setRoles(transformedRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const columns = [
    {
      header: 'Permission Name',
      accessor: 'name',
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      header: 'Slug',
      accessor: 'slug',
      render: (row) => (
        <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{row.slug}</code>
      ),
    },
    {
      header: 'Module',
      accessor: 'module',
      render: (row) => (
        <Badge variant="default" size="xs">{row.module}</Badge>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cellClassName: 'text-gray-600',
    },
    {
      header: 'Assigned Roles',
      render: (row) => {
        const assignedRoles = roles.filter(role => role.permissions.includes(row.slug));
        return (
          <span className="text-gray-900">{assignedRoles.length} role{assignedRoles.length !== 1 ? 's' : ''}</span>
        );
      },
    },
  ];

  const handleView = (permission) => {
    setSelectedPermission(permission);
    setShowViewModal(true);
  };

  const handleCreate = () => {
    setFormData({ name: '', slug: '', module: '', description: '', icon: '' });
    setShowCreateModal(true);
  };

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      slug: permission.slug,
      module: permission.module,
      description: permission.description,
      icon: permission.icon || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  const handleStatusClick = (e, permission) => {
    e.stopPropagation();
    setStatusPermission(permission);
    setShowStatusModal(true);
  };

  const handleStatusChange = async (status) => {
    if (statusPermission) {
      try {
        const response = await api.permissions.update(statusPermission.id, { status });
        if (response.success) {
          setPermissionStatuses(prev => ({
            ...prev,
            [statusPermission.id]: status
          }));
          showToast('Permission status updated successfully', 'success');
          setShowStatusModal(false);
          setStatusPermission(null);
          fetchPermissions(); // Refresh the list
        }
      } catch (error) {
        console.error('Error updating permission status:', error);
        showToast(error.message || 'Failed to update permission status', 'error');
      }
    }
  };

  const getPermissionStatus = (permissionId) => {
    // Check if status was changed in state, otherwise use the permission's default status
    if (permissionStatuses[permissionId]) {
      return permissionStatuses[permissionId];
    }
    // Get from permissions data
    const perm = permissions.find(p => p.id === permissionId);
    return perm?.status || 'active';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'unavailable':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'bug':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'maintenance':
        return 'Under Maintenance';
      case 'unavailable':
        return 'Not Available';
      case 'bug':
        return 'Has Bug';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'bug':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const permissionData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '_'),
        module: formData.module,
        description: formData.description,
        icon: formData.icon,
        status: 'active'
      };

      const response = await api.permissions.create(permissionData);
      if (response.success) {
        showToast('Permission created successfully', 'success');
        setShowCreateModal(false);
        fetchPermissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      showToast(error.message || 'Failed to create permission', 'error');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const permissionData = {
        name: formData.name,
        slug: formData.slug,
        module: formData.module,
        description: formData.description,
        icon: formData.icon
      };

      const response = await api.permissions.update(selectedPermission.id, permissionData);
      if (response.success) {
        showToast('Permission updated successfully', 'success');
        setShowEditModal(false);
        fetchPermissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      showToast(error.message || 'Failed to update permission', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await api.permissions.delete(selectedPermission.id);
      if (response.success) {
        showToast('Permission deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchPermissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      showToast(error.message || 'Failed to delete permission', 'error');
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const modules = Object.keys(groupedPermissions);

  // Get module-specific icon
  const getModuleIcon = (moduleName) => {
    switch (moduleName) {
      case 'Dashboard':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'User Management':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'Reports Management':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Announcements':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'Schedules':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'Analytics':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'Access Control':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'Profile':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'Notifications':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'System Settings':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
    }
  };

  // Get module status icon based on permissions inside
  const getModuleStatusIcon = (moduleName, perms) => {
    // Count statuses
    const statusCounts = {
      active: 0,
      maintenance: 0,
      unavailable: 0,
      bug: 0
    };

    perms.forEach(perm => {
      const status = getPermissionStatus(perm.id);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Determine color class based on priority: bug > unavailable > maintenance > active
    let colorClass = 'text-green-600 group-hover:text-green-700';
    
    if (statusCounts.bug > 0) {
      colorClass = 'text-orange-600 group-hover:text-orange-700';
    } else if (statusCounts.unavailable > 0) {
      colorClass = 'text-red-600 group-hover:text-red-700';
    } else if (statusCounts.maintenance > 0) {
      colorClass = 'text-yellow-600 group-hover:text-yellow-700';
    }
    
    // Clone the module icon with the appropriate color
    const icon = getModuleIcon(moduleName);
    return React.cloneElement(icon, {
      className: `w-6 h-6 ${colorClass} transition-colors`
    });
  };

  // Loading state
  if (loading) {
    return <Loading message="Loading permissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600 mt-1">Manage system permissions and access controls</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Permission
        </Button>
      </div>

      {/* Permissions by Module - Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Object.entries(groupedPermissions).map(([module, perms]) => {
        const handleViewModule = () => {
          setSelectedModule({ name: module, permissions: perms });
          setShowModuleModal(true);
        };
        
        return (
          <button
            key={module}
            onClick={handleViewModule}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                {getModuleStatusIcon(module, perms)}
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {module}
            </h3>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {perms.length} permission{perms.length !== 1 ? 's' : ''}
              </p>
              <span className="text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View all →
              </span>
            </div>
          </button>
        );
      })}
      </div>

      {/* Module Permissions Modal */}
      <ViewModal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        title={`${selectedModule?.name} Permissions`}
        size="xl"
      >
        {selectedModule && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedModule.permissions.length} permission{selectedModule.permissions.length !== 1 ? 's' : ''} in this module
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedModule.permissions.map((perm) => {
                const assignedRoles = roles.filter(role => role.permissions.includes(perm.slug));
                const status = getPermissionStatus(perm.id);
                
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <code className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-200">{perm.slug}</code>
                        <span className="text-xs text-gray-500">
                          • {assignedRoles.length} role{assignedRoles.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => handleStatusClick(e, perm)}
                        className="p-1.5 rounded-lg hover:bg-white transition-colors"
                        title="Change status"
                      >
                        {getStatusIcon(status)}
                      </button>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(perm);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(perm);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ViewModal>

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Permission Details"
        size="md"
      >
        {selectedPermission && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Permission Name</h3>
              <p className="text-base text-gray-900 font-medium">{selectedPermission.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Slug</h3>
              <code className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded">{selectedPermission.slug}</code>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Module</h3>
              <Badge variant="default">{selectedPermission.module}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-base text-gray-900">{selectedPermission.description}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Assigned to Roles</h3>
              {(() => {
                const assignedRoles = roles.filter(role => role.permissions.includes(selectedPermission.slug));
                return assignedRoles.length > 0 ? (
                  <div className="space-y-2">
                    {assignedRoles.map(role => (
                      <div key={role.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{role.name}</p>
                          <p className="text-xs text-gray-500">{role.userCount} users</p>
                        </div>
                        {role.isSystem && <Badge variant="info" size="xs">System</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not assigned to any role</p>
                );
              })()}
            </div>
          </div>
        )}
      </ViewModal>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCreate}
        title="Create New Permission"
        submitText="Create Permission"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Permission Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., View Dashboard"
            required
          />
          <Input
            label="Slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., view_dashboard"
            helperText="Use lowercase with underscores"
            required
          />
          <Input
            label="Module"
            type="text"
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            placeholder="e.g., Dashboard"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon (Optional)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: '' })}
                className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  formData.icon === '' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-5 h-5 mb-1 text-gray-400">—</div>
                <span className="text-xs text-gray-600">None</span>
              </button>
              {Object.entries(PERMISSION_ICONS).map(([key, { name, svg }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: key })}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                    formData.icon === key 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1 text-gray-700">{svg}</div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Choose an icon for this specific permission</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this permission allows..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Permission"
        submitText="Update Permission"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Permission Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            disabled
            helperText="Slug cannot be changed"
          />
          <Input
            label="Module"
            type="text"
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon (Optional)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: '' })}
                className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  formData.icon === '' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-5 h-5 mb-1 text-gray-400">—</div>
                <span className="text-xs text-gray-600">None</span>
              </button>
              {Object.entries(PERMISSION_ICONS).map(([key, { name, svg }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: key })}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                    formData.icon === key 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mb-1 text-gray-700">{svg}</div>
                  <span className="text-xs text-gray-600 text-center leading-tight">{name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Choose an icon for this specific permission</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Permission"
        message={`Are you sure you want to delete the permission "${selectedPermission?.name}"? This will remove it from all roles.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Status Change Modal */}
      <ViewModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Permission Status"
        size="md"
      >
        {statusPermission && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {statusPermission.name}
              </p>
              <p className="text-xs text-gray-500">{statusPermission.description}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(getPermissionStatus(statusPermission.id))}`}>
                  Current: {getStatusLabel(getPermissionStatus(statusPermission.id))}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Select new status:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusChange('active')}
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Active</p>
                    <p className="text-xs text-gray-500">Permission is available</p>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusChange('maintenance')}
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all"
                >
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Under Maintenance</p>
                    <p className="text-xs text-gray-500">Temporarily unavailable</p>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusChange('unavailable')}
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
                >
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Not Available</p>
                    <p className="text-xs text-gray-500">Feature not implemented</p>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusChange('bug')}
                  className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Has Bug</p>
                    <p className="text-xs text-gray-500">Known issues present</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Changing the status will help track which permissions are fully functional, under development, or have issues.
              </p>
            </div>
          </div>
        )}
      </ViewModal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default PermissionsPage;
