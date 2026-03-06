import React, { useState, useEffect } from 'react';
import { Badge, Avatar } from '../ui';
import { AlertModal } from '../modals';
import api from '../../services/api';

const TopNav = ({ user, onLogout, onPageChange }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch recent notifications and unread count
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch recent 5 notifications
      const notifResponse = await api.notifications.getAll({ per_page: 5 });
      
      if (notifResponse.success) {
        setNotifications(notifResponse.data.data || []);
      }

      // Fetch unread count
      const countResponse = await api.notifications.getUnreadCount();
      if (countResponse.success) {
        setUnreadCount(countResponse.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark notification as read when clicked
  const handleNotificationClick = async (notif) => {
    try {
      if (notif.unread) {
        await api.notifications.markAsRead(notif.id);
        // Refresh notifications
        fetchNotifications();
      }
      
      // Navigate to the action URL if available
      if (notif.action_url) {
        const page = notif.action_url.replace('/', '');
        onPageChange(page);
      }
      
      setShowNotifications(false);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setIsDeleting(true);
      const response = await api.notifications.deleteAll();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
        setShowNotifications(false);
        setShowClearAllModal(false);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">PURECYCLE</h1>
              <p className="text-xs text-gray-500">Waste Management System</p>
            </div>
          </div>
        </div>

        {/* Right: Actions and Profile */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="danger" size="sm" rounded>{unreadCount} new</Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${notif.unread ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
                            </div>
                            {notif.unread && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0 ml-2"></span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-2">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          onPageChange('notifications');
                        }}
                        className="flex-1 text-sm text-primary-600 hover:text-primary-700 font-medium text-center"
                      >
                        View all
                      </button>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setShowClearAllModal(true)}
                          className="flex-1 text-sm text-red-600 hover:text-red-700 font-medium text-center"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Avatar 
                src={user?.profilePath || user?.profile_path} 
                name={user?.fullname} 
                size="sm"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.fullname || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </a>
                   
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>

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
    </>
  );
};

export default TopNav;
