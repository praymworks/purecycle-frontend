import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Input, Toast } from '../components/ui';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import api from '../services/api';

const ReportsPage = () => {
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

      
      {/* Reports Table */}
      <Table
        data={reports}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by reporter, type, location..."
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        actions={(row) => (
          <>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => handleView(row)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
            {row.status === 'Pending' && (
              <Button
                size="xs"
                variant="info"
                onClick={() => handleStatusChange(row, 'In Progress')}
              >
                Start
              </Button>
            )}
            {row.status === 'In Progress' && (
              <Button
                size="xs"
                variant="success"
                onClick={() => handleStatusChange(row, 'Resolved')}
              >
                Resolve
              </Button>
            )}
            {row.status !== 'Rejected' && row.status !== 'Resolved' && (
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleStatusChange(row, 'Rejected')}
              >
                Reject
              </Button>
            )}
          </>
        )}
      />

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
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Evidence Photo</h3>
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">{selectedReport.photo}</p>
                  </div>
                </div>
              )}

              {selectedReport.staff_remarks && (
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
