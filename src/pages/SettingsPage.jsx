import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Toast, Loading } from '../components/ui';
import api from '../services/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('maintenance'); // maintenance, database, audit
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is currently under maintenance. Please check back later.');
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch data on component mount and tab change
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'database') {
      fetchBackups();
    }
  }, [activeTab, currentPage, searchTerm, filterModule, filterAction, filterStatus]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMaintenanceMode(),
        fetchSystemStats(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showToast('Failed to load settings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceMode = async () => {
    try {
      const response = await api.settings.getMaintenanceMode();
      if (response.success) {
        setMaintenanceMode(response.data.maintenance_mode || false);
        setMaintenanceMessage(response.data.maintenance_message || '');
      }
    } catch (error) {
      console.error('Error fetching maintenance mode:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await api.settings.getSystemStats();
      if (response.success) {
        setSystemStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const params = {
        page: currentPage,
        per_page: pageSize,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterModule) params.module = filterModule;
      if (filterAction) params.action = filterAction;
      if (filterStatus) params.status = filterStatus;

      const response = await api.settings.getAuditLogs(params);
      if (response.success) {
        // Transform API response to match frontend structure
        const transformedLogs = response.data.data.map(log => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_name,
          userRole: log.user_role,
          action: log.action,
          module: log.module,
          description: log.description,
          ipAddress: log.ip_address,
          timestamp: new Date(log.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(',', ''),
          status: log.status
        }));
        setAuditLogs(transformedLogs);
        setTotalLogs(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showToast('Failed to load audit logs', 'error');
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await api.settings.getAllBackups();
      if (response.success) {
        setBackups(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      showToast('Failed to load backups', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleToggleMaintenanceMode = async () => {
    try {
      const newMode = !maintenanceMode;
      const response = await api.settings.updateMaintenanceMode({
        maintenance_mode: newMode,
        maintenance_message: maintenanceMessage
      });

      if (response.success) {
        setMaintenanceMode(newMode);
        showToast(`Maintenance mode ${newMode ? 'enabled' : 'disabled'} successfully`, 'success');
        fetchSystemStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      showToast(error.message || 'Failed to update maintenance mode', 'error');
    }
  };

  const handleCreateBackup = async () => {
    try {
      showToast('Creating database backup...', 'info');
      const response = await api.settings.createBackup();
      
      if (response.success) {
        showToast('Database backup created successfully', 'success');
        fetchBackups(); // Refresh backup list
        fetchSystemStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast(error.message || 'Failed to create backup', 'error');
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      const response = await api.settings.deleteBackup(filename);
      
      if (response.success) {
        showToast('Backup deleted successfully', 'success');
        fetchBackups(); // Refresh backup list
        fetchSystemStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      showToast(error.message || 'Failed to delete backup', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return <Loading message="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and settings</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'maintenance', name: 'Maintenance', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { id: 'database', name: 'Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
            { id: 'audit', name: 'Audit Trail', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
          {/* Maintenance Mode */}
          {activeTab === 'maintenance' && (
            <Card title="Site Maintenance" subtitle="Control system-wide maintenance mode">
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-900">Warning</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Enabling maintenance mode will make the system inaccessible to all users except administrators.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Current Status: <span className={`font-semibold ${maintenanceMode ? 'text-yellow-600' : 'text-green-600'}`}>
                          {maintenanceMode ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleToggleMaintenanceMode}
                      className={`
                        relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                        ${maintenanceMode ? 'bg-yellow-600' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                          ${maintenanceMode ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      rows={4}
                      placeholder="Enter the message users will see during maintenance..."
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This message will be displayed to users when they try to access the system during maintenance.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={handleToggleMaintenanceMode}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Database Management */}
          {activeTab === 'database' && (
            <Card title="Database Backups" subtitle="Manage database backup files">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Total Backups: <span className="font-semibold">{systemStats?.total_backups || backups.length}</span>
                  </div>
                  <Button variant="primary" onClick={handleCreateBackup}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Backup
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {backups.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            No backups available. Create your first backup.
                          </td>
                        </tr>
                      ) : (
                        backups.map((backup, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">{backup.filename}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(backup.size)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(backup.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a 
                              href={backup.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 mr-3" 
                              title="Download"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button 
                              onClick={() => handleDeleteBackup(backup.filename)}
                              className="text-red-600 hover:text-red-900" 
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Audit Trail */}
          {activeTab === 'audit' && (
            <Card title="Audit Trail" subtitle="System activity logs and user actions">
              <div className="space-y-4">
                {/* Search and Page Size */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No audit logs found.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                              <div className="text-xs text-gray-500">{log.userRole}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{log.action}</div>
                              <div className="text-xs text-gray-500">{log.description}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{log.module}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">{log.timestamp}</td>
                            <td className="px-6 py-4">
                              <Badge variant={log.status === 'success' ? 'success' : 'danger'}>
                                {log.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalLogs > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {Math.min((currentPage - 1) * pageSize + 1, totalLogs)} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} entries
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(5, Math.ceil(totalLogs / pageSize)))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded-lg ${currentPage === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalLogs / pageSize)))}
                        disabled={currentPage === Math.ceil(totalLogs / pageSize)}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
      </div>

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

export default SettingsPage;
