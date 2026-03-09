import React, { useState, useEffect } from 'react';
// import { Card, Table, Button, Badge, Input, Toast, Loading, AccessDenied } from '../components/ui';
import { Card, Table, Button, Badge, Input, Toast, Loading } from '../components/ui';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';

const ReportsPage = () => {
  const { user: currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [remark, setRemark] = useState('');
  const [staffRemarks, setStaffRemarks] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [imageZoom, setImageZoom] = useState(1); // Zoom level for evidence photo (0.5x to 3x)

  // Fetch reports from backend
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.reports.getAll();
      if (response.success) {
        const reportData = response.data.data || response.data || [];
        setReports(reportData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setToast({ show: true, message: 'Failed to load reports', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const columns = [
    {
      header: 'Report ID',
      accessor: 'report_id',
      width: '100px',
    },
    {
      header: 'Reporter',
      accessor: 'reporter_name',
    },
    {
      header: 'Role',
      accessor: 'reporter_role',
      render: (row) => (
        <Badge variant={row.reporter_role === 'Purok Leader' ? 'primary' : 'info'} size="xs">
          {row.reporter_role}
        </Badge>
      ),
    },
    {
      header: 'Location',
      render: (row) => `${row.barangay}, ${row.purok}`,
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <Badge 
          variant={
            row.priority === 'Urgent' ? 'urgent' :
            row.priority === 'Moderate' ? 'moderate' : 'default'
          }
          size="xs"
        >
          {row.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge 
          variant={
            row.status === 'Resolved' ? 'resolved' :
            row.status === 'In Progress' ? 'info' :
            row.status === 'Pending' ? 'pending' : 'rejected'
          }
          size="xs"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'date_submitted',
      render: (row) => {
        const date = new Date(row.date_submitted);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      },
    },
  ];

  const handleView = (report) => {
    setSelectedReport(report);
    setImageZoom(1); // Reset zoom level when opening modal
    setShowViewModal(true);
  };

  const handleStatusChange = (report, status) => {
    setSelectedReport(report);
    setNewStatus(status);
    setStaffRemarks(report.staff_remarks || ''); // Populate existing staff remarks
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const statusData = {
        status: newStatus,
        staff_remarks: staffRemarks,
        remark: staffRemarks // Use staff_remarks for both fields
      };

      const response = await api.reports.updateStatus(selectedReport.id, statusData);
      if (response.success) {
        setShowStatusModal(false);
        setStaffRemarks('');
        setToast({ show: true, message: 'Report status updated successfully!', variant: 'success' });
        fetchReports(); // Reload reports
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ show: true, message: 'Failed to update status', variant: 'error' });
    }
  };

  const handleDelete = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.reports.delete(reportToDelete.id);
      if (response.success) {
        setShowDeleteModal(false);
        setReportToDelete(null);
        setToast({ show: true, message: 'Report deleted successfully!', variant: 'success' });
        fetchReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setToast({ show: true, message: 'Failed to delete report', variant: 'error' });
    }
  };

  // Loading state
  if (loading) {
    return <Loading message="Loading reports..." />;
  }

  // Permission check
  // if (!hasPermission(currentUser, 'view_reports_management_module')) {
  //   return <AccessDenied message="You don't have permission to view Reports Management." />;
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
          <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600 mt-1">View and manage waste collection reports</p>
        </div>
      </div>

      
      {/* Reports Table - Permission: view_reports_list */}
      {hasPermission(currentUser, 'view_reports_list') ? (
        <Table
          data={reports}
          columns={columns}
          searchable={hasPermission(currentUser, 'search_reports')}
          searchPlaceholder="Search by reporter, type, location..."
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          actions={(row) => (
            <>
              {/* View Details - Permission: view_report_details */}
              {hasPermission(currentUser, 'view_report_details') && (
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
              {/* Start Processing - Permission: start_report_processing */}
              {hasPermission(currentUser, 'start_report_processing') && row.status === 'Pending' && (
                <Button
                  size="xs"
                  variant="info"
                  onClick={() => handleStatusChange(row, 'In Progress')}
                  title="Start Processing"
                >
                  Start
                </Button>
              )}
              {/* Resolve Report - Permission: resolve_report */}
              {hasPermission(currentUser, 'resolve_report') && row.status === 'In Progress' && (
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => handleStatusChange(row, 'Resolved')}
                  title="Resolve Report"
                >
                  Resolve
                </Button>
              )}
              {/* Reject Report - Permission: reject_report */}
              {hasPermission(currentUser, 'reject_report') && row.status !== 'Rejected' && row.status !== 'Resolved' && (
                <Button
                  size="xs"
                  variant="danger"
                  onClick={() => handleStatusChange(row, 'Rejected')}
                  title="Reject Report"
                >
                  Reject
                </Button>
              )}
            </>
          )}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">You don't have permission to view the reports list.</p>
        </Card>
      )}

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Report Details"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Report ID</h3>
                <p className="text-base text-gray-900">{selectedReport.report_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge variant={
                  selectedReport.status === 'Resolved' ? 'resolved' :
                  selectedReport.status === 'In Progress' ? 'info' :
                  selectedReport.status === 'Pending' ? 'pending' : 'rejected'
                }>
                  {selectedReport.status}
                </Badge>
              </div>
            </div>

            {/* Reporter Information - Permission: view_reporter_information */}
            {hasPermission(currentUser, 'view_reporter_information') && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                    <p className="text-base text-gray-900">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                    <p className="text-base text-gray-900">{selectedReport.reporter_role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Barangay</h3>
                    <p className="text-base text-gray-900">{selectedReport.barangay}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Purok</h3>
                    <p className="text-base text-gray-900">{selectedReport.purok}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h3>
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority Level</h3>
                  <Badge variant={
                    selectedReport.priority === 'Urgent' ? 'urgent' :
                    selectedReport.priority === 'Moderate' ? 'moderate' : 'default'
                  }>
                    {selectedReport.priority}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date Submitted</h3>
                  <p className="text-base text-gray-900">
                    {new Date(selectedReport.date_submitted).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                {selectedReport.resolved_date && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Resolved Date</h3>
                    <p className="text-base text-gray-900">
                      {new Date(selectedReport.resolved_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Complaint</h3>
                <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedReport.complaint}</p>
              </div>

              {selectedReport.photo && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Evidence Photo</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                        disabled={imageZoom <= 0.5}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Zoom Out"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                      </button>
                      <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setImageZoom(1)}
                        disabled={imageZoom === 1}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                        disabled={imageZoom >= 3}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Zoom In"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div 
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[32rem]"
                    style={{ cursor: imageZoom > 1 ? 'move' : 'default' }}
                  >
                    <div className="flex justify-center items-center min-h-[200px]">
                      <img 
                        src={selectedReport.photo.startsWith('http') 
                          ? selectedReport.photo 
                          : `${import.meta.env.VITE_BASE_URL || 'http://localhost:8000'}/${selectedReport.photo}`
                        }
                        alt="Evidence Photo"
                        className="max-h-96 rounded-lg transition-transform duration-200 ease-in-out"
                        style={{ 
                          transform: `scale(${imageZoom})`,
                          transformOrigin: 'center center',
                          imageRendering: imageZoom > 1 ? 'high-quality' : 'auto'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center break-all">
                    {selectedReport.photo}
                  </p>
                </div>
              )}

              {/* Staff Remarks - Permission: view_staff_remarks */}
              {hasPermission(currentUser, 'view_staff_remarks') && selectedReport.staff_remarks && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Staff Remarks</h3>
                  <p className="text-base text-gray-900 bg-blue-50 p-4 rounded-lg">{selectedReport.staff_remarks}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ViewModal>

      {/* Status Change with Remark Modal */}
      <FormModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setStaffRemarks('');
        }}
        onSubmit={(e) => {
          e.preventDefault();
          confirmStatusChange();
        }}
        title={`Change Status to ${newStatus}`}
        submitText="Confirm"
        submitVariant={newStatus === 'Resolved' ? 'success' : newStatus === 'Rejected' ? 'danger' : 'info'}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Report ID</h3>
                <p className="text-base text-gray-900 font-semibold">{selectedReport?.report_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Status</h3>
                <Badge variant={
                  selectedReport?.status === 'Resolved' ? 'resolved' :
                  selectedReport?.status === 'In Progress' ? 'info' :
                  selectedReport?.status === 'Pending' ? 'pending' : 'rejected'
                }>
                  {selectedReport?.status}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Reporter</h3>
              <p className="text-base text-gray-900">{selectedReport?.reporter_name}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">Status Change</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You are about to change the status to <strong>"{newStatus}"</strong>. Please provide a remark below.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              value={staffRemarks}
              onChange={(e) => setStaffRemarks(e.target.value)}
              placeholder={
                newStatus === 'Rejected' ? 'Enter reason for rejection...' :
                newStatus === 'In Progress' ? 'Enter action plan or notes...' :
                'Enter resolution details...'
              }
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {newStatus === 'Rejected' ? 'Explain why this report is being rejected' :
               newStatus === 'In Progress' ? 'Describe the actions being taken' :
               'Describe how the issue was resolved'}
            </p>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ReportsPage;
