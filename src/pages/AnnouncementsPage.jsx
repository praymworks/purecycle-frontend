import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Input, Select, Toast } from '../components/ui';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import api from '../services/api';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'Moderate',
    startDate: '',
    endDate: '',
    status: 'Draft',
    attachments: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [viewingDocument, setViewingDocument] = useState(null);

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, [searchTerm, filterStatus, filterPriority]);

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Fetch announcements with filters
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      
      const response = await api.announcements.getAll(params);
      
      // Transform backend data to frontend format
      const transformedData = response.data.data.map(ann => ({
        id: ann.id,
        announcement_id: ann.announcement_id,
        title: ann.title,
        message: ann.message,
        priority: ann.priority,
        status: ann.status,
        startDate: ann.start_date,
        endDate: ann.end_date,
        datePosted: formatDate(ann.date_posted),
        postedBy: ann.created_by?.fullname || 'Unknown',
        attachments: ann.attachments || [],
        created_by: ann.created_by
      }));
      
      setAnnouncements(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    {
      header: 'Announcement ID',
      accessor: 'announcement_id',
      render: (row) => (
        <span className="font-mono text-sm text-gray-600">{row.announcement_id}</span>
      ),
    },
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{row.title}</span>
        </div>
      ),
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
            row.status === 'Active' ? 'success' : 
            row.status === 'Draft' ? 'warning' :
            row.status === 'Expired' ? 'danger' : 'default'
          }
          size="xs"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Date Posted',
      accessor: 'datePosted',
    },
    {
      header: 'Posted By',
      accessor: 'postedBy',
    },
  ];

  const handleView = async (announcement) => {
    try {
      const response = await api.announcements.getById(announcement.id);
      const ann = response.data;
      
      setSelectedAnnouncement({
        ...announcement,
        ...ann,
        startDate: formatDate(ann.start_date),
        endDate: formatDate(ann.end_date),
        datePosted: formatDate(ann.date_posted),
        postedBy: ann.created_by?.fullname || 'Unknown',
        attachments: ann.attachments || []
      });
      setShowViewModal(true);
    } catch (err) {
      console.error('Error fetching announcement details:', err);
      showToast('Failed to load announcement details', 'error');
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      message: '',
      priority: 'Moderate',
      startDate: '',
      endDate: '',
      status: 'Draft',
      attachments: []
    });
    setSelectedFiles([]);
    setUploadedAttachments([]);
    setShowCreateModal(true);
  };

  const handleEdit = async (announcement) => {
    try {
      // Fetch full details to get the raw date format
      const response = await api.announcements.getById(announcement.id);
      const ann = response.data;
      
      setSelectedAnnouncement(announcement);
      setFormData({
        title: ann.title,
        message: ann.message,
        priority: ann.priority,
        startDate: ann.start_date, // Use raw date from API (YYYY-MM-DD)
        endDate: ann.end_date,     // Use raw date from API (YYYY-MM-DD)
        status: ann.status,
        attachments: []
      });
      setSelectedFiles([]);
      // Set existing attachments if any
      setUploadedAttachments(ann.attachments || []);
      setShowEditModal(true);
    } catch (err) {
      console.error('Error fetching announcement for edit:', err);
      showToast('Failed to load announcement for editing', 'error');
    }
  };

  const handleDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    try {
      const announcementData = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status,
        attachments: uploadedAttachments // Use uploaded file URLs
      };
      
      await api.announcements.create(announcementData);
      setShowCreateModal(false);
      fetchAnnouncements();
      showToast('Announcement created successfully!', 'success');
      
      // Reset attachments
      setSelectedFiles([]);
      setUploadedAttachments([]);
    } catch (err) {
      console.error('Error creating announcement:', err);
      showToast(err.message || 'Failed to create announcement', 'error');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      const announcementData = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status,
        attachments: uploadedAttachments // Use uploaded file URLs (existing + new)
      };
      
      await api.announcements.update(selectedAnnouncement.id, announcementData);
      setShowEditModal(false);
      fetchAnnouncements();
      showToast('Announcement updated successfully!', 'success');
      
      // Reset attachments
      setSelectedFiles([]);
      setUploadedAttachments([]);
    } catch (err) {
      console.error('Error updating announcement:', err);
      showToast(err.message || 'Failed to update announcement', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.announcements.delete(selectedAnnouncement.id);
      setShowDeleteModal(false);
      fetchAnnouncements();
      showToast('Announcement deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting announcement:', err);
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Upload files immediately
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      for (const file of files) {
        const response = await api.uploads.uploadAnnouncementAttachment(file);
        uploadedUrls.push(response.data.url);
      }
      
      setUploadedAttachments([...uploadedAttachments, ...uploadedUrls]);
      showToast(`${files.length} file(s) uploaded successfully!`, 'success');
    } catch (err) {
      console.error('Error uploading files:', err);
      showToast(err.message || 'Failed to upload files', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...uploadedAttachments];
    newAttachments.splice(index, 1);
    setUploadedAttachments(newAttachments);
  };

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Urgent', label: 'Urgent' },
  ];

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Active', label: 'Active' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Archived', label: 'Archived' },
  ];

  if (loading && announcements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Create and manage system announcements</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              ...statusOptions
            ]}
          />
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: '', label: 'All Priorities' },
              ...priorityOptions
            ]}
          />
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Announcements Table */}
      <Table
        data={announcements}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search announcements..."
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        actions={(row) => (
          <>
            <Button size="xs" variant="ghost" onClick={() => handleView(row)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
            <Button size="xs" variant="ghost" onClick={() => handleEdit(row)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button size="xs" variant="danger" onClick={() => handleDelete(row)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </>
        )}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Announcement Details"
        size="lg"
      >
        {selectedAnnouncement && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
              <p className="text-lg font-semibold text-gray-900">{selectedAnnouncement.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                <Badge variant={
                  selectedAnnouncement.priority === 'Urgent' ? 'urgent' :
                  selectedAnnouncement.priority === 'Moderate' ? 'moderate' : 'default'
                }>
                  {selectedAnnouncement.priority}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge variant={selectedAnnouncement.status === 'Active' ? 'success' : 'default'}>
                  {selectedAnnouncement.status}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Message</h3>
              <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {selectedAnnouncement.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                <p className="text-base text-gray-900">{selectedAnnouncement.startDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                <p className="text-base text-gray-900">{selectedAnnouncement.endDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Posted By</h3>
                <p className="text-base text-gray-900">{selectedAnnouncement.postedBy}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date Posted</h3>
                <p className="text-base text-gray-900">{selectedAnnouncement.datePosted}</p>
              </div>
            </div>

            {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedAnnouncement.attachments.map((file, index) => {
                    // Determine file type from URL
                    const fileUrl = file.startsWith('http') ? file : `http://localhost:8000/uploads/announcements/${file}`;
                    const fileName = file.split('/').pop();
                    const extension = fileName.split('.').pop().toLowerCase();
                    
                    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
                    const isPDF = extension === 'pdf';
                    const isDoc = ['doc', 'docx'].includes(extension);
                    const isExcel = ['xls', 'xlsx'].includes(extension);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
                        <div className="flex items-start space-x-3">
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            {isImage && (
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                            {isPDF && (
                              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            )}
                            {isDoc && (
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {isExcel && (
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-900 truncate font-medium">{fileName}</p>
                            <p className="text-xs text-gray-500 uppercase mt-1">{extension}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => setViewingDocument(fileUrl)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <a
                            href={fileUrl}
                            download
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-center"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ViewModal>

      {/* Create Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCreate}
        title="Create New Announcement"
        submitText="Create Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter announcement title"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your announcement message..."
              rows={5}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={priorityOptions}
            required
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (Max 10MB each)
            </p>
            {uploading && (
              <div className="mt-2 text-sm text-blue-600 flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading files...
              </div>
            )}
            {uploadedAttachments.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                {uploadedAttachments.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-600 truncate flex-1">{url.split('/').pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Announcement"
        submitText="Update Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={priorityOptions}
            required
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (Max 10MB each)
            </p>
            {uploading && (
              <div className="mt-2 text-sm text-blue-600 flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading files...
              </div>
            )}
            {uploadedAttachments.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                {uploadedAttachments.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-600 truncate flex-1">{url.split('/').pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${selectedAnnouncement?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Document Viewer</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Document Content */}
            <div className="flex-1 overflow-hidden">
              {viewingDocument.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                // Image viewer
                <div className="h-full flex items-center justify-center bg-gray-100 p-4">
                  <img 
                    src={viewingDocument} 
                    alt="Attachment" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : viewingDocument.match(/\.pdf$/i) ? (
                // PDF viewer
                <iframe
                  src={viewingDocument}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              ) : viewingDocument.match(/\.(doc|docx|xls|xlsx)$/i) ? (
                // Office documents - Use Google Docs Viewer with fallback
                <div className="h-full flex flex-col">
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(viewingDocument)}&embedded=true`}
                    className="w-full flex-1 border-0"
                    title="Document Viewer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-full items-center justify-center bg-gray-50" style={{display: 'none'}}>
                    <div className="text-center max-w-md p-6">
                      <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Preview Loading...</h4>
                      <p className="text-gray-600 mb-4">
                        The document viewer is loading. If it doesn't load, please download the file to view it.
                      </p>
                      <a
                        href={viewingDocument}
                        download
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download File
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback for truly unsupported types
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <a
                      href={viewingDocument}
                      download
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">{viewingDocument.split('/').pop()}</p>
              <a
                href={viewingDocument}
                download
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
