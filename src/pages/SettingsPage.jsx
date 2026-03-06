import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { settings as settingsData, auditLogs as auditLogsData } from '../data';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('maintenance'); // maintenance, database, audit
  const [settings, setSettings] = useState(settingsData);
  const [auditLogs] = useState(auditLogsData);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
                        Current Status: <span className={`font-semibold ${settings.site.maintenanceMode ? 'text-yellow-600' : 'text-green-600'}`}>
                          {settings.site.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        site: { ...settings.site, maintenanceMode: !settings.site.maintenanceMode }
                      })}
                      className={`
                        relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                        ${settings.site.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                          ${settings.site.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      value={settings.site.maintenanceMessage}
                      onChange={(e) => setSettings({
                        ...settings,
                        site: { ...settings.site, maintenanceMessage: e.target.value }
                      })}
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
                  <Button variant="primary">
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
                <div className="flex justify-end">
                  <Button variant="primary">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { id: 1, name: 'purecycle_backup_2026-03-04.sql', size: '2.5 MB', date: '2026-03-04 15:30:00', type: 'Auto' },
                        { id: 2, name: 'purecycle_backup_2026-03-03.sql', size: '2.4 MB', date: '2026-03-03 15:30:00', type: 'Auto' },
                        { id: 3, name: 'purecycle_backup_2026-03-02.sql', size: '2.3 MB', date: '2026-03-02 15:30:00', type: 'Auto' },
                        { id: 4, name: 'purecycle_manual_backup.sql', size: '2.5 MB', date: '2026-03-01 10:15:00', type: 'Manual' },
                        { id: 5, name: 'purecycle_backup_2026-03-01.sql', size: '2.2 MB', date: '2026-03-01 15:30:00', type: 'Auto' },
                      ].map(backup => (
                        <tr key={backup.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">{backup.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={backup.type === 'Auto' ? 'default' : 'primary'}>{backup.type}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3" title="Download">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button className="text-red-600 hover:text-red-900" title="Delete">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
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
                      {auditLogs
                        .filter(log => 
                          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map(log => (
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
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {(() => {
                  const filteredLogs = auditLogs.filter(log => 
                    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.description.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  const totalPages = Math.ceil(filteredLogs.length / pageSize);
                  
                  return (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 border rounded-lg ${currentPage === i + 1 ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          )}
      </div>
    </div>
  );
};

export default SettingsPage;
