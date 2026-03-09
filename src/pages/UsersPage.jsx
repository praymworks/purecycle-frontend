import React, { useState, useEffect } from 'react';
// import { Card, Table, Button, Badge, Avatar, Toast, Loading, AccessDenied } from '../components/ui';
import { Card, Table, Button, Badge, Avatar, Toast, Loading, AccessDenied } from '../components/ui';
import { AlertModal, ViewModal, FormModal } from '../components/modals';
import { Input, Select } from '../components/ui';
import boholData from '../data/bohol_complete_barangays.json';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';

// Filter to only show Trinidad
const municipalityOptions = boholData.city_municipalities
  .filter((m) => m.name === 'Trinidad')
  .map((m) => ({
    value: m.name,
    label: m.name,
  }));

const getBarangayOptions = (municipalityName) => {
  const found = boholData.city_municipalities.find((m) => m.name === municipalityName);
  if (!found) return [];
  return found.barangays.map((b) => ({ value: b, label: b }));
};

// Generate purok options (Purok 1 to Purok 7)
const purokOptions = Array.from({ length: 7 }, (_, i) => ({
  value: `Purok ${i + 1}`,
  label: `Purok ${i + 1}`,
}));

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordResult, setShowPasswordResult] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ title: '', url: '' });
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    contact_number: '',
    role: 'admin',
    city_municipality: '',
    barangay: '',
    purok: '',
    password: '',
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.users.getAll();
      if (response.success) {
        const userData = response.data.data || response.data || [];
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const [editFormData, setEditFormData] = useState({
    fullname: '',
    email: '',
    contact_number: '',
    role: '',
    city_municipality: '',
    barangay: '',
    purok: '',
  });

  const columns = [
    {
      header: 'User',
      accessor: 'fullname',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            src={row.profile_path} 
            name={row.fullname} 
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{row.fullname}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => {
        const roleLabels = {
          admin: 'Admin',
          staff: 'Staff',
          purok_leader: 'Purok Leader',
          business_owner: 'Business Owner'
        };
        const roleColors = {
          admin: 'danger',
          staff: 'warning',
          purok_leader: 'primary',
          business_owner: 'info'
        };
        return (
          <Badge variant={roleColors[row.role] || 'secondary'} size="xs">
            {roleLabels[row.role] || row.role}
          </Badge>
        );
      },
    },
    {
      header: 'Municipality',
      accessor: 'city_municipality',
    },
    {
      header: 'Barangay',
      accessor: 'barangay',
      render: (row) => row.barangay || '-',
    },
    {
      header: 'Purok',
      accessor: 'purok',
      render: (row) => row.purok || '-',
    },
    {
      header: 'Contact',
      accessor: 'contact_number',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          approved: 'success',
          pending: 'warning',
          rejected: 'danger',
          suspended: 'secondary'
        };
        return (
          <Badge variant={statusColors[row.status] || 'default'} size="xs">
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (row) => {
        const date = new Date(row.created_at);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      },
    },
  ];

  const handleView = (user) => {
    // Only show view for Purok Leader and Business Owner
    if (user.role === 'purok_leader' || user.role === 'business_owner') {
      setSelectedUser(user);
      setShowViewModal(true);
    }
  };

  const handleEdit = (user) => {
    setUserToEdit(user);
    setEditFormData({
      fullname: user.fullname,
      email: user.email,
      contact_number: user.contact_number,
      role: user.role,
      city_municipality: user.city_municipality || '',
      barangay: user.barangay || '',
      purok: user.purok || '',
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    try {
      const response = await api.users.update(userToEdit.id, editFormData);
      if (response.success) {
        await loadUsers(); // Reload users
        setShowEditModal(false);
        setToast({ show: true, message: 'User updated successfully!', variant: 'success' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleResetPassword = (user) => {
    setUserToEdit(user);
    const generatedPassword = generatePassword();
    setNewPassword(generatedPassword);
    setPasswordCopied(false);
    setShowResetPasswordModal(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleSubmitResetPassword = async () => {
    try {
      const response = await api.users.resetPassword(userToEdit.id);
      if (response.success) {
        setShowResetPasswordModal(false);
        setNewPassword(response.data.new_password);
        setShowPasswordResult(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setToast({ show: true, message: 'Failed to reset password', variant: 'error' });
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleApprove = (user) => {
    setSelectedUser(user);
    setShowApproveModal(true);
  };

  const handleReject = (user) => {
    setSelectedUser(user);
    setShowRejectModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.users.delete(userToDelete.id);
      if (response.success) {
        await loadUsers(); // Reload users
        setShowDeleteModal(false);
        setUserToDelete(null);
        setToast({ show: true, message: 'User deleted successfully!', variant: 'success' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const confirmApprove = async () => {
    try {
      const response = await api.users.approve(selectedUser.id);
      if (response.success) {
        await loadUsers(); // Reload users
        setShowApproveModal(false);
        setToast({ show: true, message: 'User approved successfully!', variant: 'success' });
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const confirmReject = async () => {
    try {
      const response = await api.users.reject(selectedUser.id);
      if (response.success) {
        await loadUsers(); // Reload users
        setShowRejectModal(false);
        setToast({ show: true, message: 'User rejected successfully!', variant: 'success' });
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const handleCreate = () => {
    const tempPassword = generatePassword();
    setFormData({
      name: '',
      email: '',
      contactNo: '',
      role: '',
      municipality: '',
      barangay: '',
      purok: '',
      password: tempPassword,
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.users.create(formData);
      if (response.success) {
        await loadUsers(); // Reload users
        setShowCreateModal(false);
        // Reset form
        setFormData({
          fullname: '',
          email: '',
          contact_number: '',
          role: 'admin',
          city_municipality: '',
          barangay: '',
          purok: '',
          password: '',
        });
        setToast({ show: true, message: 'User created successfully!', variant: 'success' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    setFormData({ ...formData, password: generatePassword() });
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
  ];

  // Loading state
  if (isLoading) {
    return <Loading message="Loading users..." />;
  }

  // Permission check
  // if (!hasPermission(currentUser, 'view_user_management_module')) {
  //   return <AccessDenied message="You don't have permission to view User Management." />;
  // }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Accounts</h1>
          <p className="text-gray-600 mt-1">View and manage user accounts</p>
        </div>
        {/* Add New User button - Permission: add_new_user */}
        {hasPermission(currentUser, 'add_new_user') && (
          <Button variant="primary" onClick={handleCreate}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New User
          </Button>
        )}
      </div>



      {/* Users Table - Permission: view_users_list */}
      {hasPermission(currentUser, 'view_users_list') ? (
        <Table
          data={users}
          columns={columns}
          searchable={hasPermission(currentUser, 'search_users')}
          searchPlaceholder="Search by name, email, ID..."
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          actions={(row) => (
          <>
            {/* View - Permission: view_user_details */}
            {hasPermission(currentUser, 'view_user_details') && (row.role === 'purok_leader' || row.role === 'business_owner') && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleView(row)}
                title="View Details"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Button>
            )}

            {/* Edit - Permission: edit_user */}
            {hasPermission(currentUser, 'edit_user') && (row.role === 'admin' || row.role === 'staff') && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleEdit(row)}
                title="Edit User"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}

            {/* Approve - Permission: approve_user */}
            {hasPermission(currentUser, 'approve_user') && row.status === 'pending' && (
              <Button
                size="xs"
                variant="success"
                onClick={() => handleApprove(row)}
                title="Approve User"
              >
                Approve
              </Button>
            )}

            {/* Reject - Permission: reject_user */}
            {hasPermission(currentUser, 'reject_user') && row.status === 'pending' && (
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleReject(row)}
                title="Reject User"
              >
                Reject
              </Button>
            )}

            {/* Reset Password - Permission: reset_user_password */}
            {hasPermission(currentUser, 'reset_user_password') && (row.role === 'admin' || row.role === 'staff') && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleResetPassword(row)}
                title="Reset Password"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </Button>
            )}

            {/* Delete - Permission: delete_user */}
            {hasPermission(currentUser, 'delete_user') && (
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleDelete(row)}
                title="Delete User"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </>
        )}
      />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">You don't have permission to view the users list.</p>
        </Card>
      )}

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
              <Avatar 
                src={selectedUser.profile_path} 
                name={selectedUser.fullname} 
                size="lg"
                className="shadow-md"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{selectedUser.fullname}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {selectedUser.id}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={
                    selectedUser.status === 'approved' ? 'success' :
                    selectedUser.status === 'pending' ? 'warning' : 
                    selectedUser.status === 'rejected' ? 'danger' : 'secondary'
                  }>
                    {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                  </Badge>
                  <Badge variant={selectedUser.role === 'purok_leader' ? 'primary' : 'info'}>
                    {selectedUser.role === 'purok_leader' ? 'Purok Leader' : 'Business Owner'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-base text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Number</h3>
                <p className="text-base text-gray-900">{selectedUser.contact_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Municipality / City</h3>
                <p className="text-base text-gray-900">{selectedUser.city_municipality}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Barangay</h3>
                <p className="text-base text-gray-900">{selectedUser.barangay || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Purok</h3>
                <p className="text-base text-gray-900">{selectedUser.purok || '-'}</p>
              </div>
            </div>

            {/* Business Owner Information */}
            {selectedUser.business_owner && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Business Name</h3>
                      <p className="text-base text-gray-900">{selectedUser.business_owner.business_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Street</h3>
                      <p className="text-base text-gray-900">{selectedUser.business_owner.street || '-'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Documents Section - Permission: view_user_documents */}
            {hasPermission(currentUser, 'view_user_documents') && (selectedUser.purok_leader || selectedUser.business_owner) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Valid ID */}
                  {((selectedUser.purok_leader?.valid_id_document) || (selectedUser.business_owner?.valid_id_document)) && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Valid ID</h4>
                      <div 
                        onClick={() => {
                          const validId = selectedUser.purok_leader?.valid_id_document || selectedUser.business_owner?.valid_id_document;
                          setSelectedDocument({ title: 'Valid ID', url: validId });
                          setShowDocumentModal(true);
                        }}
                        className="block hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <img 
                          src={selectedUser.purok_leader?.valid_id_document || selectedUser.business_owner?.valid_id_document} 
                          alt="Valid ID"
                          className="w-full h-32 object-cover rounded border border-gray-300"
                        />
                        <p className="text-xs text-primary-600 mt-2 hover:underline">View Document →</p>
                      </div>
                    </div>
                  )}

                  {/* Business Permit - Only for Business Owner */}
                  {selectedUser.business_owner?.business_permit && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Business Permit</h4>
                      <div 
                        onClick={() => {
                          setSelectedDocument({ title: 'Business Permit', url: selectedUser.business_owner.business_permit });
                          setShowDocumentModal(true);
                        }}
                        className="block hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <img 
                          src={selectedUser.business_owner.business_permit} 
                          alt="Business Permit"
                          className="w-full h-32 object-cover rounded border border-gray-300"
                        />
                        <p className="text-xs text-primary-600 mt-2 hover:underline">View Document →</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ViewModal>

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.fullname}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Approve Confirmation Modal */}
      <AlertModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={confirmApprove}
        title="Approve User"
        message={`Are you sure you want to approve ${selectedUser?.fullname}'s account?`}
        confirmText="Approve"
        variant="success"
      />

      {/* Reject Confirmation Modal */}
      <AlertModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={confirmReject}
        title="Reject User"
        message={`Are you sure you want to reject ${selectedUser?.fullname}'s account?`}
        confirmText="Reject"
        variant="danger"
      />

      {/* Create User Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCreate}
        title="Add New Admin/Staff User"
        submitText="Create User"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              placeholder="Enter full name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Number"
              type="text"
              value={formData.contact_number}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                  setFormData({ ...formData, contact_number: value });
                }
              }}
              placeholder="09xxxxxxxxx"
              helperText="11 digits, numbers only"
              required
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={roleOptions}
              placeholder="Select role"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Municipality / City"
              value={formData.city_municipality}
              onChange={(e) => setFormData({ ...formData, city_municipality: e.target.value, barangay: '' })}
              options={municipalityOptions}
              placeholder="Select municipality"
              required
            />

            <Select
              label="Barangay"
              value={formData.barangay}
              onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              options={getBarangayOptions(formData.city_municipality)}
              placeholder={formData.city_municipality ? 'Select barangay' : 'Select municipality first'}
              disabled={!formData.city_municipality}
              required
            />
          </div>

          <Select
            label="Purok"
            value={formData.purok}
            onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
            options={purokOptions}
            placeholder="Select purok"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Temporary password"
                required
                className="flex-1"
                fullWidth={false}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleGeneratePassword}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              User will be required to change password on first login
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">Admin/Staff Account</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This creates admin or staff accounts. Business Owners and Purok Leaders register through the public registration form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Edit Admin/Staff Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={(e) => { e.preventDefault(); handleSubmitEdit(); }}
        title="Edit User"
        submitText="Save Changes"
        size="md"
      >
        {userToEdit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">User ID</h3>
                <p className="text-base text-gray-900 font-semibold">{userToEdit.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                <Badge variant={editFormData.role === 'admin' ? 'primary' : 'info'}>
                  {editFormData.role}
                </Badge>
              </div>
            </div>

            <Select
              label="Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              options={roleOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={editFormData.fullname}
                onChange={(e) => setEditFormData({ ...editFormData, fullname: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>

            <Input
              label="Contact Number"
              type="text"
              value={editFormData.contact_number}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                  setEditFormData({ ...editFormData, contact_number: value });
                }
              }}
              helperText="11 digits, numbers only"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Municipality / City"
                value={editFormData.city_municipality}
                onChange={(e) => setEditFormData({ ...editFormData, city_municipality: e.target.value, barangay: '' })}
                options={municipalityOptions}
                placeholder="Select municipality"
                required
              />

              <Select
                label="Barangay"
                value={editFormData.barangay}
                onChange={(e) => setEditFormData({ ...editFormData, barangay: e.target.value })}
                options={getBarangayOptions(editFormData.city_municipality)}
                placeholder={editFormData.city_municipality ? 'Select barangay' : 'Select municipality first'}
                disabled={!editFormData.city_municipality}
                required
              />
            </div>

            <Select
              label="Purok"
              value={editFormData.purok}
              onChange={(e) => setEditFormData({ ...editFormData, purok: e.target.value })}
              options={purokOptions}
              placeholder="Select purok"
              required
            />

            <div className="border-t border-gray-200 pt-4">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowEditModal(false);
                  setTimeout(() => handleResetPassword(userToEdit), 300);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Reset Password
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Password cannot be edited, only reset
              </p>
            </div>
          </div>
        )}
      </FormModal>

      {/* Reset Password Modal */}
      <ViewModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitResetPassword}>
              Confirm Reset
            </Button>
          </>
        }
      >
        {userToEdit && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">User</h3>
              <p className="text-base text-gray-900 font-semibold">{userToEdit.name}</p>
              <p className="text-sm text-gray-600">{userToEdit.email}</p>
            </div>

            <div className="border-t border-gray-200 ">

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 ">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Important</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Make sure to copy and save this password. The user will need it to log in and will be required to change it on first login.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ViewModal>

      {/* Password Reset Result Modal */}
      <AlertModal
        isOpen={showPasswordResult}
        onClose={() => {
          setShowPasswordResult(false);
          setNewPassword('');
          setToast({ show: true, message: 'Password reset successfully!', variant: 'success' });
        }}
        onConfirm={() => {
          // Copy to clipboard
          navigator.clipboard.writeText(newPassword);
          setToast({ show: true, message: 'Password copied to clipboard!', variant: 'info' });
          setShowPasswordResult(false);
          setNewPassword('');
        }}
        title="Password Reset Successful"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">The new password has been generated. Please provide this password to the user securely.</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">New Password:</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono font-bold text-gray-900">{newPassword}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    setToast({ show: true, message: 'Copied!', variant: 'info' });
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-red-600">⚠️ This password will only be shown once. Make sure to save it or give it to the user now.</p>
          </div>
        }
        confirmText="Copy & Close"
        cancelText="Close"
        variant="info"
      />

      {/* Document View Modal */}
      <ViewModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        title={selectedDocument.title}
        size="xl"
      >
        <div className="flex flex-col items-center justify-center p-4">
          <img 
            src={selectedDocument.url} 
            alt={selectedDocument.title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
          <div className="mt-6 flex gap-3">
            <a 
              href={selectedDocument.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
            <a 
              href={selectedDocument.url} 
              download
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </ViewModal>
    </div>
  );
};

export default UsersPage;
