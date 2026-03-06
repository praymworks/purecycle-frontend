import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '../components/ui';
import { AlertModal } from '../components/modals';
import api from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, report, account, announcement, schedule, system, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    by_type: {},
    by_priority: {}
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        per_page: 100 // Fetch more for client-side filtering
      };

      // Add filters if needed (optional - we can also do client-side filtering)
      if (filter === 'unread') {
        params.unread = 'true';
      } else if (filter === 'read') {
        params.unread = 'false';
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.notifications.getAll(params);
      
      if (response.success) {
        setNotifications(response.data.data || []);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification statistics
  const fetchStats = async () => {
    try {
      const response = await api.notifications.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  };

  // Load notifications on component mount and when filters change
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filter, typeFilter, searchQuery]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const response = await api.notifications.markAsRead(id);
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, unread: false } : notif
          )
        );
        // Refresh stats
        fetchStats();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert(err.message || 'Failed to mark as read');
    }
  };

  // Mark notification as unread
  const markAsUnread = async (id) => {
    try {
      const response = await api.notifications.markAsUnread(id);
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, unread: true } : notif
          )
        );
        // Refresh stats
        fetchStats();
      }
    } catch (err) {
      console.error('Error marking notification as unread:', err);
      alert(err.message || 'Failed to mark as unread');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await api.notifications.markAllAsRead();
      if (response.success) {
        // Refresh notifications
        fetchNotifications();
        fetchStats();
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert(err.message || 'Failed to mark all as read');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (id) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  // Delete notification
  const deleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      setIsDeleting(true);
      const response = await api.notifications.delete(notificationToDelete);
      if (response.success) {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationToDelete));
        // Refresh stats
        fetchStats();
        // Close modal
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setIsDeleting(true);
      const response = await api.notifications.deleteAll();
      if (response.success) {
        // Clear local state
        setNotifications([]);
        setStats({
          total: 0,
          unread: 0,
          read: 0,
          by_type: {},
          by_priority: {}
        });
        // Close modal
        setShowClearAllModal(false);
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // Get type badge color
  const getTypeColor = (type) => {
    switch (type) {
      case 'report': return 'danger';
      case 'account': return 'info';
      case 'announcement': return 'primary';
      case 'schedule': return 'warning';
      case 'system': return 'secondary';
      case 'analytics': return 'success';
      case 'route': return 'info';
      default: return 'secondary';
    }
  };

  const unreadCount = stats.unread || 0;

  // Get sender info from notification
  const getSenderInfo = (notif) => {
    return {
      name: notif.sender_name || 'Unknown',
      role: notif.sender_role || 'User',
      avatar: notif.sender_avatar || 'U'
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchNotifications} variant="primary" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={() => setShowClearAllModal(true)} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({stats.unread})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'read'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Read ({stats.read})
            </button>
          </div>

          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Type:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('report')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'report'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setTypeFilter('account')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'account'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setTypeFilter('announcement')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'announcement'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setTypeFilter('schedule')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'schedule'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Schedules
            </button>
            <button
              onClick={() => setTypeFilter('system')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                typeFilter === 'system'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              System
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-sm text-gray-600">
                {searchQuery ? 'Try adjusting your search or filters' : 'You have no notifications matching the selected filters'}
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notif) => {
            const sender = getSenderInfo(notif);
            return (
              <Card key={notif.id} className={notif.unread ? 'border-l-4 border-l-blue-500' : ''}>
                <div className={`p-4 ${notif.unread ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        notif.unread ? 'bg-primary-600' : 'bg-gray-400'
                      }`}>
                        {sender.avatar}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900">{notif.title}</h3>
                            {notif.unread && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={getTypeColor(notif.type)} size="sm" rounded>
                              {notif.type}
                            </Badge>
                            <Badge variant={getPriorityColor(notif.priority)} size="sm" rounded>
                              {notif.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">{notif.time}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                      {notif.description && (
                        <p className="text-sm text-gray-600 mb-3">{notif.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="font-medium">{sender.name}</span>
                        <span>•</span>
                        <span>{sender.role}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {notif.action_url && (
                          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View Details →
                          </button>
                        )}
                        {notif.unread ? (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Mark as read
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notif.id)}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Mark as unread
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(notif.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      {notifications.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Delete Single Notification Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        onConfirm={deleteNotification}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Clear All Notifications Modal */}
      <AlertModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        onConfirm={clearAllNotifications}
        title="Clear All Notifications"
        message="Are you sure you want to clear all notifications? This will permanently delete all your notifications and cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default NotificationsPage;
