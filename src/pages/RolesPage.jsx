import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Loading } from '../components/ui';
// import { Card, Table, Button, Badge, Loading, AccessDenied } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import { Input } from '../components/ui';
import api from '../services/api';
import { Toast } from '../components/ui';

const RolesPage = () => {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch roles and permissions from API
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.roles.getAll();
      if (response.success) {
        // Transform API response to match frontend structure
        const transformedRoles = response.data.map(role => ({
          id: role.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          userCount: role.user_count || 0,
          isSystem: role.is_system || false,
          permissions: role.permissions ? role.permissions.map(p => p.slug) : [],
          createdAt: role.created_at ? new Date(role.created_at).toISOString().split('T')[0] : '',
          updatedAt: role.updated_at ? new Date(role.updated_at).toISOString().split('T')[0] : '',
          permissionsData: role.permissions || [] // Keep full permission objects for reference
        }));
        setRoles(transformedRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.permissions.getAll();
      if (response.success) {
        // Transform API response to match frontend structure
        const transformedPermissions = response.data.map(perm => ({
          id: perm.id,
          name: perm.name,
          slug: perm.slug,
          module: perm.module,
          description: perm.description,
          status: perm.status,
          icon: perm.icon
        }));
        setPermissions(transformedPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showToast('Failed to load permissions', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const columns = [
    {
      header: 'Role Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{row.name}</span>
          {row.isSystem && (
            <Badge variant="info" size="xs">System</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cellClassName: 'text-gray-600',
    },
    {
      header: 'Users',
      accessor: 'userCount',
      render: (row) => (
        <span className="text-gray-900 font-medium">{row.userCount}</span>
      ),
    },
    {
      header: 'Permissions',
      render: (row) => (
        <span className="text-gray-600">{row.permissions.length} permissions</span>
      ),
    },
    {
      header: 'Updated',
      accessor: 'updatedAt',
    },
  ];

  const handleView = (role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setSelectedPermissions([]);
    setShowCreateModal(true);
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description });
    setSelectedPermissions(role.permissions);
    setShowEditModal(true);
  };

  const handleDelete = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleManagePermissions = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions);
    setShowPermissionsModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      // Convert permission slugs to IDs
      const permissionIds = permissions
        .filter(p => selectedPermissions.includes(p.slug))
        .map(p => p.id);

      // Generate slug from name
      const slug = formData.name.toLowerCase().replace(/\s+/g, '_');

      const roleData = {
        name: formData.name,
        slug: slug,
        description: formData.description,
        permissions: permissionIds
      };

      const response = await api.roles.create(roleData);
      if (response.success) {
        showToast('Role created successfully', 'success');
        setShowCreateModal(false);
        fetchRoles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showToast(error.message || 'Failed to create role', 'error');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      // Convert permission slugs to IDs
      const permissionIds = permissions
        .filter(p => selectedPermissions.includes(p.slug))
        .map(p => p.id);

      const roleData = {
        name: formData.name,
        description: formData.description,
        permissions: permissionIds
      };

      const response = await api.roles.update(selectedRole.id, roleData);
      if (response.success) {
        showToast('Role updated successfully', 'success');
        setShowEditModal(false);
        fetchRoles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showToast(error.message || 'Failed to update role', 'error');
    }
  };

  const handleSubmitPermissions = async () => {
    try {
      // Convert permission slugs to IDs
      const permissionIds = permissions
        .filter(p => selectedPermissions.includes(p.slug))
        .map(p => p.id);

      const roleData = {
        permissions: permissionIds
      };

      const response = await api.roles.update(selectedRole.id, roleData);
      if (response.success) {
        showToast('Permissions updated successfully', 'success');
        setShowPermissionsModal(false);
        fetchRoles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      showToast(error.message || 'Failed to update permissions', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await api.roles.delete(selectedRole.id);
      if (response.success) {
        showToast('Role deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchRoles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast(error.message || 'Failed to delete role', 'error');
    }
  };


  const togglePermission = (permSlug) => {
    if (selectedPermissions.includes(permSlug)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permSlug));
    } else {
      setSelectedPermissions([...selectedPermissions, permSlug]);
    }
  };

  const toggleModule = (module) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const selectAllInModule = (perms) => {
    const permSlugs = perms.map(p => p.slug);
    const allSelected = permSlugs.every(slug => selectedPermissions.includes(slug));
    
    if (allSelected) {
      // Deselect all in this module
      setSelectedPermissions(selectedPermissions.filter(slug => !permSlugs.includes(slug)));
    } else {
      // Select all in this module
      const newPerms = [...new Set([...selectedPermissions, ...permSlugs])];
      setSelectedPermissions(newPerms);
    }
  };

  const isModuleAllSelected = (perms) => {
    return perms.every(perm => selectedPermissions.includes(perm.slug));
  };

  const getModuleSelectedCount = (perms) => {
    return perms.filter(perm => selectedPermissions.includes(perm.slug)).length;
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Loading state
  if (loading) {
    return <Loading message="Loading roles..." />;
  }

  // Permission check
  // if (!hasPermission(currentUser, 'view_roles_management_module')) {
  //   return <AccessDenied message="You don't have permission to view Roles Management." />;
  // }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and their permissions</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Role
        </Button>
      </div>



      {/* Roles Table */}
      <Table
        data={roles}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search roles..."
        paginated={true}
        pageSize={10}
        actions={(row) => (
          <>
            <Button size="xs" variant="ghost" onClick={() => handleView(row)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
            <Button size="xs" variant="info" onClick={() => handleManagePermissions(row)}>
              Permissions
            </Button>
            <Button size="xs" variant="ghost" onClick={() => handleEdit(row)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            {!row.isSystem && (
              <Button size="xs" variant="danger" onClick={() => handleDelete(row)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </>
        )}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Role Details"
        size="lg"
      >
        {selectedRole && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Role Name</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-base text-gray-900">{selectedRole.name}</p>
                  {selectedRole.isSystem && <Badge variant="info" size="xs">System</Badge>}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Users</h3>
                <p className="text-base text-gray-900">{selectedRole.userCount} users</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-base text-gray-900">{selectedRole.description}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions ({selectedRole.permissions.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRole.permissions.map((permSlug) => {
                  const perm = permissions.find(p => p.slug === permSlug);
                  return perm ? (
                    <div key={perm.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        <p className="text-xs text-gray-500">{perm.module}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </ViewModal>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCreate}
        title="Create New Role"
        submitText="Create Role"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Supervisor"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role's purpose..."
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
        title="Edit Role"
        submitText="Update Role"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
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

      {/* Manage Permissions Modal */}
      <ViewModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`Manage Permissions - ${selectedRole?.name}`}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitPermissions}>
              Save Permissions
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedPermissions.length} of {permissions.length} permissions
            </p>
          </div>

          <div className="space-y-2">
            {Object.entries(groupedPermissions).map(([module, perms]) => {
              const isExpanded = expandedModules[module];
              const selectedCount = getModuleSelectedCount(perms);
              const allSelected = isModuleAllSelected(perms);

              return (
                <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Accordion Header */}
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => toggleModule(module)}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{module}</h3>
                          <p className="text-sm text-gray-600">
                            {selectedCount} of {perms.length} selected
                          </p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => selectAllInModule(perms)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          allSelected
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`
                              flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                              ${selectedPermissions.includes(perm.slug)
                                ? 'bg-primary-50 border-primary-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.slug)}
                              onChange={() => togglePermission(perm.slug)}
                              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ViewModal>

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

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

export default RolesPage;
